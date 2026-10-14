-- Original AgencyDesk automation. No provider calls or credentials live in SQL.
alter table public.leads
  add column phone text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  add column source text not null default 'website' check (length(trim(source)) between 1 and 100),
  add column email_opt_in boolean not null default false,
  add column whatsapp_opt_in boolean not null default false;

create table public.automation_rules (
  id uuid primary key default gen_random_uuid(), agency_id uuid not null references public.agencies(id), name text not null,
  event_type text not null check(event_type in ('inquiry_received','proposal_published','proposal_accepted')),
  channel text not null default 'email' check(channel in ('email','whatsapp')),
  template_key text not null check(template_key in ('inquiry_acknowledgment','proposal_notice','proposal_follow_up','proposal_accepted')),
  delay_minutes integer not null default 0 check(delay_minutes between 0 and 43200),
  approval_required boolean not null default true, enabled boolean not null default false,
  created_at timestamptz not null default now(), unique(agency_id,template_key)
);
create table public.message_jobs (
  id uuid primary key default gen_random_uuid(), agency_id uuid not null references public.agencies(id), rule_id uuid not null references public.automation_rules(id),
  event_id uuid not null references public.activity_events(id), lead_id uuid not null references public.leads(id),
  revision_id uuid references public.proposal_revisions(id), channel text not null check(channel in ('email','whatsapp')),
  recipient text not null, subject text not null, body text not null,
  portal_path text check(portal_path is null or portal_path ~ '^/portal/(proposals|projects)/[0-9a-f-]{36}$'),
  status text not null check(status in ('pending_approval','queued','processing','simulated','accepted','delivered','read','failed','uncertain','skipped','cancelled')),
  due_at timestamptz not null, attempts integer not null default 0 check(attempts between 0 and 5),
  lease_token uuid, lease_expires_at timestamptz, provider_message_id text, last_error text,
  approved_by uuid references auth.users(id), approved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(event_id,rule_id,channel),
  check ((status='processing' and lease_token is not null and lease_expires_at is not null)
    or (status<>'processing' and lease_token is null and lease_expires_at is null))
);
create table public.message_attempts (
  id uuid primary key default gen_random_uuid(), agency_id uuid not null references public.agencies(id), job_id uuid not null references public.message_jobs(id),
  attempt_number integer not null check(attempt_number between 1 and 5), lease_token uuid not null unique,
  started_at timestamptz not null default now(), finished_at timestamptz,
  outcome text not null default 'processing' check(outcome in ('processing','simulated','accepted','uncertain','retry','failed')),
  provider_message_id text, error_code text, unique(job_id,attempt_number)
);
create table private.provider_event_inbox (
  id uuid primary key default gen_random_uuid(), provider text not null, event_key text not null,
  job_id uuid references public.message_jobs(id), payload jsonb not null,
  received_at timestamptz not null default now(), processed_at timestamptz,
  unique(provider,event_key)
);
create index automation_rules_agency on public.automation_rules(agency_id);
create index message_jobs_agency on public.message_jobs(agency_id);
create index message_attempts_agency on public.message_attempts(agency_id);
create index message_jobs_due on public.message_jobs(due_at,id) where status='queued';
create index message_jobs_leases on public.message_jobs(lease_expires_at) where status='processing';
create index message_jobs_lead on public.message_jobs(lead_id,created_at desc);
create index message_jobs_revision on public.message_jobs(revision_id);
create index message_jobs_rule on public.message_jobs(rule_id);
create index message_jobs_approver on public.message_jobs(approved_by);
create unique index message_jobs_provider_identity on public.message_jobs(channel,provider_message_id) where provider_message_id is not null;
create index message_attempts_job on public.message_attempts(job_id,started_at desc);
create index provider_event_job on private.provider_event_inbox(job_id);
create index provider_event_unprocessed_identity on private.provider_event_inbox(provider,(payload->>'message_id')) where processed_at is null;

alter table public.automation_rules enable row level security;
alter table public.message_jobs enable row level security;
alter table public.message_attempts enable row level security;
alter table private.provider_event_inbox enable row level security;
revoke all on public.automation_rules,public.message_jobs,public.message_attempts from public,anon,authenticated,service_role;
revoke all on private.provider_event_inbox from public,anon,authenticated,service_role;
grant select on public.automation_rules,public.message_jobs,public.message_attempts to authenticated;
-- Worker needs template identities only; job mutations remain scoped RPCs.
grant select on public.automation_rules to service_role;
create policy staff_read_rules on public.automation_rules for select to authenticated using (agency_id=(select private.staff_agency()));
create policy staff_read_jobs on public.message_jobs for select to authenticated using (agency_id=(select private.staff_agency()));
create policy staff_read_attempts on public.message_attempts for select to authenticated using (agency_id=(select private.staff_agency()));

-- Every workspace receives its own disabled rules. New workspaces inherit the same defaults.
create function private.seed_automation_rules(p_agency_id uuid) returns void
language sql security definer set search_path='' as $$
 insert into public.automation_rules(agency_id,name,event_type,template_key,delay_minutes)
 select p_agency_id,name,event_type,template_key,delay_minutes from (values
 ('Inquiry acknowledgment','inquiry_received','inquiry_acknowledgment',0),
 ('Proposal notice','proposal_published','proposal_notice',0),
 ('Proposal follow-up','proposal_published','proposal_follow_up',4320),
 ('Accepted proposal confirmation','proposal_accepted','proposal_accepted',0)
 ) defaults(name,event_type,template_key,delay_minutes)
 on conflict(agency_id,template_key) do nothing
$$;
create function private.seed_agency_automation() returns trigger
language plpgsql security definer set search_path='' as $$ begin
 perform private.seed_automation_rules(new.id); return new;
end $$;
revoke all on function private.seed_automation_rules(uuid),private.seed_agency_automation() from public,anon,authenticated,service_role;
select private.seed_automation_rules(id) from public.agencies;
create trigger seed_agency_automation after insert on public.agencies
for each row execute function private.seed_agency_automation();

-- Derive child ownership and reject inconsistent references even under service access.
create function private.guard_message_agency() returns trigger
language plpgsql security definer set search_path='' as $$
declare parent uuid; linked uuid; begin
 if tg_op='UPDATE' and new.agency_id is distinct from old.agency_id then raise exception 'Workspace ownership is immutable'; end if;
 if tg_table_name='message_jobs' then
   select agency_id into parent from public.leads where id=new.lead_id;
   select agency_id into linked from public.automation_rules where id=new.rule_id;
   if linked is distinct from parent then raise exception 'Rule belongs to another workspace'; end if;
   select agency_id into linked from public.activity_events where id=new.event_id;
   if linked is distinct from parent then raise exception 'Event belongs to another workspace'; end if;
   if new.revision_id is not null then
     select agency_id into linked from public.proposal_revisions where id=new.revision_id;
     if linked is distinct from parent then raise exception 'Revision belongs to another workspace'; end if;
   end if;
 else
   select agency_id into parent from public.message_jobs where id=new.job_id;
 end if;
 if parent is null or (new.agency_id is not null and new.agency_id<>parent) then raise exception 'Invalid workspace relationship'; end if;
 new.agency_id:=parent; return new;
end $$;
revoke all on function private.guard_message_agency() from public,anon,authenticated,service_role;
create trigger guard_message_agency before insert or update on public.message_jobs
for each row execute function private.guard_message_agency();
create trigger guard_message_agency before insert or update on public.message_attempts
for each row execute function private.guard_message_agency();

-- Return a stable explanation; NULL means the frozen job remains eligible.
create function private.message_job_ineligibility(p_job public.message_jobs) returns text
language plpgsql security definer set search_path='' as $$
declare l public.leads; r public.proposal_revisions; s public.proposal_series; rule public.automation_rules;
begin
 select * into l from public.leads where id=p_job.lead_id;
 select * into rule from public.automation_rules where id=p_job.rule_id;
 if l.id is null or rule.id is null or l.agency_id is distinct from p_job.agency_id or rule.agency_id is distinct from p_job.agency_id then return 'workspace_mismatch'; end if;
 if not rule.enabled then return 'rule_disabled'; end if;
 if rule.channel<>p_job.channel then return 'rule_channel_changed'; end if;
 if rule.approval_required and p_job.status in ('queued','processing') and p_job.approved_at is null then return 'approval_required'; end if;
 if l.archived_at is not null then return 'lead_archived'; end if;
 if l.status='lost' or (l.status='won' and rule.template_key<>'proposal_accepted') then return 'lead_closed'; end if;
 if p_job.channel='email' then
   if not l.email_opt_in then return 'email_consent_missing'; end if;
   if trim(l.email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return 'email_invalid'; end if;
   if lower(trim(l.email))<>p_job.recipient then return 'recipient_changed'; end if;
 else
   if not l.whatsapp_opt_in then return 'whatsapp_consent_missing'; end if;
   if l.phone is null then return 'phone_missing'; end if;
   if l.phone<>p_job.recipient then return 'recipient_changed'; end if;
 end if;
 if rule.template_key<>'inquiry_acknowledgment' then
   select * into r from public.proposal_revisions where id=p_job.revision_id;
   if not found then return 'revision_missing'; end if;
   select * into s from public.proposal_series where id=r.series_id;
   if r.agency_id is distinct from p_job.agency_id or s.agency_id is distinct from p_job.agency_id or s.lead_id<>l.id or s.company_id is distinct from l.company_id then return 'proposal_ownership_changed'; end if;
   if rule.template_key='proposal_accepted' then
     if r.status<>'accepted' then return 'proposal_not_accepted'; end if;
   else
     if r.status<>'published' then return 'proposal_no_longer_current'; end if;
     if r.expires_at<=now() then return 'proposal_expired'; end if;
   end if;
   -- Portal notices require the actual lead recipient's live company membership.
   if not exists(select 1 from public.client_memberships m join auth.users u on u.id=m.user_id
       where m.company_id=s.company_id and m.agency_id=p_job.agency_id and m.active
       and lower(trim(u.email))=lower(trim(l.email))) then return 'recipient_membership_inactive'; end if;
 end if;
 return null;
end $$;

create function private.capture_automation_event() returns trigger
language plpgsql security definer set search_path='' as $$
declare rule public.automation_rules; l public.leads; j public.message_jobs; reason text;
begin
 if new.lead_id is null then return new; end if;
 if new.event_type in ('proposal_accepted','proposal_declined','proposal_published') then
   update public.message_jobs old_job set status='cancelled',last_error='proposal_decision_or_replacement',updated_at=now()
   from public.automation_rules r where old_job.rule_id=r.id and r.template_key in ('proposal_follow_up','proposal_notice')
     and old_job.agency_id=new.agency_id and old_job.lead_id=new.lead_id and old_job.status in ('pending_approval','queued');
 end if;
 select * into l from public.leads where id=new.lead_id;
 for rule in select * from public.automation_rules where agency_id=new.agency_id and enabled and event_type=new.event_type loop
   j.id=gen_random_uuid(); j.agency_id=l.agency_id; j.rule_id=rule.id; j.event_id=new.id; j.lead_id=l.id;
   j.revision_id=nullif(new.detail->>'revision_id','')::uuid;
   j.channel=rule.channel; j.recipient=case when rule.channel='email' then lower(trim(l.email)) else coalesce(l.phone,'') end;
   j.subject=case rule.template_key
     when 'inquiry_acknowledgment' then 'We received your inquiry'
     when 'proposal_notice' then 'Your AgencyDesk proposal is ready'
     when 'proposal_follow_up' then 'A reminder about your proposal'
     else 'Your proposal has been accepted' end;
   j.body=case rule.template_key
     when 'inquiry_acknowledgment' then 'Thank you for your inquiry. Our team will review your brief and get back to you.'
     when 'proposal_notice' then 'Your proposal is ready. Sign in to your client portal to review the scope and next steps.'
     when 'proposal_follow_up' then 'Your proposal is awaiting your review. Please sign in to your client portal before it expires.'
     else 'Thank you for accepting your proposal. Your project is now ready for our team to begin.' end;
   j.portal_path=case
     when rule.template_key='proposal_accepted' and new.project_id is not null then '/portal/projects/'||new.project_id::text
     when rule.template_key in ('proposal_notice','proposal_follow_up') then
       (select '/portal/proposals/'||series_id::text from public.proposal_revisions where id=j.revision_id)
     else null end;
   reason=private.message_job_ineligibility(j);
   insert into public.message_jobs(id,agency_id,rule_id,event_id,lead_id,revision_id,channel,recipient,subject,body,portal_path,status,due_at,last_error)
   values(j.id,j.agency_id,j.rule_id,j.event_id,j.lead_id,j.revision_id,j.channel,j.recipient,j.subject,j.body,j.portal_path,
     case when reason is not null then 'skipped' when rule.approval_required then 'pending_approval' else 'queued' end,
     now()+make_interval(mins=>rule.delay_minutes),reason)
   on conflict(event_id,rule_id,channel) do nothing;
 end loop;
 return new;
end $$;
create trigger capture_automation_event after insert on public.activity_events
for each row execute function private.capture_automation_event();

create function private.configure_automation_rule(p_rule_id uuid,p_enabled boolean,p_delay_minutes integer,p_approval_required boolean,p_channel text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 update public.automation_rules set enabled=p_enabled,delay_minutes=p_delay_minutes,approval_required=p_approval_required,channel=p_channel where id=p_rule_id and private.owns_agency(agency_id);
 if not found then raise exception 'Rule not found'; end if;
end $$;
create function private.approve_message_job(p_job_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; reason text;
begin
 if auth.uid() is null or not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
 select * into j from public.message_jobs where id=p_job_id and private.owns_agency(agency_id) for update;
 if not found or j.status<>'pending_approval' then return false; end if;
 reason=private.message_job_ineligibility(j);
 update public.message_jobs set status=case when reason is null then 'queued' else 'skipped' end,
   approved_by=case when reason is null then auth.uid() else null end,
   approved_at=case when reason is null then now() else null end,last_error=reason,updated_at=now() where id=j.id;
 return reason is null;
end $$;
create function private.cancel_message_job(p_job_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
 update public.message_jobs set status='cancelled',last_error='staff_cancelled',updated_at=now()
 where id=p_job_id and private.owns_agency(agency_id) and status in ('pending_approval','queued');
 return found;
end $$;

create function private.claim_message_jobs(p_limit integer,p_agency_id uuid) returns setof public.message_jobs
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; reason text;
begin
 if p_agency_id is null or not exists(select 1 from public.agencies where id=p_agency_id and intake_enabled) then raise exception 'Active workspace required'; end if;
 if p_limit is null or p_limit<1 or p_limit>100 then raise exception 'Limit must be 1 to 100'; end if;
 -- Unknown provider outcome: expired owners cannot safely cause another send.
 for j in select * from public.message_jobs where agency_id=p_agency_id and status='processing' and lease_expires_at<=now() for update skip locked loop
   update public.message_attempts set outcome='uncertain',finished_at=now(),error_code='lease_expired'
   where job_id=j.id and lease_token=j.lease_token and outcome='processing';
   update public.message_jobs set status='uncertain',lease_token=null,lease_expires_at=null,last_error='lease_expired',updated_at=now() where id=j.id;
 end loop;
 for j in select * from public.message_jobs where agency_id=p_agency_id and status='queued' and due_at<=now() order by due_at,id limit p_limit for update skip locked loop
   reason=private.message_job_ineligibility(j);
   if reason is not null or j.attempts>=5 then
     update public.message_jobs set status=case when reason is null then 'failed' else 'skipped' end,
       last_error=coalesce(reason,'attempts_exhausted'),updated_at=now() where id=j.id;
     continue;
   end if;
   update public.message_jobs set status='processing',attempts=attempts+1,lease_token=gen_random_uuid(),
     lease_expires_at=now()+interval '5 minutes',last_error=null,updated_at=now() where id=j.id returning * into j;
   insert into public.message_attempts(job_id,attempt_number,lease_token) values(j.id,j.attempts,j.lease_token);
   return next j;
 end loop;
end $$;

-- A provider may call back before the worker commits its acknowledgment.
create function private.reconcile_message_receipts(p_job_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; receipt private.provider_event_inbox; receipt_status text;
begin
 select * into j from public.message_jobs where id=p_job_id for update;
 if j.provider_message_id is null then return; end if;
 for receipt in select * from private.provider_event_inbox
   where processed_at is null and provider=case j.channel when 'email' then 'resend' else 'whatsapp' end
     and payload->>'message_id'=j.provider_message_id order by received_at,id for update skip locked loop
   receipt_status=receipt.payload->>'status';
   if (receipt_status='read' and j.status in ('accepted','delivered','uncertain'))
     or (receipt_status='delivered' and j.status in ('accepted','uncertain'))
     or (receipt_status='failed' and j.status in ('accepted','uncertain')) then
     update public.message_jobs set status=receipt_status,last_error=case when receipt_status='failed' then 'provider_receipt_failed' else null end,
       updated_at=now() where id=j.id returning * into j;
   end if;
   update private.provider_event_inbox set job_id=j.id,processed_at=now() where id=receipt.id;
 end loop;
end $$;

create function private.finish_message_job(p_job_id uuid,p_lease_token uuid,p_outcome text,p_provider_message_id text,p_error_code text,p_retry_after_seconds integer)
returns boolean language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; next_status text; delay_seconds integer;
begin
 if p_outcome is null or p_outcome not in ('simulated','accepted','uncertain','retry','failed') then raise exception 'Invalid outcome'; end if;
 if p_error_code is not null and p_error_code !~ '^[a-zA-Z0-9_:-]{1,100}$' then raise exception 'Use a redacted error code'; end if;
 if p_provider_message_id is not null and length(p_provider_message_id)>500 then raise exception 'Provider message id too long'; end if;
 if p_outcome='accepted' and coalesce(length(trim(p_provider_message_id)),0)=0 then raise exception 'Accepted outcome requires provider id'; end if;
 if p_outcome='simulated' and p_provider_message_id is not null then raise exception 'Simulation cannot have a provider id'; end if;
 select * into j from public.message_jobs where id=p_job_id and status='processing' and lease_token=p_lease_token and lease_expires_at>now() for update;
 if not found then return false; end if;
 next_status=case when p_outcome='retry' and j.attempts<5 then 'queued' when p_outcome='retry' then 'failed' else p_outcome end;
 delay_seconds=greatest(least(86400,coalesce(p_retry_after_seconds,0)),least(3600,(60*power(2,j.attempts-1))::integer));
 update public.message_attempts set outcome=p_outcome,finished_at=now(),provider_message_id=p_provider_message_id,error_code=p_error_code
 where job_id=j.id and lease_token=p_lease_token and outcome='processing';
 update public.message_jobs set status=next_status,lease_token=null,lease_expires_at=null,
   provider_message_id=p_provider_message_id,last_error=case when p_outcome='retry' and j.attempts>=5 then 'attempts_exhausted' else p_error_code end,
   due_at=case when next_status='queued' then now()+make_interval(secs=>delay_seconds) else due_at end,updated_at=now() where id=j.id;
 if next_status in ('accepted','uncertain') then perform private.reconcile_message_receipts(j.id); end if;
 return true;
end $$;

create function private.revalidate_message_job(p_job_id uuid,p_lease_token uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; reason text;
begin
 select * into j from public.message_jobs where id=p_job_id and status='processing' and lease_token=p_lease_token and lease_expires_at>now() for update;
 if not found then return false; end if;
 reason=private.message_job_ineligibility(j);
 if reason is null then return true; end if;
 update public.message_attempts set outcome='failed',finished_at=now(),error_code=reason where job_id=j.id and lease_token=p_lease_token;
 update public.message_jobs set status='skipped',lease_token=null,lease_expires_at=null,last_error=reason,updated_at=now() where id=j.id;
 return false;
end $$;

create function private.record_message_receipt(p_provider text,p_event_id text,p_provider_message_id text,p_status text) returns boolean
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; inbox_id uuid;
begin
 if p_provider is null or p_provider not in ('resend','whatsapp') or p_status is null or p_status not in ('delivered','read','failed')
   or coalesce(length(p_event_id),0) not between 1 and 500 or coalesce(length(p_provider_message_id),0) not between 1 and 500
   then raise exception 'Invalid receipt'; end if;
 insert into private.provider_event_inbox(provider,event_key,payload)
 values(p_provider,p_event_id,jsonb_build_object('message_id',p_provider_message_id,'status',p_status))
 on conflict(provider,event_key) do nothing returning id into inbox_id;
 if inbox_id is null then return false; end if;
 select * into j from public.message_jobs where provider_message_id=p_provider_message_id
   and channel=case p_provider when 'resend' then 'email' else 'whatsapp' end for update;
 if not found then return false; end if;
 update private.provider_event_inbox set job_id=j.id,processed_at=now() where id=inbox_id;
 if (p_status='read' and j.status in ('accepted','delivered','uncertain'))
   or (p_status='delivered' and j.status in ('accepted','uncertain'))
   or (p_status='failed' and j.status in ('accepted','uncertain')) then
   update public.message_jobs set status=p_status,last_error=case when p_status='failed' then 'provider_receipt_failed' else null end,updated_at=now() where id=j.id;
   return true;
 end if;
 return false;
end $$;

create function public.configure_automation_rule(p_rule_id uuid,p_enabled boolean,p_delay_minutes integer,p_approval_required boolean,p_channel text)
returns void language sql security invoker set search_path='' as $$ select private.configure_automation_rule(p_rule_id,p_enabled,p_delay_minutes,p_approval_required,p_channel) $$;
create function public.approve_message_job(p_job_id uuid) returns boolean language sql security invoker set search_path='' as $$ select private.approve_message_job(p_job_id) $$;
create function public.cancel_message_job(p_job_id uuid) returns boolean language sql security invoker set search_path='' as $$ select private.cancel_message_job(p_job_id) $$;
create function public.claim_message_jobs(p_limit integer default 20,p_agency_id uuid default null) returns setof public.message_jobs language sql security invoker set search_path='' as $$ select * from private.claim_message_jobs(p_limit,p_agency_id) $$;
create function public.finish_message_job(p_job_id uuid,p_lease_token uuid,p_outcome text,p_provider_message_id text default null,p_error_code text default null,p_retry_after_seconds integer default null)
returns boolean language sql security invoker set search_path='' as $$ select private.finish_message_job(p_job_id,p_lease_token,p_outcome,p_provider_message_id,p_error_code,p_retry_after_seconds) $$;
create function public.revalidate_message_job(p_job_id uuid,p_lease_token uuid) returns boolean language sql security invoker set search_path='' as $$ select private.revalidate_message_job(p_job_id,p_lease_token) $$;
create function public.record_message_receipt(p_provider text,p_event_id text,p_provider_message_id text,p_status text) returns boolean language sql security invoker set search_path='' as $$ select private.record_message_receipt(p_provider,p_event_id,p_provider_message_id,p_status) $$;

revoke execute on function private.message_job_ineligibility(public.message_jobs),private.capture_automation_event(),
 private.configure_automation_rule(uuid,boolean,integer,boolean,text),private.approve_message_job(uuid),private.cancel_message_job(uuid),
 private.claim_message_jobs(integer,uuid),private.finish_message_job(uuid,uuid,text,text,text,integer),
 public.configure_automation_rule(uuid,boolean,integer,boolean,text),public.approve_message_job(uuid),public.cancel_message_job(uuid),
 public.claim_message_jobs(integer,uuid),public.finish_message_job(uuid,uuid,text,text,text,integer) from public,anon,authenticated,service_role;
revoke execute on function private.revalidate_message_job(uuid,uuid),public.revalidate_message_job(uuid,uuid),
 private.record_message_receipt(text,text,text,text),public.record_message_receipt(text,text,text,text) from public,anon,authenticated,service_role;
revoke execute on function private.reconcile_message_receipts(uuid) from public,anon,authenticated,service_role;
grant execute on function private.configure_automation_rule(uuid,boolean,integer,boolean,text),private.approve_message_job(uuid),private.cancel_message_job(uuid),
 public.configure_automation_rule(uuid,boolean,integer,boolean,text),public.approve_message_job(uuid),public.cancel_message_job(uuid) to authenticated;
grant usage on schema private to service_role;
grant execute on function private.claim_message_jobs(integer,uuid),private.finish_message_job(uuid,uuid,text,text,text,integer),
 public.claim_message_jobs(integer,uuid),public.finish_message_job(uuid,uuid,text,text,text,integer) to service_role;
grant execute on function private.revalidate_message_job(uuid,uuid),public.revalidate_message_job(uuid,uuid),
 private.record_message_receipt(text,text,text,text),public.record_message_receipt(text,text,text,text) to service_role;

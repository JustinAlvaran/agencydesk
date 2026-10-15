-- Freeze provider routing for every queued message; no credentials are stored in SQL.
alter table public.automation_rules add column provider text;
update public.automation_rules set provider=case channel when 'email' then 'resend' else 'whatsapp' end;
alter table public.automation_rules alter column provider set not null;
alter table public.automation_rules alter column provider set default 'resend';
alter table public.automation_rules add constraint automation_rule_provider_channel
 check((channel='email' and provider='resend') or (channel='whatsapp' and provider in ('whatsapp','zoko')));

alter table public.message_jobs add column provider text;
update public.message_jobs set provider=case channel when 'email' then 'resend' else 'whatsapp' end;
alter table public.message_jobs alter column provider set not null;
alter table public.message_jobs add constraint message_job_provider_channel
 check((channel='email' and provider='resend') or (channel='whatsapp' and provider in ('whatsapp','zoko')));

alter table public.message_attempts add column provider text;
update public.message_attempts a set provider=j.provider from public.message_jobs j where j.id=a.job_id;
alter table public.message_attempts alter column provider set not null;
alter table public.message_attempts add constraint message_attempt_provider check(provider in ('resend','whatsapp','zoko'));

drop index public.message_jobs_provider_identity;
create unique index message_jobs_provider_identity on public.message_jobs(provider,provider_message_id) where provider_message_id is not null;

create or replace function private.guard_message_agency() returns trigger
language plpgsql security definer set search_path='' as $$
declare parent uuid; linked uuid; expected_provider text; begin
 if tg_op='UPDATE' and new.provider is distinct from old.provider then raise exception 'Message provider is immutable'; end if;
 if tg_op='UPDATE' and new.agency_id is distinct from old.agency_id then raise exception 'Workspace ownership is immutable'; end if;
 if tg_table_name='message_jobs' then
   select agency_id into parent from public.leads where id=new.lead_id;
   select agency_id,provider into linked,expected_provider from public.automation_rules where id=new.rule_id;
   if tg_op='INSERT' then
     if new.provider is not null and new.provider is distinct from expected_provider then raise exception 'Message provider must match rule'; end if;
     new.provider:=expected_provider;
   end if;
   if linked is distinct from parent then raise exception 'Rule belongs to another workspace'; end if;
   select agency_id into linked from public.activity_events where id=new.event_id;
   if linked is distinct from parent then raise exception 'Event belongs to another workspace'; end if;
   if new.revision_id is not null then
     select agency_id into linked from public.proposal_revisions where id=new.revision_id;
     if linked is distinct from parent then raise exception 'Revision belongs to another workspace'; end if;
   end if;
 else
   select agency_id,provider into parent,expected_provider from public.message_jobs where id=new.job_id;
   if new.provider is not null and new.provider is distinct from expected_provider then raise exception 'Attempt provider must match job'; end if;
   new.provider:=expected_provider;
 end if;
 if parent is null or (new.agency_id is not null and new.agency_id<>parent) then raise exception 'Invalid workspace relationship'; end if;
 new.agency_id:=parent; return new;
end $$;
create or replace function private.message_job_ineligibility(p_job public.message_jobs) returns text
language plpgsql security definer set search_path='' as $$
declare l public.leads; r public.proposal_revisions; s public.proposal_series; rule public.automation_rules;
begin
 select * into l from public.leads where id=p_job.lead_id;
 select * into rule from public.automation_rules where id=p_job.rule_id;
 if l.id is null or rule.id is null or l.agency_id is distinct from p_job.agency_id or rule.agency_id is distinct from p_job.agency_id then return 'workspace_mismatch'; end if;
 if not rule.enabled then return 'rule_disabled'; end if;
 if rule.channel<>p_job.channel then return 'rule_channel_changed'; end if;
 if rule.provider<>p_job.provider then return 'rule_provider_changed'; end if;
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
create or replace function private.capture_automation_event() returns trigger
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
   j.channel=rule.channel; j.provider=rule.provider; j.recipient=case when rule.channel='email' then lower(trim(l.email)) else coalesce(l.phone,'') end;
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
   insert into public.message_jobs(id,agency_id,rule_id,event_id,lead_id,revision_id,channel,provider,recipient,subject,body,portal_path,status,due_at,last_error)
   values(j.id,j.agency_id,j.rule_id,j.event_id,j.lead_id,j.revision_id,j.channel,j.provider,j.recipient,j.subject,j.body,j.portal_path,
     case when reason is not null then 'skipped' when rule.approval_required then 'pending_approval' else 'queued' end,
     now()+make_interval(mins=>rule.delay_minutes),reason)
   on conflict(event_id,rule_id,channel) do nothing;
 end loop;
 return new;
end $$;

-- Replace the old signature, retaining five-argument calls through one default.
-- A single signature avoids PostgREST overload ambiguity.
drop function public.configure_automation_rule(uuid,boolean,integer,boolean,text);
drop function private.configure_automation_rule(uuid,boolean,integer,boolean,text);
create function private.configure_automation_rule(p_rule_id uuid,p_enabled boolean,p_delay_minutes integer,p_approval_required boolean,p_channel text,p_provider text default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 update public.automation_rules set enabled=p_enabled,delay_minutes=p_delay_minutes,approval_required=p_approval_required,
   provider=coalesce(p_provider,case when channel=p_channel then provider when p_channel='email' then 'resend' else 'whatsapp' end),channel=p_channel
   where id=p_rule_id and private.owns_agency(agency_id);
 if not found then raise exception 'Rule not found'; end if;
end $$;
create function public.configure_automation_rule(p_rule_id uuid,p_enabled boolean,p_delay_minutes integer,p_approval_required boolean,p_channel text,p_provider text default null)
returns void language sql security invoker set search_path='' as $$
 select private.configure_automation_rule(p_rule_id,p_enabled,p_delay_minutes,p_approval_required,p_channel,p_provider)
$$;
revoke execute on function private.configure_automation_rule(uuid,boolean,integer,boolean,text,text),public.configure_automation_rule(uuid,boolean,integer,boolean,text,text)
 from public,anon,authenticated,service_role;
grant execute on function private.configure_automation_rule(uuid,boolean,integer,boolean,text,text),public.configure_automation_rule(uuid,boolean,integer,boolean,text,text) to authenticated;

-- The trusted worker may reconcile Zoko only after an authenticated provider API
-- lookup. Raw unauthenticated Zoko callbacks are never accepted by the Edge API.
create or replace function private.reconcile_message_receipts(p_job_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; receipt private.provider_event_inbox; receipt_status text;
begin
 select * into j from public.message_jobs where id=p_job_id for update;
 if j.provider_message_id is null then return; end if;
 for receipt in select * from private.provider_event_inbox
   where processed_at is null and provider=j.provider
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
create or replace function private.record_message_receipt(p_provider text,p_event_id text,p_provider_message_id text,p_status text) returns boolean
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; inbox_id uuid;
begin
 if p_provider is null or p_provider not in ('resend','whatsapp','zoko') or p_status is null or p_status not in ('delivered','read','failed')
   or coalesce(length(p_event_id),0) not between 1 and 500 or coalesce(length(p_provider_message_id),0) not between 1 and 500
   then raise exception 'Invalid receipt'; end if;
 insert into private.provider_event_inbox(provider,event_key,payload)
 values(p_provider,p_event_id,jsonb_build_object('message_id',p_provider_message_id,'status',p_status))
 on conflict(provider,event_key) do nothing returning id into inbox_id;
 if inbox_id is null then return false; end if;
 select * into j from public.message_jobs where provider_message_id=p_provider_message_id
   and provider=p_provider for update;
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
create or replace function private.retry_message_job(p_job_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; r public.automation_rules; begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 select * into j from public.message_jobs where id=p_job_id and private.owns_agency(agency_id) for update;
 if not found or j.status<>'failed' or j.attempts>=5 or j.provider_message_id is not null
    or j.last_error is null or j.last_error not in ('email_not_configured','whatsapp_not_configured','whatsapp_template_not_configured','portal_origin_not_configured','invalid_delivery_mode','unsupported_email_provider','unsupported_whatsapp_provider','message_provider_mismatch','zoko_not_configured','zoko_template_not_configured','provider_authentication_failed','provider_rejected','whatsapp_parameter_too_long') then return false; end if;
 if private.message_job_ineligibility(j) is not null then return false; end if;
 select * into r from public.automation_rules where id=j.rule_id;
 update public.message_jobs set status=case when r.approval_required then 'pending_approval' else 'queued' end,
   approved_by=null,approved_at=null,last_error=null,due_at=now(),updated_at=now() where id=j.id;
 return true;
end $$;

-- Existing RPC/table grants and tenant RLS remain unchanged.
notify pgrst,'reload schema';

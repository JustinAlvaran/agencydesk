-- Recipient-level withdrawals apply to duplicate leads inside one agency only.
create table private.recipient_suppressions (
 agency_id uuid not null references public.agencies(id),
 channel text not null check(channel in ('email','whatsapp')),
 recipient text not null check(length(recipient) between 1 and 320),
 reason text not null check(reason in ('permission_withdrawn','staff_opt_out')),
 lead_id uuid not null references public.leads(id),
 actor_id uuid references auth.users(id), created_at timestamptz not null default now(),
 primary key(agency_id,channel,recipient)
);
alter table private.recipient_suppressions enable row level security;
revoke all on private.recipient_suppressions from public,anon,authenticated,service_role;

create function private.suppress_recipient(p_agency uuid,p_lead uuid,p_channel text,p_recipient text,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_channel='email' then p_recipient=lower(trim(p_recipient)); end if;
 if p_recipient is null or p_recipient='' then return; end if;
 insert into private.recipient_suppressions(agency_id,channel,recipient,reason,lead_id,actor_id)
 values(p_agency,p_channel,p_recipient,p_reason,p_lead,auth.uid())
 on conflict(agency_id,channel,recipient) do nothing;
 update public.message_jobs set status='cancelled',last_error='recipient_suppressed',updated_at=now()
 where agency_id=p_agency and channel=p_channel and recipient=p_recipient
 and status in ('pending_approval','queued');
end $$;

create function private.capture_recipient_withdrawal() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.email_opt_in and not new.email_opt_in then
  perform private.suppress_recipient(old.agency_id,old.id,'email',old.email,'permission_withdrawn');
 end if;
 if old.whatsapp_opt_in and not new.whatsapp_opt_in then
  perform private.suppress_recipient(old.agency_id,old.id,'whatsapp',old.phone,'permission_withdrawn');
 end if;
 return new;
end $$;
create trigger recipient_withdrawal after update of email_opt_in,whatsapp_opt_in on public.leads
 for each row execute function private.capture_recipient_withdrawal();

create function private.suppress_lead_recipient(p_lead_id uuid,p_channel text)
returns boolean language plpgsql security definer set search_path='' as $$
declare l public.leads; recipient text;
begin
 if auth.uid() is null or not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
 if p_channel is null or p_channel not in ('email','whatsapp') then raise exception 'Invalid messaging channel' using errcode='22023'; end if;
 select * into l from public.leads where id=p_lead_id and private.owns_agency(agency_id) and archived_at is null for update;
 if not found then raise exception 'Lead unavailable' using errcode='42501'; end if;
 recipient=case when p_channel='email' then lower(trim(l.email)) else l.phone end;
 if recipient is null or recipient='' then raise exception 'Lead recipient is missing' using errcode='22023'; end if;
 perform private.suppress_recipient(l.agency_id,l.id,p_channel,recipient,'staff_opt_out');
 if p_channel='email' then update public.leads set email_opt_in=false where id=l.id;
 else update public.leads set whatsapp_opt_in=false where id=l.id; end if;
 insert into public.activity_events(lead_id,actor_id,event_type,detail)
 values(l.id,auth.uid(),'lead_recipient_suppressed',jsonb_build_object('channel',p_channel));
 return true;
end $$;

create function private.clear_lead_recipient_suppression(p_lead_id uuid,p_channel text)
returns boolean language plpgsql security definer set search_path='' as $$
declare l public.leads; v_recipient text; removed integer;
begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_channel is null or p_channel not in ('email','whatsapp') then raise exception 'Invalid messaging channel' using errcode='22023'; end if;
 select * into l from public.leads where id=p_lead_id and private.owns_agency(agency_id) and archived_at is null for update;
 if not found then raise exception 'Lead unavailable' using errcode='42501'; end if;
 v_recipient=case when p_channel='email' then lower(trim(l.email)) else l.phone end;
 if v_recipient is null or v_recipient='' then raise exception 'Lead recipient is missing' using errcode='22023'; end if;
 delete from private.recipient_suppressions where agency_id=l.agency_id and channel=p_channel and recipient=v_recipient;
 get diagnostics removed=row_count;
 if removed>0 then
  insert into public.activity_events(lead_id,actor_id,event_type,detail)
  values(l.id,auth.uid(),'lead_recipient_suppression_cleared',jsonb_build_object('channel',p_channel));
 end if;
 return removed>0;
end $$;

create function private.lead_message_suppression(p_lead_id uuid)
returns table(channel text,suppressed boolean,reason text)
language plpgsql security definer set search_path='' as $$
declare l public.leads;
begin
 if auth.uid() is null or not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
 select * into l from public.leads where id=p_lead_id and private.owns_agency(agency_id) and archived_at is null;
 if not found then raise exception 'Lead unavailable' using errcode='42501'; end if;
 return query select c.channel,s.recipient is not null,s.reason
 from (values('email'::text,lower(trim(l.email))),('whatsapp'::text,l.phone)) c(channel,recipient)
 left join private.recipient_suppressions s on s.agency_id=l.agency_id and s.channel=c.channel and s.recipient=c.recipient;
end $$;

create function public.suppress_lead_recipient(p_lead_id uuid,p_channel text) returns boolean
language sql security invoker set search_path='' as $$select private.suppress_lead_recipient(p_lead_id,p_channel)$$;
create function public.admin_clear_lead_recipient_suppression(p_lead_id uuid,p_channel text) returns boolean
language sql security invoker set search_path='' as $$select private.clear_lead_recipient_suppression(p_lead_id,p_channel)$$;
create function public.lead_message_suppression(p_lead_id uuid) returns table(channel text,suppressed boolean,reason text)
language sql security invoker set search_path='' as $$select * from private.lead_message_suppression(p_lead_id)$$;

revoke all on function private.suppress_recipient(uuid,uuid,text,text,text),private.capture_recipient_withdrawal() from public,anon,authenticated,service_role;
revoke all on function private.suppress_lead_recipient(uuid,text),private.clear_lead_recipient_suppression(uuid,text),private.lead_message_suppression(uuid),public.suppress_lead_recipient(uuid,text),public.admin_clear_lead_recipient_suppression(uuid,text),public.lead_message_suppression(uuid) from public,anon,service_role;
grant execute on function private.suppress_lead_recipient(uuid,text),private.clear_lead_recipient_suppression(uuid,text),private.lead_message_suppression(uuid),public.suppress_lead_recipient(uuid,text),public.admin_clear_lead_recipient_suppression(uuid,text),public.lead_message_suppression(uuid) to authenticated;

notify pgrst,'reload schema';

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
 if exists(select 1 from private.recipient_suppressions suppressed where suppressed.agency_id=p_job.agency_id and suppressed.channel=p_job.channel and suppressed.recipient=p_job.recipient) then return 'recipient_suppressed'; end if;
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

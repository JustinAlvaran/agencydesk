-- Gmail uses the existing approved email outbox. No account or rule is enabled.
alter table public.automation_rules drop constraint automation_rule_provider_channel;
alter table public.automation_rules add constraint automation_rule_provider_channel
 check((channel='email' and provider in ('resend','gmail')) or (channel='whatsapp' and provider in ('whatsapp','zoko','waha')));
alter table public.message_jobs drop constraint message_job_provider_channel;
alter table public.message_jobs add constraint message_job_provider_channel
 check((channel='email' and provider in ('resend','gmail')) or (channel='whatsapp' and provider in ('whatsapp','zoko','waha')));
alter table public.message_attempts drop constraint message_attempt_provider;
alter table public.message_attempts add constraint message_attempt_provider check(provider in ('resend','gmail','whatsapp','zoko','waha'));
-- Existing immutable routing, tenant grants and RLS are unchanged. Gmail's API
-- returns acceptance; no Gmail delivery webhook is claimed or trusted here.
notify pgrst,'reload schema';
create or replace function private.retry_message_job(p_job_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; r public.automation_rules; begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 select * into j from public.message_jobs where id=p_job_id and private.owns_agency(agency_id) for update;
 if not found or j.status<>'failed' or j.attempts>=5 or j.provider_message_id is not null
    or j.last_error is null or j.last_error not in ('email_not_configured','whatsapp_not_configured','whatsapp_template_not_configured','portal_origin_not_configured','invalid_delivery_mode','unsupported_email_provider','unsupported_whatsapp_provider','message_provider_mismatch','zoko_not_configured','zoko_template_not_configured','waha_not_configured','gmail_not_configured','gmail_authentication_failed','gmail_token_unavailable','provider_authentication_failed','provider_rejected','whatsapp_parameter_too_long') then return false; end if;
 if private.message_job_ineligibility(j) is not null then return false; end if;
 select * into r from public.automation_rules where id=j.rule_id;
 update public.message_jobs set status=case when r.approval_required then 'pending_approval' else 'queued' end,
   approved_by=null,approved_at=null,last_error=null,due_at=now(),updated_at=now() where id=j.id;
 return true;
end $$;

-- Existing RPC/table grants and tenant RLS remain unchanged.
notify pgrst,'reload schema';

-- WAHA is an optional transport; this migration enables no rules or sessions.
-- Existing provider immutability, agency RLS and RPC grants are preserved.
alter table public.automation_rules drop constraint automation_rule_provider_channel;
alter table public.automation_rules add constraint automation_rule_provider_channel
 check((channel='email' and provider='resend') or (channel='whatsapp' and provider in ('whatsapp','zoko','waha')));
alter table public.message_jobs drop constraint message_job_provider_channel;
alter table public.message_jobs add constraint message_job_provider_channel
 check((channel='email' and provider='resend') or (channel='whatsapp' and provider in ('whatsapp','zoko','waha')));
alter table public.message_attempts drop constraint message_attempt_provider;
alter table public.message_attempts add constraint message_attempt_provider check(provider in ('resend','whatsapp','zoko','waha'));

-- Receipt mutation remains restricted to trusted backend RPCs. This does not
-- introduce an unauthenticated callback endpoint or an inbound-message importer.
create or replace function private.record_message_receipt(p_provider text,p_event_id text,p_provider_message_id text,p_status text) returns boolean
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; inbox_id uuid;
begin
 if p_provider is null or p_provider not in ('resend','whatsapp','zoko','waha') or p_status is null or p_status not in ('delivered','read','failed')
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
    or j.last_error is null or j.last_error not in ('email_not_configured','whatsapp_not_configured','whatsapp_template_not_configured','portal_origin_not_configured','invalid_delivery_mode','unsupported_email_provider','unsupported_whatsapp_provider','message_provider_mismatch','zoko_not_configured','zoko_template_not_configured','waha_not_configured','provider_authentication_failed','provider_rejected','whatsapp_parameter_too_long') then return false; end if;
 if private.message_job_ineligibility(j) is not null then return false; end if;
 select * into r from public.automation_rules where id=j.rule_id;
 update public.message_jobs set status=case when r.approval_required then 'pending_approval' else 'queued' end,
   approved_by=null,approved_at=null,last_error=null,due_at=now(),updated_at=now() where id=j.id;
 return true;
end $$;

-- Existing RPC/table grants and tenant RLS remain unchanged.
notify pgrst,'reload schema';

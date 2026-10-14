-- Persist explicit channel permission before the event queues an acknowledgment.
create function public.submit_inquiry_with_preferences(contact_name text,email text,service text,brief text,budget_cents bigint,request_key text,phone text,email_opt_in boolean,whatsapp_opt_in boolean,target_agency_id uuid default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid; target uuid; begin
 select id into target from public.agencies where id=coalesce(target_agency_id,(select id from public.agencies where slug='agencydesk')) and intake_enabled;
 if target is null then raise exception 'Agency intake is unavailable'; end if;
 if contact_name is null or email is null or service is null or brief is null or budget_cents is null
    or length(trim(contact_name)) not between 1 and 100 or length(email)>254
    or email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(trim(service)) not between 1 and 100 or length(trim(brief)) not between 20 and 4000
    or budget_cents<10000 or budget_cents>100000000 or request_key is null or length(request_key) not between 16 and 128
    or (phone is not null and phone !~ '^\+[1-9][0-9]{7,14}$')
    or email_opt_in is null or whatsapp_opt_in is null or (whatsapp_opt_in and phone is null)
 then raise exception 'Invalid inquiry'; end if;
 perform pg_advisory_xact_lock(hashtextextended(request_key,0));
 if (select count(*) from private.inquiry_requests q where q.request_key=submit_inquiry_with_preferences.request_key and q.created_at>now()-interval '1 hour')>=5 then raise exception 'Inquiry rate limit exceeded' using errcode='P0001'; end if;
 insert into private.inquiry_requests(request_key) values(request_key);
 insert into public.leads(agency_id,contact_name,email,service,brief,budget_cents,phone,email_opt_in,whatsapp_opt_in,source)
 values(target,trim(contact_name),lower(trim(email)),trim(service),trim(brief),budget_cents,phone,email_opt_in,whatsapp_opt_in,'website') returning id into result;
 insert into public.activity_events(lead_id,event_type) values(result,'inquiry_received');
 return result;
end $$;
revoke execute on function public.submit_inquiry_with_preferences(text,text,text,text,bigint,text,text,boolean,boolean,uuid) from public,anon,authenticated;
grant execute on function public.submit_inquiry_with_preferences(text,text,text,text,bigint,text,text,boolean,boolean,uuid) to service_role;

-- One transaction accepts a complete bounded callback batch, including duplicates.
create function public.record_message_receipts(p_receipts jsonb) returns integer
language plpgsql security invoker set search_path='' as $$
declare item jsonb; total integer:=0; begin
 if jsonb_typeof(p_receipts) is distinct from 'array' or jsonb_array_length(p_receipts)>5000 then raise exception 'Invalid receipt batch'; end if;
 for item in select value from jsonb_array_elements(p_receipts) order by value->>'provider',value->>'message_id',value->>'event_id' loop
   perform private.record_message_receipt(item->>'provider',item->>'event_id',item->>'message_id',item->>'status');
   total=total+1;
 end loop;
 return total;
end $$;
revoke execute on function public.record_message_receipts(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.record_message_receipts(jsonb) to service_role;

create function private.retry_message_job(p_job_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; r public.automation_rules; begin
 if auth.uid() is null or not private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 select * into j from public.message_jobs where id=p_job_id and private.owns_agency(agency_id) for update;
 if not found or j.status<>'failed' or j.attempts>=5 or j.provider_message_id is not null
    or j.last_error is null or j.last_error not in ('email_not_configured','whatsapp_not_configured','whatsapp_template_not_configured','portal_origin_not_configured','invalid_delivery_mode','unsupported_email_provider','provider_authentication_failed','provider_rejected','whatsapp_parameter_too_long') then return false; end if;
 if private.message_job_ineligibility(j) is not null then return false; end if;
 select * into r from public.automation_rules where id=j.rule_id;
 update public.message_jobs set status=case when r.approval_required then 'pending_approval' else 'queued' end,
   approved_by=null,approved_at=null,last_error=null,due_at=now(),updated_at=now() where id=j.id;
 return true;
end $$;
create function public.retry_message_job(p_job_id uuid) returns boolean language sql security invoker set search_path='' as $$ select private.retry_message_job(p_job_id) $$;
revoke execute on function private.retry_message_job(uuid),public.retry_message_job(uuid) from public,anon,authenticated,service_role;
grant execute on function private.retry_message_job(uuid),public.retry_message_job(uuid) to authenticated;

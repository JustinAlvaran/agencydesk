-- A retry of the same confirmed inquiry must not create another lead or message job.
create table private.website_submissions (
  agency_id uuid not null references public.agencies(id) on delete cascade,
  submission_id uuid not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  lead_id uuid not null references public.leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (agency_id, submission_id)
);
create index website_submissions_lead_idx on private.website_submissions(lead_id);
alter table private.website_submissions enable row level security;
revoke all on private.website_submissions from public, anon, authenticated;
grant select, insert on private.website_submissions to service_role;

create function public.submit_website_inquiry(
  p_agency_id uuid, p_submission_id uuid, p_payload_hash text, p_request_key text,
  p_contact_name text, p_email text, p_service text, p_brief text, p_budget_cents bigint,
  p_phone text, p_email_opt_in boolean, p_whatsapp_opt_in boolean, p_source text
) returns uuid language plpgsql security invoker set search_path='' as $$
declare existing private.website_submissions; result uuid; begin
  if p_agency_id is null or p_submission_id is null or p_payload_hash is null
    or p_payload_hash !~ '^[a-f0-9]{64}$' or p_source is null or p_source not in ('website','website_chatbot')
  then raise exception 'Invalid submission'; end if;
  if not exists(select 1 from public.agencies where id=p_agency_id and intake_enabled)
  then raise exception 'Agency intake is unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_agency_id::text || ':' || p_submission_id::text, 0));
  select * into existing from private.website_submissions
    where agency_id=p_agency_id and submission_id=p_submission_id;
  if found then
    if existing.payload_hash<>p_payload_hash then
      raise exception 'Submission content changed' using errcode='23505';
    end if;
    return existing.lead_id;
  end if;
  result:=public.submit_inquiry_with_preferences(p_contact_name,p_email,p_service,p_brief,p_budget_cents,
    p_request_key,p_phone,p_email_opt_in,p_whatsapp_opt_in,p_agency_id);
  update public.leads set source=p_source where id=result and agency_id=p_agency_id;
  insert into private.website_submissions(agency_id,submission_id,payload_hash,lead_id)
    values(p_agency_id,p_submission_id,p_payload_hash,result);
  return result;
end $$;
revoke execute on function public.submit_website_inquiry(uuid,uuid,text,text,text,text,text,text,bigint,text,boolean,boolean,text)
  from public,anon,authenticated;
grant execute on function public.submit_website_inquiry(uuid,uuid,text,text,text,text,text,text,bigint,text,boolean,boolean,text)
  to service_role;

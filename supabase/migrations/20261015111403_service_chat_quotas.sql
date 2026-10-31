-- Only the authenticated server relay can reserve model capacity. No chat text.
create table private.service_chat_requests (
  id uuid primary key,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  session_hash text not null check(session_hash ~ '^[a-f0-9]{64}$'),
  network_hash text not null check(network_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  outcome text check(outcome in ('answered','unavailable','rejected'))
);
create index service_chat_agency_time_idx on private.service_chat_requests(agency_id,created_at);
alter table private.service_chat_requests enable row level security;
revoke all on private.service_chat_requests from public,anon,authenticated;
grant select,insert,update,delete on private.service_chat_requests to service_role;

create function public.reserve_service_chat(p_slug text,p_request_id uuid,p_session_hash text,p_network_hash text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare target uuid; current_time_value timestamptz:=clock_timestamp(); begin
  if p_request_id is null or p_session_hash is null or p_network_hash is null
    or p_session_hash !~ '^[a-f0-9]{64}$' or p_network_hash !~ '^[a-f0-9]{64}$'
  then raise exception 'Invalid admission request'; end if;
  select id into target from public.agencies where slug=p_slug;
  if target is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('service-chat:'||target::text,0));
  delete from private.service_chat_requests where agency_id=target and created_at<current_time_value-interval '2 days';
  if exists(select 1 from private.service_chat_requests where id=p_request_id) then return false; end if;
  if (select count(*) from private.service_chat_requests where agency_id=target
      and created_at>=date_trunc('day',current_time_value at time zone 'UTC') at time zone 'UTC')>=100
    or exists(select 1 from private.service_chat_requests where agency_id=target
      and session_hash=p_session_hash and finished_at is null and created_at>current_time_value-interval '20 seconds')
    or (select count(*) from private.service_chat_requests where agency_id=target
      and session_hash=p_session_hash and created_at>current_time_value-interval '30 minutes')>=10
    or (select count(*) from private.service_chat_requests where agency_id=target
      and network_hash=p_network_hash and created_at>current_time_value-interval '1 hour')>=20
    or (select count(*) from private.service_chat_requests where agency_id=target
      and finished_at is null and created_at>current_time_value-interval '20 seconds')>=4
  then return false; end if;
  insert into private.service_chat_requests(id,agency_id,session_hash,network_hash)
    values(p_request_id,target,p_session_hash,p_network_hash);
  return true;
end $$;
revoke execute on function public.reserve_service_chat(text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.reserve_service_chat(text,uuid,text,text) to service_role;

create function public.finish_service_chat(p_request_id uuid,p_outcome text)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if p_outcome is null or p_outcome not in ('answered','unavailable','rejected') then raise exception 'Invalid outcome'; end if;
  update private.service_chat_requests set finished_at=clock_timestamp(),outcome=p_outcome
    where id=p_request_id and finished_at is null;
end $$;
revoke execute on function public.finish_service_chat(uuid,text) from public,anon,authenticated;
grant execute on function public.finish_service_chat(uuid,text) to service_role;

-- Admission-time cleanup also works without a timer. Hourly maintenance may
-- call this service-only function; inactive/paused projects cannot promise TTL.
create function public.cleanup_service_chat() returns bigint
language plpgsql security invoker set search_path='' as $$
declare removed bigint; begin
  delete from private.service_chat_requests where created_at<clock_timestamp()-interval '48 hours';
  get diagnostics removed=row_count;
  return removed;
end $$;
revoke execute on function public.cleanup_service_chat() from public,anon,authenticated;
grant execute on function public.cleanup_service_chat() to service_role;

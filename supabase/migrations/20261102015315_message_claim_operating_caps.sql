-- Conservative lease-admission budgets, shared by all worker invocations,
-- providers, channels and dry-run/live modes. No schedule or sender is enabled.
-- Historical attempts intentionally count; the old empty limits migration stays untouched.
create index message_attempts_agency_started on public.message_attempts(agency_id,started_at desc);

-- Internal calculation only. The caller must hold the workspace transaction lock
-- and supply its own clock after admission serialization. No client-controlled time.
create function private.message_claim_resume_at(p_agency_id uuid,p_clock timestamptz)
returns timestamptz language sql stable security invoker set search_path='' as $$
 with hourly as (
   -- Fifth newest, rather than oldest: legacy history can already exceed five.
   select started_at+interval '1 hour 1 second' as opens_at
   from public.message_attempts
   where agency_id=p_agency_id and started_at>p_clock-interval '1 hour'
   order by started_at desc offset 4 limit 1
 ), daily as (
   select case when count(*)>=20 then
     ((date_trunc('day',p_clock at time zone 'Asia/Manila')+interval '1 day') at time zone 'Asia/Manila')+interval '1 second'
   end as opens_at
   from public.message_attempts
   where agency_id=p_agency_id
     and started_at>=date_trunc('day',p_clock at time zone 'Asia/Manila') at time zone 'Asia/Manila'
 ) select greatest((select opens_at from hourly),(select opens_at from daily))
$$;
revoke all on function private.message_claim_resume_at(uuid,timestamptz) from public,anon,authenticated,service_role;

create or replace function private.claim_message_jobs(p_limit integer,p_agency_id uuid) returns setof public.message_jobs
language plpgsql security definer set search_path='' as $$
declare j public.message_jobs; reason text; admission_time timestamptz; resume_at timestamptz;
begin
 -- An old repeatable-read snapshot would undercount after waiting for the lock.
 if current_setting('transaction_isolation')<>'read committed' then raise exception 'Claim requires READ COMMITTED isolation'; end if;
 if p_agency_id is null or not exists(select 1 from public.agencies where id=p_agency_id and intake_enabled) then raise exception 'Active workspace required'; end if;
 if p_limit is null or p_limit<1 or p_limit>100 then raise exception 'Limit must be 1 to 100'; end if;
 -- Serialize all claimers for this workspace, before taking job locks.
 perform pg_advisory_xact_lock(hashtextextended('message-claim:'||p_agency_id::text,0));
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
   -- Existing attempt history is the reservation ledger. Every mode, channel,
   -- retry and uncertain outcome remains charged; there are no quota refunds.
   admission_time=clock_timestamp();
   resume_at=private.message_claim_resume_at(p_agency_id,admission_time);
   if resume_at is not null then
     update public.message_jobs set due_at=greatest(due_at,resume_at),last_error='operating_cap_deferred',updated_at=admission_time where id=j.id;
     continue;
   end if;
   update public.message_jobs set status='processing',attempts=attempts+1,lease_token=gen_random_uuid(),
     lease_expires_at=admission_time+interval '5 minutes',last_error=null,updated_at=admission_time where id=j.id returning * into j;
   insert into public.message_attempts(job_id,attempt_number,lease_token,started_at) values(j.id,j.attempts,j.lease_token,admission_time);
   return next j;
 end loop;
end $$;

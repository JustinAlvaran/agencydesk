-- Extend the established CRM; preserve its proposal conversion and delivery outbox.
-- Connection audits belong directly to the verified staff agency, not a lead.
do $$ declare definition text; begin
 definition:=pg_get_functiondef('private.guard_agency()'::regprocedure);
 definition:=replace(definition,'if parent is null or (supplied is not null and supplied<>parent)',
 'if parent is null and TG_TABLE_NAME=''activity_events'' and document->>''event_type''=''connection_updated'' and private.owns_agency(supplied) then parent:=supplied; end if; if parent is null or (supplied is not null and supplied<>parent)');
 execute definition;
end $$;
alter table public.leads add column row_version bigint not null default 1;
alter table public.leads add column company_name text not null default '';
alter table public.leads add column budget_range text not null default '';
alter table public.leads add column timeline text not null default '';
alter table public.leads add column probability integer generated always as
  (case status when 'new' then 20 when 'contacted' then 40 when 'qualified' then 60 when 'proposal_sent' then 80 when 'won' then 100 else 0 end) stored;
alter table public.leads add column score integer generated always as
  (least(100, (case when budget_cents>0 then 25 else 0 end) + (case when company_id is not null or company_name<>'' then 25 else 0 end) + (case when length(brief)>=100 then 25 else 0 end) + (case when status in ('qualified','proposal_sent','won') then 25 else 0 end))) stored;
create function private.bump_lead_version() returns trigger language plpgsql set search_path='' as $$
begin new.row_version=old.row_version+1; return new; end $$;
create trigger bump_lead_version before update on public.leads for each row execute function private.bump_lead_version();
create function public.update_lead_stage(p_id uuid,p_version bigint,p_stage text) returns public.leads
language plpgsql security invoker set search_path='' as $$
declare result public.leads; begin
 if p_stage is null or p_stage not in ('new','contacted','qualified','proposal_sent','lost') then raise exception 'Use proposal acceptance to win a deal' using errcode='22023'; end if;
 update public.leads set status=p_stage where id=p_id and row_version=p_version and archived_at is null returning * into result;
 if not found then raise exception 'Record changed or unavailable; reload' using errcode='40001'; end if;
 return result;
end $$;
revoke all on function public.update_lead_stage(uuid,bigint,text) from public,anon;
grant execute on function public.update_lead_stage(uuid,bigint,text) to authenticated;

create function public.crm_totals() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('open_leads',count(*),'pipeline_cents',coalesce(sum(budget_cents),0),
 'weighted_cents',coalesce(sum(budget_cents::numeric*probability/100),0)) from public.leads where archived_at is null and status not in ('won','lost')
$$;
revoke all on function public.crm_totals() from public,anon;
grant execute on function public.crm_totals() to authenticated;

-- Existing activity rows already audit changes. Mirror identifiers, never contact data,
-- into a durable internal event outbox. message_jobs remains the only delivery queue.
create view public.audit_logs with (security_invoker=true) as select * from public.activity_events;
grant select on public.audit_logs to authenticated;
create table public.events_outbox (
 id uuid primary key references public.activity_events(id), agency_id uuid not null references public.agencies(id),
 event_type text not null, created_at timestamptz not null default now(),
 state text not null default 'pending' check(state in ('pending','leased','completed')),
 lease_token uuid, lease_until timestamptz, completed_at timestamptz
);
alter table public.events_outbox enable row level security;
create policy staff_event_read on public.events_outbox for select to authenticated using (private.owns_agency(agency_id));
grant select on public.events_outbox to authenticated;
grant all on public.events_outbox to service_role;
create function private.enqueue_crm_event() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.events_outbox(id,agency_id,event_type) values(new.id,new.agency_id,new.event_type) on conflict do nothing; return new; end $$;
revoke all on function private.enqueue_crm_event() from public,anon,authenticated;
create trigger enqueue_crm_event after insert on public.activity_events for each row execute function private.enqueue_crm_event();
create function public.claim_crm_events(p_agency uuid,p_limit integer default 20) returns setof public.events_outbox
language sql security invoker set search_path='' as $$
 update public.events_outbox e set state='leased',lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes'
 where e.id in (select id from public.events_outbox where agency_id=p_agency and (state='pending' or (state='leased' and lease_until<now())) order by created_at,id for update skip locked limit least(greatest(p_limit,1),50)) returning e.*
$$;
revoke all on function public.claim_crm_events(uuid,integer) from public,anon,authenticated;
grant execute on function public.claim_crm_events(uuid,integer) to service_role;

-- Serialize revision allocation on the existing series, with atomic item creation.
alter table public.proposal_revisions add column payment_terms text not null default '';
create function private.guard_payment_terms() returns trigger language plpgsql set search_path='' as $$
begin if old.status<>'draft' and new.payment_terms is distinct from old.payment_terms then raise exception 'Published terms are immutable'; end if; return new; end $$;
create trigger guard_payment_terms before update on public.proposal_revisions for each row execute function private.guard_payment_terms();
create function public.create_proposal_draft(p_series uuid,p_scope text,p_terms text,p_expires timestamptz,p_items jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid; next_version integer; item jsonb; begin
 perform 1 from public.proposal_series where id=p_series and private.owns_agency(agency_id) for update;
 if not found then raise exception 'Proposal unavailable' using errcode='42501'; end if;
 if length(trim(p_scope)) not between 1 and 10000 or length(p_terms)>4000 or p_expires<=now() or p_expires>now()+interval '1 year'
 or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Invalid draft'; end if;
 select coalesce(max(version),0)+1 into next_version from public.proposal_revisions where series_id=p_series;
 insert into public.proposal_revisions(series_id,version,scope,payment_terms,expires_at) values(p_series,next_version,p_scope,p_terms,p_expires) returning id into result;
 for item in select value from jsonb_array_elements(p_items) loop
  if length(trim(item->>'description')) not between 1 and 1000 then raise exception 'Invalid item'; end if;
  insert into public.proposal_items(revision_id,description,quantity,unit_price_cents) values(result,item->>'description',(item->>'quantity')::integer,(item->>'unit_price_cents')::bigint);
 end loop;
 return result;
end $$;
revoke all on function public.create_proposal_draft(uuid,text,text,timestamptz,jsonb) from public,anon;
grant execute on function public.create_proposal_draft(uuid,text,text,timestamptz,jsonb) to authenticated;

-- Capability links reveal only a single published scope. Signing still requires the
-- invited client's real session and the existing acceptance permission/transaction.
create table private.proposal_links (
 digest text primary key check(digest ~ '^[a-f0-9]{64}$'), revision_id uuid not null references public.proposal_revisions(id),
 expires_at timestamptz not null, revoked_at timestamptz, created_by uuid not null references auth.users(id)
);
alter table private.proposal_links enable row level security;
revoke all on private.proposal_links from public,anon,authenticated;
create function public.issue_proposal_link(p_revision uuid,p_digest text) returns void language plpgsql security definer set search_path='' as $$
declare r public.proposal_revisions; begin
 select * into r from public.proposal_revisions where id=p_revision;
 if not private.owns_agency(r.agency_id) or r.status<>'published' or r.expires_at<=now() then raise exception 'Published proposal required' using errcode='42501'; end if;
 insert into private.proposal_links(digest,revision_id,expires_at,created_by) values(p_digest,p_revision,least(r.expires_at,now()+interval '7 days'),auth.uid());
end $$;
create function public.revoke_proposal_links(p_revision uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.proposal_revisions where id=p_revision and private.owns_agency(agency_id)) then raise exception 'Proposal unavailable' using errcode='42501'; end if;
 update private.proposal_links set revoked_at=now() where revision_id=p_revision;
end $$;
create function public.read_proposal_link(p_digest text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',r.id,'title',s.title,'version',r.version,'scope',r.scope,'payment_terms',r.payment_terms,'total_cents',r.total_cents,'status',r.status,'expires_at',r.expires_at,
 'items',(select coalesce(jsonb_agg(jsonb_build_object('description',i.description,'quantity',i.quantity,'unit_price_cents',i.unit_price_cents) order by i.position,i.id),'[]'::jsonb) from public.proposal_items i where i.revision_id=r.id))
 from private.proposal_links l join public.proposal_revisions r on r.id=l.revision_id join public.proposal_series s on s.id=r.series_id
 where l.digest=p_digest and l.revoked_at is null and l.expires_at>now() and r.status in ('published','accepted')
$$;
revoke all on function public.issue_proposal_link(uuid,text),public.revoke_proposal_links(uuid),public.read_proposal_link(text) from public,anon,authenticated;
grant execute on function public.issue_proposal_link(uuid,text),public.revoke_proposal_links(uuid) to authenticated;
grant execute on function public.read_proposal_link(text) to anon,authenticated;

create table public.sprints (
 id uuid primary key default gen_random_uuid(), agency_id uuid not null references public.agencies(id), project_id uuid not null references public.projects(id),
 title text not null check(length(title) between 1 and 200), starts_at date not null, ends_at date not null check(ends_at>=starts_at)
);
create function private.guard_sprint() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' and (old.agency_id,old.project_id) is distinct from (new.agency_id,new.project_id) then raise exception 'Sprint ownership is immutable'; end if;
 select agency_id into new.agency_id from public.projects where id=new.project_id;
 return new;
end $$;
create trigger guard_sprint before insert or update on public.sprints for each row execute function private.guard_sprint();
alter table public.sprints enable row level security;
create policy staff_sprints on public.sprints for all to authenticated using(private.owns_agency(agency_id)) with check(private.owns_agency(agency_id));
create policy client_sprints on public.sprints for select to authenticated using(exists(select 1 from public.projects p where p.id=project_id));
grant select,insert,update,delete on public.sprints to authenticated;
alter table public.milestones add column sprint_id uuid references public.sprints(id);
alter table public.milestones add column review_status text not null default 'pending' check(review_status in ('pending','review','approved','changes_requested'));
alter table public.milestones add column feedback text not null default '' check(length(feedback)<=4000);
alter table public.milestones add column reviewed_by uuid references auth.users(id);
alter table public.milestones add column reviewed_at timestamptz;
create function private.guard_milestone_review() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' and (new.project_id,new.agency_id) is distinct from (old.project_id,old.agency_id) then raise exception 'Milestone ownership is immutable'; end if;
 if new.sprint_id is not null and not exists(select 1 from public.sprints where id=new.sprint_id and project_id=new.project_id and agency_id=new.agency_id) then raise exception 'Sprint unavailable'; end if;
 if current_user='authenticated' then
  if TG_OP='INSERT' and (new.review_status not in ('pending','review') or new.reviewed_by is not null or new.reviewed_at is not null or new.feedback<>'') then raise exception 'Client approval required'; end if;
  if TG_OP='UPDATE' and ((new.reviewed_by,new.reviewed_at,new.feedback) is distinct from (old.reviewed_by,old.reviewed_at,old.feedback) or (new.review_status is distinct from old.review_status and new.review_status not in ('pending','review'))) then raise exception 'Client approval required'; end if;
  if new.status='completed' and new.review_status<>'approved' then raise exception 'Client approval required before completion'; end if;
 end if;
 return new;
end $$;
create trigger guard_milestone_review before insert or update on public.milestones for each row execute function private.guard_milestone_review();
create function public.review_milestone(p_id uuid,p_approve boolean,p_feedback text) returns void language plpgsql security definer set search_path='' as $$
declare m public.milestones; begin
 select * into m from public.milestones where id=p_id for update;
 if not found or auth.uid() is null or length(p_feedback)>4000 or p_approve is null then raise exception 'Milestone unavailable' using errcode='42501'; end if;
 perform 1 from public.client_memberships cm join public.projects p on p.company_id=cm.company_id where p.id=m.project_id and cm.user_id=auth.uid() and cm.active and cm.can_accept_proposals for share of cm;
 if not found then raise exception 'Client approval permission required' using errcode='42501'; end if;
 if m.review_status='approved' and p_approve then return; end if;
 if m.review_status<>'review' then raise exception 'Milestone must be submitted for review'; end if;
 update public.milestones set review_status=case when p_approve then 'approved' else 'changes_requested' end,
 status=case when p_approve then 'completed' else 'in_progress' end,feedback=coalesce(p_feedback,''),reviewed_at=now(),reviewed_by=auth.uid() where id=p_id;
 insert into public.activity_events(agency_id,project_id,actor_id,event_type) values(m.agency_id,m.project_id,auth.uid(),'milestone_reviewed');
end $$;
revoke all on function public.review_milestone(uuid,boolean,text) from public,anon;
grant execute on function public.review_milestone(uuid,boolean,text) to authenticated;

create table public.integration_connections (
 id uuid primary key default gen_random_uuid(), agency_id uuid not null references public.agencies(id),
 provider text not null check(provider in ('apollo','twilio','n8n')), status text not null default 'saved' check(status in ('saved','connected','disconnected','error')),
 version bigint not null default 1, checked_at timestamptz, updated_at timestamptz not null default now(), unique(agency_id,provider)
);
alter table public.integration_connections enable row level security;
create policy staff_connections_read on public.integration_connections for select to authenticated using(private.owns_agency(agency_id));
grant select on public.integration_connections to authenticated;
create table private.connection_credentials(connection_id uuid primary key references public.integration_connections(id) on delete cascade,envelope text not null check(length(envelope) between 1 and 20000));
alter table private.connection_credentials enable row level security;
revoke all on private.connection_credentials from public,anon,authenticated;
create function public.save_connection(p_provider text,p_envelope text,p_disconnect boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; agency uuid:=private.staff_agency(); begin
 if agency is null or not private.is_admin() then raise exception 'Agency admin required' using errcode='42501'; end if;
 insert into public.integration_connections(agency_id,provider,status) values(agency,p_provider,case when p_disconnect then 'disconnected' else 'saved' end)
 on conflict(agency_id,provider) do update set status=excluded.status,version=integration_connections.version+1,checked_at=null,updated_at=now() returning id into result;
 if p_disconnect then delete from private.connection_credentials where connection_id=result;
 else insert into private.connection_credentials values(result,p_envelope) on conflict(connection_id) do update set envelope=excluded.envelope; end if;
 insert into public.activity_events(agency_id,actor_id,event_type,detail) values(agency,auth.uid(),'connection_updated',jsonb_build_object('provider',p_provider));
 return result;
end $$;
create function public.connection_secret(p_agency uuid,p_provider text) returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('id',c.id,'version',c.version,'envelope',s.envelope) from public.integration_connections c join private.connection_credentials s on s.connection_id=c.id where c.agency_id=p_agency and c.provider=p_provider and c.status<>'disconnected'
$$;
create function public.record_connection_test(p_id uuid,p_version bigint,p_ok boolean) returns boolean language plpgsql security definer set search_path='' as $$
begin update public.integration_connections set status=case when p_ok then 'connected' else 'error' end,checked_at=now() where id=p_id and version=p_version and status<>'disconnected'; return found; end $$;
revoke all on function public.save_connection(text,text,boolean),public.connection_secret(uuid,text),public.record_connection_test(uuid,bigint,boolean) from public,anon,authenticated;
grant execute on function public.save_connection(text,text,boolean) to authenticated;
grant execute on function public.connection_secret(uuid,text),public.record_connection_test(uuid,bigint,boolean) to service_role;

create table private.n8n_receipts(agency_id uuid not null references public.agencies(id),event_id uuid not null references public.events_outbox(id),receipt_id uuid not null,created_at timestamptz not null default now(),primary key(agency_id,receipt_id));
alter table private.n8n_receipts enable row level security;
revoke all on private.n8n_receipts from public,anon,authenticated;
create function public.complete_crm_event(p_agency uuid,p_event uuid,p_receipt uuid,p_lease uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.events_outbox where id=p_event and agency_id=p_agency for update;
 if not found then raise exception 'Event unavailable'; end if;
 if exists(select 1 from private.n8n_receipts where agency_id=p_agency and receipt_id=p_receipt and event_id=p_event) then return true; end if;
 update public.events_outbox set state='completed',completed_at=now(),lease_until=null where id=p_event and agency_id=p_agency and state='leased' and lease_token=p_lease and lease_until>now();
 if not found then raise exception 'Lease expired or event unavailable'; end if;
 insert into private.n8n_receipts(agency_id,event_id,receipt_id) values(p_agency,p_event,p_receipt);
 return true;
end $$;
revoke all on function public.complete_crm_event(uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.complete_crm_event(uuid,uuid,uuid,uuid) to service_role;

-- Unknown budgets are zero, never a fabricated $25k opportunity. Retain the
-- established consent, rate-limit and idempotency transaction.
do $$ declare definition text; begin
 definition:=pg_get_functiondef('public.submit_inquiry_with_preferences(text,text,text,text,bigint,text,text,boolean,boolean,uuid)'::regprocedure);
 definition:=replace(definition,'budget_cents<10000','budget_cents<0'); execute definition;
end $$;
create function public.capture_website_inquiry(p_agency uuid,p_submission uuid,p_hash text,p_request_key text,p_details jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid; begin
 if length(coalesce(p_details->>'company',''))>200 or length(coalesce(p_details->>'budget_range',''))>100 or length(coalesce(p_details->>'timeline',''))>200 then raise exception 'Invalid inquiry'; end if;
 result:=public.submit_website_inquiry(p_agency,p_submission,p_hash,p_request_key,p_details->>'contact_name',p_details->>'email',p_details->>'service',p_details->>'brief',
 (p_details->>'budget_cents')::bigint,nullif(p_details->>'phone',''),coalesce((p_details->>'email_opt_in')::boolean,false),false,coalesce(p_details->>'source','website'));
 update public.leads set company_name=coalesce(p_details->>'company',''),budget_range=coalesce(p_details->>'budget_range',''),timeline=coalesce(p_details->>'timeline','') where id=result and agency_id=p_agency
 and (company_name,budget_range,timeline) is distinct from (coalesce(p_details->>'company',''),coalesce(p_details->>'budget_range',''),coalesce(p_details->>'timeline',''));
 return result;
end $$;
revoke all on function public.capture_website_inquiry(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.capture_website_inquiry(uuid,uuid,text,text,jsonb) to service_role;

create function public.create_proposal_with_draft(p_lead uuid,p_company uuid,p_title text,p_scope text,p_terms text,p_expires timestamptz,p_items jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare series uuid; begin
 perform 1 from public.leads where id=p_lead and private.owns_agency(agency_id) and (company_id is null or company_id=p_company) for update;
 if not found or not exists(select 1 from public.companies where id=p_company and private.owns_agency(agency_id)) then raise exception 'Lead or company unavailable' using errcode='42501'; end if;
 if length(trim(p_title)) not between 1 and 200 then raise exception 'Invalid title'; end if;
 update public.leads set company_id=p_company where id=p_lead and company_id is null;
 insert into public.proposal_series(lead_id,company_id,title) values(p_lead,p_company,p_title) returning id into series;
 perform public.create_proposal_draft(series,p_scope,p_terms,p_expires,p_items);
 return series;
end $$;
revoke all on function public.create_proposal_with_draft(uuid,uuid,text,text,text,timestamptz,jsonb) from public,anon;
grant execute on function public.create_proposal_with_draft(uuid,uuid,text,text,text,timestamptz,jsonb) to authenticated;

create table public.deliverables (
 id uuid primary key default gen_random_uuid(), agency_id uuid not null references public.agencies(id),
 project_id uuid not null references public.projects(id), name text not null check(length(name) between 1 and 200),
 object_path text not null unique, content_type text not null, size_bytes integer not null check(size_bytes between 1 and 4194304),
 created_at timestamptz not null default now()
);
alter table public.deliverables enable row level security;
create policy deliverables_read on public.deliverables for select to authenticated using(exists(select 1 from public.projects p where p.id=project_id and p.agency_id=deliverables.agency_id));
create policy deliverables_insert on public.deliverables for insert to authenticated with check(private.owns_agency(agency_id) and exists(select 1 from public.projects p where p.id=project_id and p.agency_id=deliverables.agency_id) and object_path like agency_id::text||'/'||project_id::text||'/%');
grant select,insert on public.deliverables to authenticated;
-- PGlite does not include Storage; the hosted/local Supabase stack does.
do $$ begin if to_regclass('storage.buckets') is not null then
 execute 'insert into storage.buckets(id,name,public,file_size_limit) values(''agencydesk-deliverables'',''agencydesk-deliverables'',false,4194304) on conflict(id) do nothing';
end if; end $$;

-- Each staff account belongs to one agency in this invite-only pilot.
-- Existing records remain in the original workspace; this does not delete data.
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(trim(name)) between 1 and 200),
  slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  intake_enabled boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.agencies(id,name,slug) values('a0000000-0000-4000-8000-000000000001','AgencyDesk','agencydesk');

-- Historical published items reject every UPDATE. This backfill changes only
-- their workspace key; restore the guard before this transaction commits.
alter table public.proposal_items disable trigger guard_item;
do $$ declare t text; begin
  foreach t in array array['staff_members','companies','client_memberships','contacts','leads','lead_notes','follow_up_tasks','proposal_series','proposal_revisions','proposal_items','projects','milestones','project_updates','comments','activity_events'] loop
    execute format('alter table public.%I add column agency_id uuid references public.agencies(id)',t);
    execute format('update public.%I set agency_id=%L',t,'a0000000-0000-4000-8000-000000000001');
    execute format('alter table public.%I alter column agency_id set not null',t);
    execute format('create index %I on public.%I(agency_id)',t||'_agency',t);
  end loop;
end $$;
alter table public.proposal_items enable trigger guard_item;

create function private.staff_agency() returns uuid language sql stable security definer set search_path='' as $$
  select agency_id from public.staff_members where user_id=(select auth.uid()) and active
$$;
create function private.owns_agency(agency uuid) returns boolean language sql stable security definer set search_path='' as $$
  select agency=private.staff_agency()
$$;
create function private.owns_company(company uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.companies where id=company and private.owns_agency(agency_id))
$$;
create function private.series_published(series uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.proposal_revisions where series_id=series and status<>'draft')
$$;
revoke all on function private.staff_agency(),private.owns_agency(uuid),private.owns_company(uuid),private.series_published(uuid) from public,anon;
grant execute on function private.staff_agency(),private.owns_agency(uuid),private.owns_company(uuid),private.series_published(uuid) to authenticated,service_role;

-- Child agency IDs are derived from the owning record, never from browser input.
create function private.guard_agency() returns trigger language plpgsql security definer set search_path='' as $$
declare parent uuid; supplied uuid:=new.agency_id; document jsonb:=to_jsonb(new); linked uuid; begin
  if TG_OP='UPDATE' and new.agency_id is distinct from old.agency_id then raise exception 'Workspace ownership is immutable'; end if;
  case TG_TABLE_NAME
    when 'staff_members' then parent:=coalesce(new.agency_id,private.staff_agency(),'a0000000-0000-4000-8000-000000000001');
    when 'companies' then parent:=coalesce(new.agency_id,private.staff_agency(),'a0000000-0000-4000-8000-000000000001');
    when 'leads' then
      parent:=coalesce(new.agency_id,private.staff_agency(),'a0000000-0000-4000-8000-000000000001');
      if new.company_id is not null then
        select agency_id into linked from public.companies where id=new.company_id;
        if linked is distinct from parent then raise exception 'Company belongs to another workspace'; end if;
      end if;
      if new.owner_id is not null and not exists(select 1 from public.staff_members where user_id=new.owner_id and agency_id=parent and active) then raise exception 'Choose active workspace staff'; end if;
    when 'contacts','client_memberships','proposal_series','projects' then
      select agency_id into parent from public.companies where id=(document->>'company_id')::uuid;
    when 'lead_notes','follow_up_tasks' then
      select agency_id into parent from public.leads where id=(document->>'lead_id')::uuid;
      if TG_TABLE_NAME='follow_up_tasks' and document->>'assigned_to' is not null and not exists(select 1 from public.staff_members where user_id=(document->>'assigned_to')::uuid and agency_id=parent and active) then raise exception 'Choose active workspace staff'; end if;
    when 'proposal_revisions' then select agency_id into parent from public.proposal_series where id=(document->>'series_id')::uuid;
    when 'proposal_items' then select agency_id into parent from public.proposal_revisions where id=(document->>'revision_id')::uuid;
    when 'milestones','project_updates' then select agency_id into parent from public.projects where id=(document->>'project_id')::uuid;
    when 'comments' then select agency_id into parent from public.project_updates where id=(document->>'update_id')::uuid;
    when 'activity_events' then
      select agency_id into parent from public.leads where id=(document->>'lead_id')::uuid;
      if parent is null then select agency_id into parent from public.projects where id=(document->>'project_id')::uuid; end if;
  end case;
  if parent is null or (supplied is not null and supplied<>parent) then raise exception 'Invalid workspace relationship'; end if;
  new.agency_id:=parent;
  return new;
end $$;
revoke all on function private.guard_agency() from public,anon,authenticated;
do $$ declare t text; begin
  foreach t in array array['staff_members','companies','client_memberships','contacts','leads','lead_notes','follow_up_tasks','proposal_series','proposal_revisions','proposal_items','projects','milestones','project_updates','comments','activity_events'] loop
    execute format('create trigger a_guard_agency before insert or update on public.%I for each row execute function private.guard_agency()',t);
  end loop;
end $$;

-- Rebuild policies: a staff identity alone no longer grants global access.
do $$ declare p record; t text; begin
  for p in select tablename,policyname from pg_policies where schemaname='public' and tablename=any(array['staff_members','companies','client_memberships','contacts','leads','lead_notes','follow_up_tasks','proposal_series','proposal_revisions','proposal_items','projects','milestones','project_updates','comments','activity_events']) loop
    execute format('drop policy %I on public.%I',p.policyname,p.tablename);
  end loop;
  foreach t in array array['companies','contacts','leads','lead_notes','follow_up_tasks','proposal_series','proposal_revisions','proposal_items','milestones','project_updates'] loop
    execute format('create policy agency_staff on public.%I to authenticated using(private.owns_agency(agency_id)) with check(private.owns_agency(agency_id))',t);
  end loop;
end $$;
alter table public.agencies enable row level security;
revoke all on public.agencies from public,anon,authenticated;
grant select,update on public.agencies to authenticated;
grant all on public.agencies to service_role;
create policy agency_read on public.agencies for select to authenticated using(private.owns_agency(id) or exists(select 1 from public.client_memberships m where m.agency_id=id and m.user_id=(select auth.uid()) and m.active));
create policy agency_update on public.agencies for update to authenticated using(private.owns_agency(id) and private.is_admin()) with check(private.owns_agency(id) and private.is_admin());
create policy staff_read on public.staff_members for select to authenticated using(user_id=(select auth.uid()) or private.owns_agency(agency_id));
create policy staff_admin on public.staff_members for all to authenticated using(private.owns_agency(agency_id) and private.is_admin()) with check(private.owns_agency(agency_id) and private.is_admin());
create policy memberships_read on public.client_memberships for select to authenticated using(user_id=(select auth.uid()) or private.owns_agency(agency_id));
create policy memberships_admin on public.client_memberships for all to authenticated using(private.owns_agency(agency_id) and private.is_admin()) with check(private.owns_agency(agency_id) and private.is_admin());
create policy client_company on public.companies for select to authenticated using(private.is_client(id));
create policy client_series on public.proposal_series for select to authenticated using(private.is_client(company_id) and private.series_published(id));
create policy client_revision on public.proposal_revisions for select to authenticated using(status<>'draft' and exists(select 1 from public.proposal_series s where s.id=series_id and private.is_client(s.company_id)));
create policy client_items on public.proposal_items for select to authenticated using(exists(select 1 from public.proposal_revisions r join public.proposal_series s on s.id=r.series_id where r.id=revision_id and r.status<>'draft' and private.is_client(s.company_id)));
create policy agency_projects_read on public.projects for select to authenticated using(private.owns_agency(agency_id) or private.is_client(company_id));
create policy agency_projects_update on public.projects for update to authenticated using(private.owns_agency(agency_id)) with check(private.owns_agency(agency_id));
create policy client_milestones on public.milestones for select to authenticated using(exists(select 1 from public.projects p where p.id=project_id and private.is_client(p.company_id)));
create policy client_updates on public.project_updates for select to authenticated using(exists(select 1 from public.projects p where p.id=project_id and private.is_client(p.company_id)));
create policy comments_read on public.comments for select to authenticated using(private.owns_agency(agency_id) or exists(select 1 from public.project_updates u join public.projects p on p.id=u.project_id where u.id=update_id and private.is_client(p.company_id)));
create policy comments_insert on public.comments for insert to authenticated with check(author_id=(select auth.uid()) and (private.owns_agency(agency_id) or exists(select 1 from public.project_updates u join public.projects p on p.id=u.project_id where u.id=update_id and private.is_client(p.company_id))));
create policy agency_activity on public.activity_events for select to authenticated using(private.owns_agency(agency_id));

create or replace function private.guard_series() returns trigger language plpgsql set search_path='' as $$ begin
  if TG_OP='UPDATE' and (new.lead_id,new.company_id) is distinct from (old.lead_id,old.company_id) then raise exception 'Proposal ownership is immutable'; end if;
  perform 1 from public.leads where id=new.lead_id for update;
  if not exists(select 1 from public.leads where id=new.lead_id and company_id=new.company_id and agency_id=new.agency_id) then raise exception 'Proposal company must match lead'; end if;
  return new;
end $$;

-- Existing privileged publication function must enforce the target agency too.
do $$ declare definition text; begin
  select pg_get_functiondef('private.publish_revision(uuid)'::regprocedure) into definition;
  definition:=replace(definition,'select * into s from public.proposal_series where id=r.series_id;',
    'select * into s from public.proposal_series where id=r.series_id; if not private.owns_agency(s.agency_id) then raise exception ''Proposal unavailable'' using errcode=''42501''; end if;');
  execute definition;
end $$;

create function public.create_business_contact(contact_name text,contact_email text,company_id uuid default null,company_name text default null) returns uuid language plpgsql security invoker set search_path='' as $$
declare company uuid:=company_id; result uuid; begin
  if not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  if length(trim(contact_name)) not between 1 and 100 or length(trim(contact_email))>254 or trim(contact_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid contact'; end if;
  if company is null then
    if company_name is null or length(trim(company_name)) not between 1 and 200 then raise exception 'Company name required'; end if;
    insert into public.companies(name) values(trim(company_name)) returning id into company;
  elsif not private.owns_company(company) then raise exception 'Company unavailable' using errcode='42501'; end if;
  insert into public.contacts(company_id,name,email) values(company,trim(contact_name),lower(trim(contact_email))) returning id into result;
  return result;
end $$;
revoke all on function public.create_business_contact(text,text,uuid,text) from public,anon;
grant execute on function public.create_business_contact(text,text,uuid,text) to authenticated;

-- Only the platform owner can provision a pilot agency; no open signup or billing.
create function public.provision_agency(agency_name text,agency_slug text,owner_user_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; begin
  if not private.is_admin() or private.staff_agency()<>'a0000000-0000-4000-8000-000000000001' then raise exception 'Platform owner required' using errcode='42501'; end if;
  if exists(select 1 from public.staff_members where user_id=owner_user_id) then raise exception 'Account already belongs to an agency'; end if;
  insert into public.agencies(name,slug) values(trim(agency_name),agency_slug) returning id into result;
  insert into public.staff_members(user_id,role,active,agency_id) values(owner_user_id,'admin',true,result);
  return result;
end $$;
revoke all on function public.provision_agency(text,text,uuid) from public,anon;
grant execute on function public.provision_agency(text,text,uuid) to authenticated;

create function public.workspace_account(account_email text) returns uuid language plpgsql stable security definer set search_path='' as $$
declare result uuid; begin
  if not private.is_admin() or private.staff_agency()<>'a0000000-0000-4000-8000-000000000001' then raise exception 'Platform owner required' using errcode='42501'; end if;
  select u.id into result from auth.users u where lower(u.email)=lower(trim(account_email));
  return result;
end $$;
revoke all on function public.workspace_account(text) from public,anon;
grant execute on function public.workspace_account(text) to authenticated;

-- Tenant routing is resolved by the trusted inquiry Edge Function.
do $$ declare definition text; begin
  select pg_get_functiondef('public.submit_inquiry(text,text,text,text,bigint,text)'::regprocedure) into definition;
  definition:=replace(definition,'request_key text)', 'request_key text, target_agency_id uuid)');
  definition:=replace(definition,'declare result uuid; begin', 'declare result uuid; begin if not exists(select 1 from public.agencies where id=target_agency_id) then raise exception ''Agency unavailable''; end if;');
  definition:=replace(definition,'insert into public.leads(contact_name,email,service,brief,budget_cents) values(trim(contact_name),lower(trim(email)),service,trim(brief),budget_cents)', 'insert into public.leads(contact_name,email,service,brief,budget_cents,agency_id) values(trim(contact_name),lower(trim(email)),service,trim(brief),budget_cents,target_agency_id)');
  execute definition;
end $$;
revoke all on function public.submit_inquiry(text,text,text,text,bigint,text,uuid) from public,anon,authenticated;
grant execute on function public.submit_inquiry(text,text,text,text,bigint,text,uuid) to service_role;

create function public.agency_intake_info(agency_slug text) returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('name',name,'slug',slug) from public.agencies where slug=agency_slug and intake_enabled
$$;
revoke all on function public.agency_intake_info(text) from public;
grant execute on function public.agency_intake_info(text) to anon,authenticated;


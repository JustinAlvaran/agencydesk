-- AgencyDesk: original single-agency CRM, with client isolation at the database.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','staff')),
  active boolean not null default true
);
create table public.companies (
  id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 200),
  created_at timestamptz not null default now()
);
create table public.client_memberships (
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  active boolean not null default true, can_accept_proposals boolean not null default false,
  primary key(user_id,company_id)
);
create table public.contacts (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  name text not null, email text not null, created_at timestamptz not null default now()
);
create table public.leads (
  id uuid primary key default gen_random_uuid(), company_id uuid references public.companies(id),
  contact_name text not null, email text not null, service text not null, brief text not null,
  budget_cents bigint not null default 0 check(budget_cents >= 0),
  status text not null default 'new' check(status in ('new','contacted','qualified','proposal_sent','won','lost')),
  owner_id uuid references public.staff_members(user_id), created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), archived_at timestamptz
);
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id),
  body text not null check(length(body) between 1 and 10000), author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id),
  title text not null, due_at timestamptz not null, completed_at timestamptz,
  assigned_to uuid references public.staff_members(user_id), created_at timestamptz not null default now()
);
create table public.proposal_series (
  id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id),
  company_id uuid not null references public.companies(id), title text not null,
  created_at timestamptz not null default now(), unique(id,company_id)
);
create table public.proposal_revisions (
  id uuid primary key default gen_random_uuid(), series_id uuid not null references public.proposal_series(id),
  version integer not null check(version>0),
  status text not null default 'draft' check(status in ('draft','published','superseded','accepted','declined')),
  scope text not null, expires_at timestamptz not null, total_cents bigint not null default 0 check(total_cents>=0),
  created_at timestamptz not null default now(), published_at timestamptz, accepted_at timestamptz,
  accepted_by uuid references auth.users(id), unique(series_id,version)
);
create unique index one_current_revision on public.proposal_revisions(series_id) where status='published';
create unique index one_accepted_revision on public.proposal_revisions(series_id) where status='accepted';
create table public.proposal_items (
  id uuid primary key default gen_random_uuid(), revision_id uuid not null references public.proposal_revisions(id),
  description text not null, quantity integer not null check(quantity between 1 and 100000),
  unit_price_cents bigint not null check(unit_price_cents between 0 and 100000000), position integer not null default 0
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  lead_id uuid not null unique references public.leads(id),
  accepted_revision_id uuid not null unique references public.proposal_revisions(id), name text not null,
  status text not null default 'active' check(status in ('active','on_hold','completed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.milestones (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id),
  title text not null, status text not null default 'pending' check(status in ('pending','in_progress','completed')),
  due_at timestamptz, position integer not null default 0
);
create table public.project_updates (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id),
  body text not null check(length(body) between 1 and 10000), created_at timestamptz not null default now()
);
create table public.comments (
  id uuid primary key default gen_random_uuid(), update_id uuid not null references public.project_updates(id),
  author_id uuid not null references auth.users(id), body text not null check(length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create table public.activity_events (
  id uuid primary key default gen_random_uuid(), lead_id uuid references public.leads(id),
  project_id uuid references public.projects(id), actor_id uuid references auth.users(id),
  event_type text not null, detail jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table private.inquiry_requests (request_key text not null, created_at timestamptz not null default now());
create index inquiry_rate_lookup on private.inquiry_requests(request_key,created_at);
create index leads_pipeline on public.leads(status,updated_at desc,id);
create index leads_company on public.leads(company_id);
create index lead_notes_parent on public.lead_notes(lead_id);
create index tasks_due on public.follow_up_tasks(due_at) where completed_at is null;
create index tasks_lead on public.follow_up_tasks(lead_id);
create index series_lead on public.proposal_series(lead_id);
create index series_company on public.proposal_series(company_id);
create index items_revision on public.proposal_items(revision_id);
create index projects_company on public.projects(company_id);
create index milestones_project on public.milestones(project_id);
create index updates_project on public.project_updates(project_id);
create index comments_update on public.comments(update_id);
create index activity_lead on public.activity_events(lead_id,created_at desc);
create index contacts_company on public.contacts(company_id);
create index memberships_company on public.client_memberships(company_id);
create index leads_owner on public.leads(owner_id);
create index notes_author on public.lead_notes(author_id);
create index tasks_assignee on public.follow_up_tasks(assigned_to);
create index revisions_acceptor on public.proposal_revisions(accepted_by);
create index comments_author on public.comments(author_id);
create index activity_project on public.activity_events(project_id,created_at desc);
create index activity_actor on public.activity_events(actor_id);

create function private.is_staff() returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.staff_members where user_id=(select auth.uid()) and active) $$;
create function private.is_admin() returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.staff_members where user_id=(select auth.uid()) and active and role='admin') $$;
create function private.is_client(company uuid) returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.client_memberships where user_id=(select auth.uid()) and company_id=company and active) $$;
create function private.can_accept(company uuid) returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.client_memberships where user_id=(select auth.uid()) and company_id=company and active and can_accept_proposals) $$;

-- Policies use current database memberships, never editable or stale JWT roles.
do $$ declare t text; begin
  foreach t in array array['staff_members','companies','client_memberships','contacts','leads','lead_notes','follow_up_tasks','proposal_series','proposal_revisions','proposal_items','projects','milestones','project_updates','comments','activity_events'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
  end loop;
  foreach t in array array['companies','contacts','leads','lead_notes','follow_up_tasks','proposal_series','proposal_revisions','proposal_items','milestones','project_updates'] loop
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('create policy staff_all on public.%I to authenticated using ((select private.is_staff())) with check ((select private.is_staff()))',t);
  end loop;
end $$;
grant select,insert,update,delete on public.staff_members,public.client_memberships to authenticated;
create policy own_staff on public.staff_members for select to authenticated using(user_id=(select auth.uid()) or (select private.is_admin()));
create policy admin_staff on public.staff_members for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy membership_read on public.client_memberships for select to authenticated using(user_id=(select auth.uid()) or (select private.is_staff()));
create policy admin_memberships on public.client_memberships for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy client_company on public.companies for select to authenticated using(private.is_client(id));
create policy client_series on public.proposal_series for select to authenticated using(private.is_client(company_id));
create policy client_revision on public.proposal_revisions for select to authenticated using(status<>'draft' and exists(select 1 from public.proposal_series s where s.id=series_id and private.is_client(s.company_id)));
create policy client_items on public.proposal_items for select to authenticated using(exists(select 1 from public.proposal_revisions r join public.proposal_series s on s.id=r.series_id where r.id=revision_id and r.status<>'draft' and private.is_client(s.company_id)));
grant select,update on public.projects to authenticated;
create policy staff_projects_read on public.projects for select to authenticated using((select private.is_staff()));
create policy staff_projects_update on public.projects for update to authenticated using((select private.is_staff())) with check((select private.is_staff()));
create policy client_projects on public.projects for select to authenticated using(private.is_client(company_id));
create policy client_milestones on public.milestones for select to authenticated using(exists(select 1 from public.projects p where p.id=project_id and private.is_client(p.company_id)));
create policy client_updates on public.project_updates for select to authenticated using(exists(select 1 from public.projects p where p.id=project_id and private.is_client(p.company_id)));
grant select,insert on public.comments to authenticated;
create policy comments_read on public.comments for select to authenticated using((select private.is_staff()) or exists(select 1 from public.project_updates u join public.projects p on p.id=u.project_id where u.id=update_id and private.is_client(p.company_id)));
create policy comments_insert on public.comments for insert to authenticated with check(author_id=(select auth.uid()) and ((select private.is_staff()) or exists(select 1 from public.project_updates u join public.projects p on p.id=u.project_id where u.id=update_id and private.is_client(p.company_id))));
grant select on public.activity_events to authenticated;
create policy staff_activity on public.activity_events for select to authenticated using((select private.is_staff()));

-- Published scope/items cannot be rewritten, including through direct table API calls.
create function private.guard_revision() returns trigger language plpgsql set search_path='' as $$
begin
  if TG_OP='DELETE' then
    if old.status<>'draft' then raise exception 'Published revisions are immutable'; end if;
    return old;
  end if;
  if TG_OP='INSERT' then
    if current_user='authenticated' and (new.status<>'draft' or new.total_cents<>0 or new.published_at is not null or new.accepted_at is not null or new.accepted_by is not null) then raise exception 'Use publish_proposal_revision'; end if;
    return new;
  end if;
  if old.status<>'draft' and (new.scope,new.expires_at,new.series_id,new.version,new.total_cents,new.published_at,new.created_at)
     is distinct from (old.scope,old.expires_at,old.series_id,old.version,old.total_cents,old.published_at,old.created_at) then
    raise exception 'Published revisions are immutable';
  end if;
  if current_user='authenticated' and (new.status,new.published_at,new.accepted_at,new.accepted_by,new.total_cents)
     is distinct from (old.status,old.published_at,old.accepted_at,old.accepted_by,old.total_cents) then
    raise exception 'Use proposal transition functions';
  end if;
  return new;
end $$;
create trigger guard_revision before insert or update or delete on public.proposal_revisions for each row execute function private.guard_revision();
create function private.guard_item() returns trigger language plpgsql set search_path='' as $$
declare parent uuid; begin
  if TG_OP='DELETE' then parent=old.revision_id; else parent=new.revision_id; end if;
  -- Locks synchronize item edits with publishing.
  perform 1 from public.proposal_revisions where id=parent and status='draft' for update;
  if not found then raise exception 'Only draft items can change'; end if;
  if TG_OP='UPDATE' and old.revision_id<>new.revision_id then raise exception 'Items cannot move between revisions'; end if;
  if TG_OP='DELETE' then return old; end if; return new;
end $$;
create trigger guard_item before insert or update or delete on public.proposal_items for each row execute function private.guard_item();
create function private.guard_lead() returns trigger language plpgsql set search_path='' as $$ begin
  if current_user='authenticated' and new.status='won' and (TG_OP='INSERT' or old.status<>'won') then raise exception 'Won requires an accepted proposal'; end if;
  if TG_OP='UPDATE' and old.status='won' and new.status<>'won' then raise exception 'Accepted lead cannot change stage'; end if;
  if TG_OP='UPDATE' and new.company_id is distinct from old.company_id and exists(select 1 from public.proposal_series where lead_id=old.id) then raise exception 'Lead with proposals cannot change company'; end if;
  new.updated_at=now(); return new;
end $$;
create trigger guard_lead before insert or update on public.leads for each row execute function private.guard_lead();
create function private.guard_series() returns trigger language plpgsql set search_path='' as $$ begin
  if TG_OP='UPDATE' and (new.lead_id,new.company_id) is distinct from (old.lead_id,old.company_id) then raise exception 'Proposal ownership is immutable'; end if;
  if not exists(select 1 from public.leads where id=new.lead_id and company_id=new.company_id) then raise exception 'Proposal company must match lead'; end if;
  return new;
end $$;
create trigger guard_series before insert or update on public.proposal_series for each row execute function private.guard_series();
create function private.guard_project() returns trigger language plpgsql set search_path='' as $$ begin
  if (new.company_id,new.lead_id,new.accepted_revision_id) is distinct from (old.company_id,old.lead_id,old.accepted_revision_id) then raise exception 'Project ownership is immutable'; end if;
  new.updated_at=now(); return new;
end $$;
create trigger guard_project before update on public.projects for each row execute function private.guard_project();

create function private.publish_revision(revision_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare r public.proposal_revisions; s public.proposal_series; total bigint; begin
  if auth.uid() is null or not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  select * into r from public.proposal_revisions where id=revision_id;
  if not found then raise exception 'Revision not found'; end if;
  select * into s from public.proposal_series where id=r.series_id;
  perform 1 from public.leads where id=s.lead_id for update;
  perform 1 from public.proposal_series where id=s.id for update;
  select * into r from public.proposal_revisions where id=revision_id for update;
  if r.status<>'draft' or r.expires_at<=now() or length(trim(r.scope))=0 then raise exception 'Only valid unexpired drafts can publish'; end if;
  if exists(select 1 from public.proposal_revisions where series_id=s.id and version>r.version and status<>'draft') then raise exception 'A newer version was already published'; end if;
  if exists(select 1 from public.projects where lead_id=s.lead_id) then raise exception 'Lead already converted'; end if;
  select sum(quantity::bigint*unit_price_cents) into total from public.proposal_items where proposal_items.revision_id=r.id;
  if total is null then raise exception 'Proposal requires an item'; end if;
  update public.proposal_revisions set status='superseded' where series_id=s.id and status='published';
  update public.proposal_revisions set status='published',published_at=now(),total_cents=total where id=r.id;
  update public.leads set status='proposal_sent' where id=s.lead_id;
  insert into public.activity_events(lead_id,actor_id,event_type,detail) values(s.lead_id,auth.uid(),'proposal_published',jsonb_build_object('revision_id',r.id));
end $$;
create function private.accept_revision(revision_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.proposal_revisions; s public.proposal_series; project_id uuid; begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into r from public.proposal_revisions where id=revision_id;
  if not found then raise exception 'Proposal unavailable' using errcode='42501'; end if;
  select * into s from public.proposal_series where id=r.series_id;
  if not private.can_accept(s.company_id) then raise exception 'Proposal unavailable' using errcode='42501'; end if;
  perform 1 from public.leads where id=s.lead_id for update;
  perform 1 from public.proposal_series where id=s.id for update;
  select * into r from public.proposal_revisions where id=revision_id for update;
  -- Lock membership too: removal cannot race the acceptance commit.
  perform 1 from public.client_memberships where user_id=auth.uid() and company_id=s.company_id and active and can_accept_proposals for share;
  if not found then raise exception 'Proposal unavailable' using errcode='42501'; end if;
  if r.status='accepted' then select id into project_id from public.projects where accepted_revision_id=r.id; return project_id; end if;
  if r.status<>'published' or r.expires_at<=now() then raise exception 'Proposal is no longer available'; end if;
  if exists(select 1 from public.projects where lead_id=s.lead_id) then raise exception 'Lead already converted'; end if;
  update public.proposal_revisions set status='accepted',accepted_at=now(),accepted_by=auth.uid() where id=r.id;
  insert into public.projects(company_id,lead_id,accepted_revision_id,name) values(s.company_id,s.lead_id,r.id,s.title) returning id into project_id;
  update public.leads set status='won' where id=s.lead_id;
  insert into public.activity_events(lead_id,project_id,actor_id,event_type,detail) values(s.lead_id,project_id,auth.uid(),'proposal_accepted',jsonb_build_object('revision_id',r.id));
  return project_id;
end $$;
create function private.decline_revision(revision_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare r public.proposal_revisions; s public.proposal_series; begin
  select * into r from public.proposal_revisions where id=revision_id;
  if not found or auth.uid() is null then raise exception 'Proposal unavailable' using errcode='42501'; end if;
  select * into s from public.proposal_series where id=r.series_id;
  if not private.can_accept(s.company_id) then raise exception 'Proposal unavailable' using errcode='42501'; end if;
  perform 1 from public.leads where id=s.lead_id for update;
  perform 1 from public.proposal_series where id=s.id for update;
  select * into r from public.proposal_revisions where id=revision_id for update;
  perform 1 from public.client_memberships where user_id=auth.uid() and company_id=s.company_id and active and can_accept_proposals for share;
  if not found then raise exception 'Proposal unavailable' using errcode='42501'; end if;
  if r.status='declined' then return; end if;
  if r.status<>'published' then raise exception 'Only published proposals can be declined'; end if;
  update public.proposal_revisions set status='declined' where id=r.id;
  insert into public.activity_events(lead_id,actor_id,event_type,detail) values(s.lead_id,auth.uid(),'proposal_declined',jsonb_build_object('revision_id',r.id));
end $$;
create function public.publish_proposal_revision(revision_id uuid) returns void language sql security invoker set search_path='' as $$ select private.publish_revision(revision_id) $$;
create function public.accept_proposal_revision(revision_id uuid) returns uuid language sql security invoker set search_path='' as $$ select private.accept_revision(revision_id) $$;
create function public.decline_proposal_revision(revision_id uuid) returns void language sql security invoker set search_path='' as $$ select private.decline_revision(revision_id) $$;

-- Accessible only to server secret client: caller supplies server-derived rate key.
create function public.submit_inquiry(contact_name text,email text,service text,brief text,budget_cents bigint,request_key text) returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid; begin
  if length(trim(contact_name)) not between 1 and 150 or length(email)>254 or email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(service) not between 1 and 100 or length(trim(brief)) not between 20 and 5000 or budget_cents<0 or budget_cents>100000000 or length(request_key) not between 16 and 128 or request_key is null then raise exception 'Invalid inquiry'; end if;
  perform pg_advisory_xact_lock(hashtextextended(request_key,0));
  if (select count(*) from private.inquiry_requests q where q.request_key=submit_inquiry.request_key and q.created_at>now()-interval '1 hour')>=5 then raise exception 'Inquiry rate limit exceeded' using errcode='P0001'; end if;
  insert into private.inquiry_requests(request_key) values(request_key);
  insert into public.leads(contact_name,email,service,brief,budget_cents) values(trim(contact_name),lower(trim(email)),service,trim(brief),budget_cents) returning id into result;
  insert into public.activity_events(lead_id,event_type) values(result,'inquiry_received');
  return result;
end $$;

revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.is_staff(),private.is_admin(),private.is_client(uuid),private.can_accept(uuid),private.publish_revision(uuid),private.accept_revision(uuid),private.decline_revision(uuid) to authenticated;
revoke execute on function public.publish_proposal_revision(uuid),public.accept_proposal_revision(uuid),public.decline_proposal_revision(uuid),public.submit_inquiry(text,text,text,text,bigint,text) from public,anon,authenticated;
grant execute on function public.publish_proposal_revision(uuid),public.accept_proposal_revision(uuid),public.decline_proposal_revision(uuid) to authenticated;
grant usage on schema private to service_role;
grant all on all tables in schema public to service_role;
grant all on private.inquiry_requests to service_role;
grant execute on function public.submit_inquiry(text,text,text,text,bigint,text) to service_role;

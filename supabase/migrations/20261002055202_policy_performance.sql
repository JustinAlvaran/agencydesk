-- One policy per role/operation; retain the exact same authorization model.
alter table private.inquiry_requests add column id uuid primary key default gen_random_uuid();
do $$ declare t text; begin
  foreach t in array array['companies','proposal_series','proposal_revisions','proposal_items','milestones','project_updates'] loop
    execute format('drop policy staff_all on public.%I',t);
    execute format('create policy staff_insert on public.%I for insert to authenticated with check ((select private.is_staff()))',t);
    execute format('create policy staff_update on public.%I for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()))',t);
    execute format('create policy staff_delete on public.%I for delete to authenticated using ((select private.is_staff()))',t);
  end loop;
end $$;
alter policy client_company on public.companies using((select private.is_staff()) or private.is_client(id));
alter policy client_series on public.proposal_series using((select private.is_staff()) or private.is_client(company_id));
alter policy client_revision on public.proposal_revisions using((select private.is_staff()) or (status<>'draft' and exists(select 1 from public.proposal_series s where s.id=series_id and private.is_client(s.company_id))));
alter policy client_items on public.proposal_items using((select private.is_staff()) or exists(select 1 from public.proposal_revisions r join public.proposal_series s on s.id=r.series_id where r.id=revision_id and r.status<>'draft' and private.is_client(s.company_id)));
alter policy client_milestones on public.milestones using((select private.is_staff()) or exists(select 1 from public.projects p where p.id=project_id and private.is_client(p.company_id)));
alter policy client_updates on public.project_updates using((select private.is_staff()) or exists(select 1 from public.projects p where p.id=project_id and private.is_client(p.company_id)));
drop policy staff_projects_read on public.projects;
alter policy client_projects on public.projects using((select private.is_staff()) or private.is_client(company_id));
drop policy admin_staff on public.staff_members;
create policy admin_staff_insert on public.staff_members for insert to authenticated with check((select private.is_admin()));
create policy admin_staff_update on public.staff_members for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy admin_staff_delete on public.staff_members for delete to authenticated using((select private.is_admin()));
drop policy admin_memberships on public.client_memberships;
create policy admin_membership_insert on public.client_memberships for insert to authenticated with check((select private.is_admin()));
create policy admin_membership_update on public.client_memberships for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy admin_membership_delete on public.client_memberships for delete to authenticated using((select private.is_admin()));
alter policy own_staff on public.staff_members using(user_id=(select auth.uid()) or (active and (select private.is_staff())) or (select private.is_admin()));
create function public.get_dashboard_metrics() returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  return jsonb_build_object(
    'open_leads',(select count(*) from public.leads where archived_at is null and status not in ('won','lost')),
    'pipeline_cents',(select coalesce(sum(budget_cents),0) from public.leads where archived_at is null and status not in ('won','lost')),
    'accepted_cents',(select coalesce(sum(total_cents),0) from public.proposal_revisions where status='accepted'),
    'overdue_tasks',(select count(*) from public.follow_up_tasks where completed_at is null and due_at<now()),
    'active_projects',(select count(*) from public.projects where status='active')
  );
end $$;
revoke execute on function public.get_dashboard_metrics() from public,anon;
grant execute on function public.get_dashboard_metrics() to authenticated;

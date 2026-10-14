-- Lead outcomes and reminders adapted from the reference CRM for AgencyDesk.
-- All writes stay inside one transaction. Provider credentials are not involved.
-- Preserve inactive historical owners while retaining workspace assignment checks.
do $$ declare definition text; original text := 'if new.owner_id is not null and not exists(select 1 from public.staff_members where user_id=new.owner_id and agency_id=parent and active)'; begin
  select pg_get_functiondef('private.guard_agency()'::regprocedure) into definition;
  if position(original in definition)=0 then raise exception 'Unexpected workspace guard definition; review before migration'; end if;
  execute replace(definition,original,'if new.owner_id is not null and (TG_OP=''INSERT'' or new.owner_id is distinct from old.owner_id) and not exists(select 1 from public.staff_members where user_id=new.owner_id and agency_id=parent and active)');
end $$;
create table private.lead_call_actions (
  actor_id uuid not null references auth.users(id),
  action_id uuid not null,
  lead_id uuid not null references public.leads(id),
  outcome text not null,
  note text not null,
  callback_at timestamptz,
  event_id uuid not null references public.activity_events(id),
  primary key (actor_id, action_id)
);
alter table private.lead_call_actions enable row level security;
revoke all on private.lead_call_actions from public, anon, authenticated, service_role;
create index lead_call_actions_lead on private.lead_call_actions(lead_id);

-- The trigger needs elevated insert access because activity is append-only to
-- staff. It is private, is never granted for direct calls, and reads only the
-- database's changed row and authenticated actor.
create function private.log_lead_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.source = 'manual' or (auth.uid() is not null and private.is_staff()) then
      insert into public.activity_events(lead_id,actor_id,event_type,detail)
      values(new.id,auth.uid(),'lead_created',jsonb_build_object('source',new.source));
    end if;
    return new;
  end if;
  if new.status is distinct from old.status then
    insert into public.activity_events(lead_id,actor_id,event_type,detail)
    values(new.id,auth.uid(),'lead_stage_changed',jsonb_build_object('from',old.status,'to',new.status));
  end if;
  if new.owner_id is distinct from old.owner_id then
    insert into public.activity_events(lead_id,actor_id,event_type,detail)
    values(new.id,auth.uid(),'lead_owner_changed',jsonb_build_object('from',old.owner_id,'to',new.owner_id));
  end if;
  if new.archived_at is distinct from old.archived_at then
    insert into public.activity_events(lead_id,actor_id,event_type,detail)
    values(new.id,auth.uid(),case when new.archived_at is null then 'lead_restored' else 'lead_archived' end,'{}');
  end if;
  if new.company_id is distinct from old.company_id then
    insert into public.activity_events(lead_id,actor_id,event_type,detail)
    values(new.id,auth.uid(),'lead_company_changed','{}');
  end if;
  if (new.contact_name,new.email,new.phone,new.service,new.brief,new.budget_cents)
    is distinct from (old.contact_name,old.email,old.phone,old.service,old.brief,old.budget_cents) then
    insert into public.activity_events(lead_id,actor_id,event_type,detail)
    values(new.id,auth.uid(),'lead_details_changed','{}');
  end if;
  if (new.email_opt_in,new.whatsapp_opt_in) is distinct from (old.email_opt_in,old.whatsapp_opt_in) then
    insert into public.activity_events(lead_id,actor_id,event_type,detail)
    values(new.id,auth.uid(),'lead_permission_changed',jsonb_build_object('email_opt_in',new.email_opt_in,'whatsapp_opt_in',new.whatsapp_opt_in));
  end if;
  return new;
end $$;
revoke all on function private.log_lead_change() from public,anon,authenticated;
create trigger lead_activity after insert or update on public.leads
for each row execute function private.log_lead_change();

create function private.log_lead_call(
  p_lead_id uuid, p_outcome text, p_note text,
  p_callback_at timestamptz, p_action_id uuid
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  lead public.leads%rowtype;
  previous private.lead_call_actions%rowtype;
  call_id uuid;
  task_id uuid;
  task_owner uuid;
  next_stage text;
begin
  if actor is null or not private.is_staff() then
    raise exception 'Staff access required' using errcode='42501';
  end if;
  if p_action_id is null or p_lead_id is null or p_outcome is null or
    p_outcome not in ('connected','no_answer','callback','not_interested','invalid_number') or
    p_note is null or length(p_note)>4000 then
    raise exception 'Invalid call details' using errcode='22023';
  end if;
  if (p_outcome='callback' and p_callback_at is null) or (p_outcome<>'callback' and p_callback_at is not null) then
    raise exception 'Callback time must match outcome' using errcode='22023';
  end if;
  -- Serializes all work for this lead, including proposal acceptance.
  select * into lead from public.leads where id=p_lead_id and private.owns_agency(agency_id) for update;
  if not found then raise exception 'Lead unavailable'; end if;
  -- A transaction advisory lock also serializes reuse of an action ID across
  -- different leads for the same actor before checking the unique ledger.
  perform pg_advisory_xact_lock(hashtextextended(actor::text||p_action_id::text,0));
  select * into previous from private.lead_call_actions where actor_id=actor and action_id=p_action_id;
  if found then
    if (previous.lead_id,previous.outcome,previous.note,previous.callback_at)
      is distinct from (p_lead_id,p_outcome,trim(p_note),p_callback_at) then
      raise exception 'Action ID has already been used for a different call';
    end if;
    return previous.event_id;
  end if;
  if lead.archived_at is not null then raise exception 'Restore the lead before recording a call'; end if;
  if p_outcome='callback' and p_callback_at<=now() then raise exception 'Choose a future callback time'; end if;
  next_stage := lead.status;
  if lead.status not in ('won','lost') then
    if p_outcome in ('not_interested','invalid_number') then next_stage := 'lost';
    elsif p_outcome='connected' and lead.status='new' then next_stage := 'contacted';
    end if;
  end if;
  if next_stage<>lead.status then update public.leads set status=next_stage where id=p_lead_id; end if;
  insert into public.activity_events(lead_id,actor_id,event_type,detail)
  values(p_lead_id,actor,'lead_call_logged',jsonb_build_object('outcome',p_outcome,'note',trim(p_note))) returning id into call_id;
  if p_outcome='callback' then
    select user_id into task_owner from public.staff_members where user_id=lead.owner_id and active and agency_id=lead.agency_id;
    insert into public.follow_up_tasks(lead_id,title,due_at,assigned_to)
    values(p_lead_id,'Call back '||left(lead.contact_name,180),p_callback_at,coalesce(task_owner,actor)) returning id into task_id;
    insert into public.activity_events(lead_id,actor_id,event_type,detail)
    values(p_lead_id,actor,'callback_scheduled',jsonb_build_object('task_id',task_id,'callback_at',p_callback_at));
  end if;
  insert into private.lead_call_actions(actor_id,action_id,lead_id,outcome,note,callback_at,event_id)
  values(actor,p_action_id,p_lead_id,p_outcome,trim(p_note),p_callback_at,call_id);
  return call_id;
end $$;
revoke all on function private.log_lead_call(uuid,text,text,timestamptz,uuid) from public,anon;
grant execute on function private.log_lead_call(uuid,text,text,timestamptz,uuid) to authenticated;
create function public.log_lead_call(
 p_lead_id uuid, p_outcome text, p_note text default '',
 p_callback_at timestamptz default null, p_action_id uuid default gen_random_uuid()
) returns uuid language sql security invoker set search_path = '' as $$
 select private.log_lead_call(p_lead_id,p_outcome,p_note,p_callback_at,p_action_id)
$$;
revoke all on function public.log_lead_call(uuid,text,text,timestamptz,uuid) from public,anon;
grant execute on function public.log_lead_call(uuid,text,text,timestamptz,uuid) to authenticated;

create index leads_page_active on public.leads(created_at desc,id desc) where archived_at is null;
create index leads_owner_page_active on public.leads(owner_id,created_at desc,id desc) where archived_at is null;

-- Preserve an old inactive owner while editing another field, but never make
-- a new assignment to inactive staff. This also protects direct table writes.
create function private.guard_lead_owner() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.owner_id is not null and (tg_op='INSERT' or new.owner_id is distinct from old.owner_id)
    and not exists(select 1 from public.staff_members where user_id=new.owner_id and active and agency_id=new.agency_id) then
    raise exception 'Choose an active staff owner' using errcode='22023';
  end if;
  return new;
end $$;
revoke all on function private.guard_lead_owner() from public,anon,authenticated;
create trigger lead_owner_guard before insert or update on public.leads
for each row execute function private.guard_lead_owner();

create table private.manual_lead_actions (
  action_id uuid primary key,
  actor_id uuid not null references auth.users(id),
  lead_id uuid not null references public.leads(id),
  details jsonb not null
);
alter table private.manual_lead_actions enable row level security;
revoke all on private.manual_lead_actions from public,anon,authenticated,service_role;
create index manual_lead_actions_actor on private.manual_lead_actions(actor_id);
create index manual_lead_actions_lead on private.manual_lead_actions(lead_id);

create function private.create_manual_lead(p_action_id uuid,p_details jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  actor uuid := auth.uid();
  previous private.manual_lead_actions%rowtype;
  normalized jsonb;
  contact_name text;
  email text;
  phone text;
  service text;
  brief text;
  source text;
  budget numeric;
  email_opt_in boolean;
  whatsapp_opt_in boolean;
  owner_id uuid;
  company_id uuid;
  result uuid;
begin
  if actor is null or not private.is_staff() then raise exception 'Staff access required' using errcode='42501'; end if;
  if p_action_id is null or p_details is null or jsonb_typeof(p_details)<>'object' then raise exception 'Invalid manual lead'; end if;
  if jsonb_typeof(p_details->'contact_name') is distinct from 'string'
    or jsonb_typeof(p_details->'email') is distinct from 'string'
    or jsonb_typeof(p_details->'service') is distinct from 'string'
    or jsonb_typeof(p_details->'brief') is distinct from 'string'
    or jsonb_typeof(p_details->'source') is distinct from 'string'
    or jsonb_typeof(p_details->'budget_cents') is distinct from 'number'
    or jsonb_typeof(p_details->'email_opt_in') is distinct from 'boolean'
    or jsonb_typeof(p_details->'whatsapp_opt_in') is distinct from 'boolean'
    or coalesce(jsonb_typeof(p_details->'phone'),'null') not in ('string','null')
    or coalesce(jsonb_typeof(p_details->'owner_id'),'null') not in ('string','null')
    or coalesce(jsonb_typeof(p_details->'company_id'),'null') not in ('string','null') then
    raise exception 'Invalid manual lead field types' using errcode='22023';
  end if;
  contact_name:=trim(p_details->>'contact_name'); email:=lower(trim(p_details->>'email'));
  phone:=nullif(trim(p_details->>'phone'),''); service:=trim(p_details->>'service');
  brief:=trim(p_details->>'brief'); source:=trim(p_details->>'source');
  budget:=(p_details->>'budget_cents')::numeric;
  email_opt_in:=(p_details->>'email_opt_in')::boolean; whatsapp_opt_in:=(p_details->>'whatsapp_opt_in')::boolean;
  owner_id:=nullif(p_details->>'owner_id','')::uuid; company_id:=nullif(p_details->>'company_id','')::uuid;
  if company_id is not null and not exists(select 1 from public.companies c where c.id=company_id and private.owns_agency(c.agency_id)) then
    raise exception 'Choose a company in your agency' using errcode='42501';
  end if;
  if length(contact_name) not between 1 and 100 or length(email)>254
    or email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(service) not between 1 and 100 or length(brief) not between 1 and 4000
    or length(source) not between 1 and 80 or budget<>trunc(budget) or budget<0 or budget>100000000
    or (phone is not null and phone !~ '^\+[1-9][0-9]{7,14}$')
    or (whatsapp_opt_in and phone is null) then raise exception 'Invalid manual lead' using errcode='22023'; end if;
  normalized:=jsonb_build_object('contact_name',contact_name,'email',email,'phone',phone,'service',service,'brief',brief,
    'source',source,'budget_cents',budget,'email_opt_in',email_opt_in,'whatsapp_opt_in',whatsapp_opt_in,'owner_id',owner_id,'company_id',company_id);
  -- A globally unique action belongs to its originating actor. Retries with a
  -- different actor or different details cannot accidentally create a new lead.
  perform pg_advisory_xact_lock(hashtextextended('manual-lead:'||p_action_id::text,0));
  select * into previous from private.manual_lead_actions where action_id=p_action_id;
  if found then
    if previous.actor_id<>actor or previous.details is distinct from normalized then raise exception 'Action ID has already been used'; end if;
    if not exists(select 1 from public.leads l where l.id=previous.lead_id and private.owns_agency(l.agency_id)) then raise exception 'Lead unavailable' using errcode='42501'; end if;
    return previous.lead_id;
  end if;
  insert into public.leads(agency_id,contact_name,email,phone,service,brief,source,budget_cents,email_opt_in,whatsapp_opt_in,owner_id,company_id,status)
  values(private.staff_agency(),contact_name,email,phone,service,brief,source,budget::bigint,email_opt_in,whatsapp_opt_in,owner_id,company_id,'new') returning id into result;
  insert into private.manual_lead_actions(action_id,actor_id,lead_id,details) values(p_action_id,actor,result,normalized);
  return result;
end $$;
revoke all on function private.create_manual_lead(uuid,jsonb) from public,anon;
grant execute on function private.create_manual_lead(uuid,jsonb) to authenticated;
create function public.create_manual_lead(p_action_id uuid,p_details jsonb)
returns uuid language sql security invoker set search_path='' as $$ select private.create_manual_lead(p_action_id,p_details) $$;
revoke all on function public.create_manual_lead(uuid,jsonb) from public,anon;
grant execute on function public.create_manual_lead(uuid,jsonb) to authenticated;

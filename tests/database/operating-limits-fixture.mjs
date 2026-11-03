// Fictional records in disposable test databases only; never hosted CRM data.
export const agency='a0000000-0000-4000-8000-000000000001';
export const otherAgency='91000000-0000-4000-8000-000000000002';
export const admin='91000000-0000-4000-8000-000000000003';
export const bootstrap=`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public to anon,authenticated,service_role;
grant execute on function auth.uid() to anon,authenticated,service_role;
create schema private;alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema private grant all on tables to service_role;
alter default privileges grant execute on functions to service_role;`;
export const identity=`insert into auth.users values('${admin}','caps-admin@example.test');
insert into public.staff_members(user_id,role,active)values('${admin}','admin',true);
insert into public.agencies(id,name,slug)values('${otherAgency}','Fictional second agency','caps-test-other');`;
// SQL inputs below are controlled fixture constants, never external/user input.
export function queueSql(count=1,target=agency,channel='email'){
 if(!Number.isInteger(count)||count<1||count>100||![agency,otherAgency].includes(target)||!['email','whatsapp'].includes(channel))throw new Error('Invalid fixture');
 return `reset role;
 update public.automation_rules set enabled=true,approval_required=true,channel='${channel}',provider='${channel==='email'?'resend':'whatsapp'}' where agency_id='${target}' and template_key='inquiry_acknowledgment';
 do $$declare fixture_lead uuid;job_id uuid;begin
 for n in 1..${count} loop
 fixture_lead=gen_random_uuid();
 insert into public.leads(id,agency_id,contact_name,email,phone,service,brief,email_opt_in,whatsapp_opt_in)
 values(fixture_lead,'${target}','Fictional capacity test',fixture_lead::text||'@example.test','+639171234567','Website','Fictional capacity test inquiry',true,true);
 insert into public.activity_events(agency_id,lead_id,event_type)values('${target}',fixture_lead,'inquiry_received');
 select id into strict job_id from public.message_jobs where public.message_jobs.lead_id=fixture_lead;
 update public.message_jobs set status='queued',approved_by='${admin}',approved_at=clock_timestamp() where id=job_id;
 end loop;end $$;`;
}
export const claimSql=(limit=100,target=agency)=>`set role service_role;select * from public.claim_message_jobs(${limit},'${target}');`;

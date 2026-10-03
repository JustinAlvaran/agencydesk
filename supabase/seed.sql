-- Original fictional examples. No production/client/reference-project content.
-- No Auth users or reusable passwords are created. Invite your admin separately.
insert into public.companies(id,name) values
 ('20000000-0000-4000-8000-000000000001','Northstar Studio'),
 ('20000000-0000-4000-8000-000000000002','Meadow Supply'),
 ('20000000-0000-4000-8000-000000000003','Orbit Learning')
on conflict(id) do nothing;
insert into public.contacts(id,company_id,name,email) values
 ('21000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Maya Chen','maya@northstar.example'),
 ('21000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Eli Rivera','eli@meadow.example'),
 ('21000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','Sam Parker','sam@orbit.example')
on conflict(id) do nothing;
insert into public.leads(id,company_id,contact_name,email,service,brief,budget_cents,status) values
 ('22000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Maya Chen','maya@northstar.example','Client portal','An original portal for fictional creative project approvals.',800000,'qualified'),
 ('22000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Eli Rivera','eli@meadow.example','Business website','A fictional product catalog and wholesale inquiry experience.',450000,'contacted'),
 ('22000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','Sam Parker','sam@orbit.example','Web application','A fictional education portal for scheduling small group workshops.',1200000,'new')
on conflict(id) do nothing;
insert into public.follow_up_tasks(id,lead_id,title,due_at) values
 ('23000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','Confirm approval workflow',now()+interval '1 day'),
 ('23000000-0000-4000-8000-000000000002','22000000-0000-4000-8000-000000000002','Schedule discovery call',now()-interval '1 day')
on conflict(id) do nothing;
insert into public.proposal_series(id,lead_id,company_id,title) values
 ('24000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Northstar approval portal')
on conflict(id) do nothing;
insert into public.proposal_revisions(id,series_id,version,scope,expires_at) values
 ('25000000-0000-4000-8000-000000000001','24000000-0000-4000-8000-000000000001',1,'Build a responsive client portal for milestone updates, feedback, and approval visibility.',now()+interval '30 days')
on conflict(id) do nothing;
insert into public.proposal_items(id,revision_id,description,quantity,unit_price_cents,position) values
 ('26000000-0000-4000-8000-000000000001','25000000-0000-4000-8000-000000000001','Product discovery and interface design',1,200000,0),
 ('26000000-0000-4000-8000-000000000002','25000000-0000-4000-8000-000000000001','Portal development and verification',1,600000,1)
on conflict(id) do nothing;

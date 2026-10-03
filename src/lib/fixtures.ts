import type { Contact, DashboardData, Lead, Project, Proposal, Task } from './domain';
const stamp = '2026-10-01T09:00:00Z';
export const leads: Lead[] = [
 ['1','Maya Chen','maya@example.com','Brand & website','A new storefront for a fictional specialty coffee studio.',480000,'qualified'],
 ['2','Theo Rivera','theo@example.com','Web application','An operations workspace for a fictional logistics team.',1250000,'proposal_sent'],
 ['3','Ari Morgan','ari@example.com','Website redesign','A welcoming website for a fictional wellness practice.',320000,'new'],
 ['4','Sam Okafor','sam@example.com','Client portal','A secure portal for a fictional consulting studio.',860000,'contacted'],
 ['5','Jamie Park','jamie@example.com','Brand & website','A launch website for a fictional architecture studio.',640000,'won'],
 ['6','Alex Santos','alex@example.com','Website redesign','An accessible booking experience for a fictional art workshop.',290000,'lost'],
].map(([id,contact_name,email,service,brief,budget_cents,status]) => ({id:String(id),contact_name:String(contact_name),email:String(email),service:String(service),brief:String(brief),budget_cents:Number(budget_cents),status:status as Lead['status'],owner_id:null,archived_at:null,created_at:stamp}));
export const projects: Project[] = [{id:'1',title:'Forma — digital launch',company_id:'1',accepted_revision_id:'1',status:'active',created_at:stamp,client_name:'Forma Studio',progress:68,due_date:'2026-11-06'}, {id:'2',title:'Northline — operations portal',company_id:'2',accepted_revision_id:'2',status:'active',created_at:stamp,client_name:'Northline',progress:32,due_date:'2026-11-20'}];
export const proposals: Proposal[] = [{id:'1',title:'Northline operations workspace',lead_id:'2',company_id:'2',created_at:stamp,status:'published',total_cents:1250000,client_name:'Northline'}, {id:'2',title:'Forma digital launch',lead_id:'5',company_id:'1',created_at:stamp,status:'accepted',total_cents:640000,client_name:'Forma Studio'}, {id:'3',title:'Ember brand & website',lead_id:'1',company_id:'3',created_at:stamp,status:'draft',total_cents:480000,client_name:'Ember Coffee'}];
export const tasks: Task[] = [{id:'1',title:'Send Ember discovery recap',due_at:'2026-10-02T10:00:00Z',completed_at:null,lead_id:'1',assigned_to:null,created_at:stamp},{id:'2',title:'Review Northline proposal feedback',due_at:'2026-10-03T10:00:00Z',completed_at:null,lead_id:'2',assigned_to:null,created_at:stamp},{id:'3',title:'Prepare Forma launch checklist',due_at:'2026-10-05T10:00:00Z',completed_at:null,lead_id:'5',assigned_to:null,created_at:stamp}];
export const contacts: Contact[] = leads.map(lead => ({id:lead.id,name:lead.contact_name,email:lead.email,company_id:lead.id,created_at:stamp}));
export const dashboard: DashboardData = {leads,proposals,projects,tasks,openLeads:4,pipelineValue:2510000,acceptedValue:640000,overdueTasks:0};
export const demoLeads=leads, demoProjects=projects, demoProposals=proposals, demoTasks=tasks, demoContacts=contacts, demoDashboard=dashboard;

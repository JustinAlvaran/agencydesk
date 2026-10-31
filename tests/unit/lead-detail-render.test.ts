import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({row:vi.fn(),choices:vi.fn(),staff:vi.fn(),tasks:vi.fn()}));
vi.mock('@/lib/data',()=>({row:mocks.row,choices:mocks.choices}));
vi.mock('@/lib/auth',()=>({requireStaff:mocks.staff}));
vi.mock('@/lib/leads/tasks',()=>({leadTasks:mocks.tasks}));
vi.mock('@/app/actions',()=>({addNote:vi.fn(),updateLead:vi.fn(),createTask:vi.fn(),completeTask:vi.fn()}));
vi.mock('@/app/crm/lead-actions',()=>({recordLeadCall:vi.fn(),saveLeadDetails:vi.fn(),suppressLeadRecipient:vi.fn(),clearLeadRecipientSuppression:vi.fn()}));
vi.mock('@/components/hermes-draft',()=>({HermesDraft:()=>null}));
import Page from '@/app/crm/leads/[id]/page';
import styles from '@/components/lead-workspace.module.css';
const id='00000000-0000-4000-8000-000000000001';
const lead={id,contact_name:'Isolated test contact',email:'test@example.test',phone:'+12025550123',service:'Website',brief:'Isolated test brief',status:'qualified',budget_cents:10000,owner_id:null,archived_at:null,created_at:'2026-10-31T00:00:00Z'};
beforeEach(()=>{vi.clearAllMocks();mocks.row.mockResolvedValue(lead);mocks.choices.mockResolvedValue({staff:[],companies:[],leads:[]});mocks.tasks.mockResolvedValue({rows:[],count:0,queriedAt:'2026-10-31T00:00:00Z'});const query={select:()=>query,eq:()=>query,order:()=>query,limit:async()=>({data:[],error:null})};mocks.staff.mockResolvedValue({user:{id:'test-user'},staff:{role:'staff'},supabase:{from:()=>query,rpc:async()=>({data:[{channel:'email',suppressed:false},{channel:'whatsapp',suppressed:false}],error:null})}});});
async function html(){const result=renderToStaticMarkup(await Page({params:Promise.resolve({id}),searchParams:Promise.resolve({returnTo:'/crm/leads?view=board&owner=unassigned&page=2'})}));
 // Opt-in private layout artifact. Never served by an application route or loaded from real data.
 if(process.env.CRM_LAYOUT_ARTIFACT==='1'&&result.includes('Create task')){
  const root=resolve(__dirname,'../..');const output=resolve(root,'.local/layout-fixture');mkdirSync(output,{recursive:true});
  const css=readFileSync(resolve(root,'src/components/lead-workspace.module.css'),'utf8').replace(/:global\(([^)]+)\)/g,'$1').replace(/\.([a-zA-Z][\w-]*)/g,(match,key)=>styles[key]?`.${styles[key]}`:match);
  writeFileSync(resolve(output,'detail.json'),JSON.stringify({html:result,css}));
 }
 return result;}
describe('live lead detail composition',()=>{
 it('retains existing actions and new lead-scoped next steps',async()=>{const result=await html();for(const label of ['Save contact details','Save lead','Record call','Add note','Stop email messages','Stop WhatsApp messages','Create task','Activity history'])expect(result).toContain(label);expect(mocks.tasks).toHaveBeenCalledWith(id);expect(result).toContain('name="lead_id" value="'+id+'"');});
 it('keeps calls/contact apps distinct from delivery and preserves list context',async()=>{const result=await html();expect(result).toContain('href="mailto:test@example.test"');expect(result).toContain('href="tel:+12025550123"');expect(result).toContain('href="/crm/leads?owner=unassigned&amp;view=board&amp;page=2"');expect(result).toContain('They do not send a message automatically');expect(result).toContain('Won is set when the client accepts a proposal');});
 it('hides new delivery/task creation affordances on archived leads',async()=>{mocks.row.mockResolvedValue({...lead,archived_at:'2026-10-31T00:00:00Z'});const result=await html();expect(result).not.toContain('Create task');expect(result).not.toContain('Message drafts');expect(result).not.toContain('Stop email messages');expect(result).toContain('Save lead');});
});

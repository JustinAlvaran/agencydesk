import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
vi.mock('@/app/actions',()=>({createTask:vi.fn(),completeTask:vi.fn()}));
import {LeadNextActions} from '@/components/lead-next-actions';
const base={leadId:'test-lead',ownerId:null,archived:false,total:1,queriedAt:'2026-10-31T01:00:00.000Z',userId:'test-user',staff:[]};
const task={id:'test-task',title:'Isolated test follow-up',lead_id:'test-lead',assigned_to:null,completed_at:null,created_at:'2026-10-30T00:00:00Z'};
describe('lead next actions',()=>{
 it('compares instants rather than timestamp text for overdue labels',()=>{const future=renderToStaticMarkup(createElement(LeadNextActions,{...base,tasks:[{...task,due_at:'2026-10-30T23:00:00-04:00'}]}));expect(future).not.toContain('Overdue');const past=renderToStaticMarkup(createElement(LeadNextActions,{...base,tasks:[{...task,due_at:'2026-10-31T08:59:00+08:00'}]}));expect(past).toContain('Overdue');});
 it('keeps completion and creation scoped to existing lead/task IDs',()=>{const html=renderToStaticMarkup(createElement(LeadNextActions,{...base,tasks:[{...task,due_at:null}]}));expect(html).toContain('name="id" value="test-task"');expect(html).toContain('name="lead_id" value="test-lead"');expect(html).toContain('Mark complete');expect(html).toContain('not a calendar reservation');});
 it('does not offer creation on archived leads or invent an empty next step',()=>{const html=renderToStaticMarkup(createElement(LeadNextActions,{...base,archived:true,tasks:[],total:0}));expect(html).not.toContain('Create task');expect(html).toContain('No open tasks');});
});

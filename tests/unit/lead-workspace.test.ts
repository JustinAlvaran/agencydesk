import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
vi.mock('@/app/crm/lead-stage-action',()=>({moveLeadStage:vi.fn()}));
import {LeadWorkspace} from '@/components/lead-workspace';
import {leadListReturn} from '@/lib/leads/navigation';
import type {Lead} from '@/lib/domain';
const lead:Lead={id:'00000000-0000-4000-8000-000000000001',contact_name:'Isolated test contact',email:'test@example.test',service:'Website',brief:'Unit-test-only record',budget_cents:10000,status:'new',owner_id:null,company_id:null,archived_at:null,created_at:'2026-10-31T00:00:00Z'};
describe('lead workspace',()=>{
 it('labels page counts separately from authoritative total',()=>{const html=renderToStaticMarkup(createElement(LeadWorkspace,{leads:[lead],total:180}));expect(html).toContain('1 on this page');expect(html).toContain('180');expect(html).toContain('Stage counts describe this page');expect(html).not.toContain('conversion');});
 it('never shows mutation controls for Won, archived or read-only leads',()=>{for(const props of [{leads:[{...lead,status:'won' as const}]},{leads:[{...lead,archived_at:'2026-10-31T00:00:00Z'}]},{leads:[lead],readOnly:true}]){expect(renderToStaticMarkup(createElement(LeadWorkspace,{...props,total:1}))).not.toContain('Update stage');}});
 it('preserves selected stage and empty feedback without manufacturing records',()=>{const html=renderToStaticMarkup(createElement(LeadWorkspace,{leads:[],total:0,stageFilter:'qualified',readOnly:true}));expect(html).toContain('Qualified leads');expect(html).not.toContain('New leads');expect(html).toContain('No records are loaded');expect(html).not.toContain('Update stage');});
 it('keeps table view and whitelisted list context',()=>{const html=renderToStaticMarkup(createElement(LeadWorkspace,{leads:[lead],total:1,view:'table',returnTo:'/crm/leads?view=table&page=2'}));expect(html).toContain('Leads table');expect(html).toContain('returnTo=%2Fcrm%2Fleads%3Fview%3Dtable%26page%3D2');});
 it('limits return navigation to lead-list filters',()=>{expect(leadListReturn('/crm/leads?q=Jane&view=board&page=2&next=https://evil.test')).toBe('/crm/leads?q=Jane&view=board&page=2');for(const unsafe of ['https://evil.test','//evil.test','/crm/leads/../tasks','/crm/leads?x=1#bad',undefined]){expect(leadListReturn(unsafe)).toBe('/crm/leads');}});
});

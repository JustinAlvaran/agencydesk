import {beforeEach,describe,expect,it,vi} from 'vitest';
import {createClient} from '@supabase/supabase-js';
vi.mock('server-only',()=>({}));
const {staff}=vi.hoisted(()=>({staff:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireStaff:staff}));
import {leadTasks} from '@/lib/leads/tasks';
let requested:URL;let failed=false;
beforeEach(()=>{failed=false;const supabase=createClient('https://own-project.example.test','test-publishable-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input)=>{requested=new URL(String(input));return new Response(failed?'{}':'[]',{status:failed?403:200,headers:{'Content-Type':'application/json','Content-Range':'*/0'}});}}});staff.mockResolvedValue({supabase});});
describe('lead next actions query',()=>{
 it('requires staff and restricts bounded open tasks to this lead',async()=>{const id='00000000-0000-4000-8000-000000000001';const result=await leadTasks(id);expect(staff).toHaveBeenCalledOnce();expect(requested.searchParams.get('lead_id')).toBe(`eq.${id}`);expect(requested.searchParams.get('completed_at')).toBe('is.null');expect(requested.searchParams.get('order')).toBe('due_at.asc.nullslast,id.asc');expect(requested.searchParams.get('limit')).toBe('20');expect(result.count).toBe(0);});
 it('rejects invalid IDs before accessing the provider',async()=>{await expect(leadTasks('bad')).rejects.toThrow();expect(staff).not.toHaveBeenCalled();});
 it('does not replace query failures with an empty success',async()=>{failed=true;await expect(leadTasks('00000000-0000-4000-8000-000000000001')).rejects.toThrow('Could not load lead tasks');});
});

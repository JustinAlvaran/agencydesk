import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({staff:vi.fn(),demo:vi.fn(()=>false),refresh:vi.fn(),update:vi.fn(),eq:vi.fn(),is:vi.fn(),select:vi.fn(),single:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireStaff:mocks.staff}));
vi.mock('@/lib/env',()=>({isDemo:mocks.demo}));
vi.mock('next/cache',()=>({revalidatePath:mocks.refresh}));
vi.mock('@/lib/operational-log',()=>({reportFailure:vi.fn()}));
import {moveLeadStage} from '@/app/crm/lead-stage-action';
const id='00000000-0000-4000-8000-000000000001';
function form(expected='new',status='contacted'){const data=new FormData();Object.entries({id,expected_status:expected,status}).forEach(([key,value])=>data.set(key,value));return data;}
beforeEach(()=>{vi.clearAllMocks();mocks.demo.mockReturnValue(false);const query={update:mocks.update,eq:mocks.eq,is:mocks.is,select:mocks.select,single:mocks.single};for(const method of [mocks.update,mocks.eq,mocks.is,mocks.select])method.mockReturnValue(query);mocks.single.mockResolvedValue({data:{id},error:null});mocks.staff.mockResolvedValue({supabase:{from:()=>query}});});
describe('board stage mutation',()=>{
 it('changes only stage and guards identity, previous stage and archive state',async()=>{await moveLeadStage(form());expect(mocks.update).toHaveBeenCalledWith({status:'contacted'});expect(mocks.eq.mock.calls).toEqual([['id',id],['status','new']]);expect(mocks.is).toHaveBeenCalledWith('archived_at',null);expect(mocks.refresh).toHaveBeenCalledWith('/crm','layout');});
 it('fails closed if auth denies access',async()=>{mocks.staff.mockRejectedValue(new Error('Denied'));await expect(moveLeadStage(form())).rejects.toThrow();expect(mocks.update).not.toHaveBeenCalled();});
 it('rejects stale/unavailable rows without a success refresh',async()=>{mocks.single.mockResolvedValue({data:null,error:null});await expect(moveLeadStage(form())).rejects.toThrow();expect(mocks.refresh).not.toHaveBeenCalled();});
 it('rejects database errors',async()=>{mocks.single.mockResolvedValue({data:null,error:{message:'unavailable'}});await expect(moveLeadStage(form())).rejects.toThrow();expect(mocks.refresh).not.toHaveBeenCalled();});
 it.each([['new','won'],['won','lost'],['bogus','new'],['new','bogus']])('rejects %s to %s',async(expected,status)=>{await expect(moveLeadStage(form(expected,status))).rejects.toThrow();expect(mocks.update).not.toHaveBeenCalled();});
 it('blocks demo writes',async()=>{mocks.demo.mockReturnValue(true);await expect(moveLeadStage(form())).rejects.toThrow();expect(mocks.staff).not.toHaveBeenCalled();});
});

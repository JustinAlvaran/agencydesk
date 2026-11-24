import {beforeEach,describe,it,expect,vi} from 'vitest';
import {createHmac} from 'node:crypto';
vi.mock('server-only',()=>({}));
const fake=vi.hoisted(()=>({client:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:fake.client}));
import {encryptCredentials,decryptCredentials,validWebhookSignature,testConnection} from '@/lib/connections';
import {readJson,sameOrigin,apiSession} from '@/lib/http';
import {GET as getLeads} from '@/app/api/crm/leads/route';
import {GET as getAutomations} from '@/app/api/crm/automations/route';
import {POST as accept} from '@/app/api/proposals/[id]/accept/route';
import {signIn,signInWithProvider} from '@/app/login/actions';
vi.mock('next/navigation',()=>({redirect:vi.fn(()=>{throw new Error('Redirect');})}));
const origin='http://localhost:3000';
beforeEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();vi.stubEnv('APP_URL',origin);vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','');vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','');});
it('does not grant simulated password or OAuth access without Supabase',async()=>{
 expect(await signIn(new FormData())).toHaveProperty('error');expect(await signInWithProvider('github')).toHaveProperty('error');expect(fake.client).not.toHaveBeenCalled();
});
it('fails closed on CRM reads when unconfigured',async()=>{expect((await getLeads()).status).toBe(503);expect((await getAutomations()).status).toBe(503);});
it('rejects unauthenticated requests even with a fabricated former dev cookie',async()=>{
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','public-test');
 fake.client.mockResolvedValue({auth:{getUser:vi.fn().mockResolvedValue({data:{user:null},error:null})}});
 await expect(apiSession()).rejects.toMatchObject({status:401});
});
it('requires the configured origin for mutations',()=>{expect(()=>sameOrigin(new Request(origin,{headers:{origin:'https://evil.example'}}))).toThrow();expect(()=>sameOrigin(new Request(origin))).toThrow();});
it('bounds streamed request bodies',async()=>{await expect(readJson(new Request(origin,{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(32)}),16)).rejects.toMatchObject({status:413});});
it('does not accept proposals across origins',async()=>{const response=await accept(new Request(origin,{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:'{"confirm":true}'}),{params:Promise.resolve({id:'00000000-0000-4000-8000-000000000001'})});expect(response.status).toBe(403);});
describe('credential encryption',()=>{
 beforeEach(()=>{vi.stubEnv('CONNECTION_ACTIVE_KEY_ID','test');vi.stubEnv('CONNECTION_KEYS_JSON',JSON.stringify({test:Buffer.alloc(32,7).toString('base64')}));});
 it('binds ciphertext to agency and provider and uses fresh nonces',()=>{const value={apiKey:'fictional-test-key'};const a=encryptCredentials('a','apollo',value);expect(a).not.toContain(value.apiKey);expect(a).not.toBe(encryptCredentials('a','apollo',value));expect(decryptCredentials('a','apollo',a)).toEqual(value);expect(()=>decryptCredentials('b','apollo',a)).toThrow();expect(()=>decryptCredentials('a','twilio',a)).toThrow();});
 it('refuses missing encryption keys',()=>{vi.stubEnv('CONNECTION_KEYS_JSON','{}');expect(()=>encryptCredentials('a','apollo',{apiKey:'fictional-test-key'})).toThrow();});
 it('performs only a fixed read-only provider test with redirects disabled',async()=>{const call=vi.fn().mockResolvedValue({ok:true,body:{cancel:vi.fn()}});vi.stubGlobal('fetch',call);expect(await testConnection('apollo',{apiKey:'fictional-test-key'})).toBe(true);expect(call).toHaveBeenCalledWith('https://api.apollo.io/api/v1/auth/health',expect.objectContaining({redirect:'error',cache:'no-store'}));vi.unstubAllGlobals();});
});
it('verifies exact webhook body, signature and freshness',()=>{const body='{"event":"fixture"}',secret='test-secret',now=1700000000000,timestamp='1700000000';const sig='v1='+createHmac('sha256',secret).update(timestamp+'.'+body).digest('hex');expect(validWebhookSignature(body,timestamp,sig,secret,now)).toBe(true);expect(validWebhookSignature(body+' ',timestamp,sig,secret,now)).toBe(false);expect(validWebhookSignature(body,timestamp,sig,secret,now+301000)).toBe(false);expect(validWebhookSignature(body,timestamp,'v1=abc',secret,now)).toBe(false);});

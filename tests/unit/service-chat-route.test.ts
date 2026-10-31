import {it,expect,vi,afterEach} from 'vitest';
vi.mock('server-only',()=>({}));
import {GET,POST} from '../../src/app/api/service-chat/route';
import {chatNetworkHash} from '../../src/lib/service-chat-session';
const relay='r'.repeat(48);
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
function configure(){vi.stubEnv('APP_MODE','live');vi.stubEnv('APP_URL','https://agency.example');vi.stubEnv('SERVICE_CHAT_ENABLED','true');vi.stubEnv('SERVICE_CHAT_RELAY_KEY',relay);vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://db.example');vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','public-test-key');}
function request(extra:Record<string,string>={},body:unknown={question:'A website?'}){return new Request('https://agency.example/api/service-chat',{method:'POST',headers:{origin:'https://agency.example','content-type':'application/json',...extra},body:JSON.stringify(body)});}
it('reports the runtime switch without model calls or exposing configuration',async()=>{
  configure();let calls=0;vi.stubGlobal('fetch',async()=>{calls++;throw new Error('Unexpected inference');});
  const enabled=await GET();expect(await enabled.json()).toEqual({available:true});expect(enabled.headers.get('cache-control')).toContain('no-store');
  vi.stubEnv('SERVICE_CHAT_ENABLED','false');expect(await (await GET()).json()).toEqual({available:false});
  vi.stubEnv('SERVICE_CHAT_ENABLED','true');vi.stubEnv('SERVICE_CHAT_RELAY_KEY','');expect(await (await GET()).json()).toEqual({available:false});
  expect(calls).toBe(0);
});
it('fails closed when disabled and rejects foreign Origin without provider calls',async()=>{
  configure();let calls=0;vi.stubGlobal('fetch',async()=>{calls++;throw new Error('Unexpected');});
  vi.stubEnv('SERVICE_CHAT_ENABLED','false');expect((await POST(request())).status).toBe(503);
  vi.stubEnv('SERVICE_CHAT_ENABLED','true');expect((await POST(request({origin:'https://evil.example'}))).status).toBe(403);expect(calls).toBe(0);
});
it('forwards only signed server identity and sets a private secure cookie',async()=>{
  configure();vi.stubEnv('NETLIFY','false');let sent:Headers|undefined;
  vi.stubGlobal('fetch',async(_url:unknown,init:RequestInit)=>{sent=new Headers(init.headers);return Response.json({answer:'Please prepare an inquiry.',service_id:null});});
  const response=await POST(request({'x-forwarded-for':'192.0.2.5','x-nf-client-connection-ip':'192.0.2.6'}));
  expect(response.status).toBe(200);expect(response.headers.get('set-cookie')).toContain('HttpOnly; Secure; SameSite=Strict');expect(response.headers.get('cache-control')).toContain('no-store');
  expect(sent!.get('x-agency-chat-network')).toBe(chatNetworkHash('unverified-network',relay));expect(sent!.get('x-agency-chat-session')).toMatch(/^[a-f0-9]{64}$/);
});
it('maps quota denial to safe fallback without exposing upstream response',async()=>{
  configure();vi.stubGlobal('fetch',async()=>new Response('private diagnostic',{status:429}));
  const response=await POST(request());expect(response.status).toBe(429);expect(await response.text()).not.toContain('private diagnostic');
});

it('keeps malformed and oversized relay responses distinct from bad visitor input',async()=>{
  configure();
  for(const response of [new Response('not JSON'),new Response('x'.repeat(16001))]){
    vi.stubGlobal('fetch',async()=>response);expect((await POST(request())).status).toBe(503);
  }
  expect((await POST(request({}, {question:'x'.repeat(2001)}))).status).toBe(400);
  expect((await POST(request({}, {question:'é'.repeat(9000)}))).status).toBe(413);
});

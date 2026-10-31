import {describe,it,expect} from 'vitest';
import fixtures from '../../content/fixtures.json';
import {boundedJSON,parseChat,parseServiceAnswer,serviceMessages,cloudflareServiceAnswer} from '../../supabase/functions/_shared/service-chat';
const services=fixtures.services.filter(s=>s.visibility==='visible');
describe('public service inference boundary',()=>{
  it('rejects caller-selected roles, models and agencies',()=>{
    for(const extra of [{role:'system'},{model:'paid'},{agency_id:'foreign'},{tools:[]}])
      expect(()=>parseChat({question:'A website?',...extra})).toThrow();
  });
  it('rejects chunked bodies above the byte limit',async()=>{
    await expect(boundedJSON(new Request('https://example.test',{method:'POST',body:JSON.stringify({question:'é'.repeat(9000)})}))).rejects.toMatchObject({status:413});
  });
  it('rejects oversized trusted catalog instead of dropping instructions',()=>{
    expect(()=>serviceMessages({question:'A website?',recent_questions:[]},[{...services[0],description:'é'.repeat(5000)}])).toThrow();
  });
  it('passes only catalog-bounded plain text and rejects invented links/tools',()=>{
    expect(parseServiceAnswer({answer:'The team can review a portal brief.',service_id:'web-applications'},services)).toBeDefined();
    for(const value of [{answer:'See https://evil.test',service_id:null},{answer:'Ready in 3 days',service_id:null},{answer:'Hello',service_id:'missing'},{answer:'Hello',service_id:null,tool:'send'}])
      expect(()=>parseServiceAnswer(value,services)).toThrow();
  });
  it('redacts direct identifiers before the external model call',async()=>{
    let sent='';
    const answer=await cloudflareServiceAnswer({question:'Contact owner@example.test +639171234567',recent_questions:[]},services,{account:'a'.repeat(32),key:'k'.repeat(32),model:'@cf/qwen/qwen3-30b-a3b-fp8'},async(_url,init)=>{
      sent=String(init?.body);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer:'Please prepare an inquiry.',service_id:null})}}]});
    });
    expect(answer.answer).toBe('Please prepare an inquiry.');expect(sent).not.toContain('owner@example.test');expect(sent).not.toContain('+639171234567');
  });
  it('does not retry busy, truncated or tool-bearing provider responses',async()=>{
    for(const output of [new Response('',{status:429}),Response.json({choices:[{finish_reason:'length',message:{content:'{}'}}]}),Response.json({choices:[{finish_reason:'stop',message:{content:'{}',tool_calls:[{}]}}]})]){
      let calls=0;await expect(cloudflareServiceAnswer({question:'A website?',recent_questions:[]},services,{account:'a'.repeat(32),key:'k'.repeat(32),model:'@cf/qwen/qwen3-30b-a3b-fp8'},async()=>{calls++;return output;})).rejects.toThrow();expect(calls).toBe(1);
    }
  });
  it('classifies malformed or oversized provider bodies as upstream failures',async()=>{
    for(const response of [new Response('not JSON'),new Response('x'.repeat(32769))]){
      await expect(cloudflareServiceAnswer({question:'A website?',recent_questions:[]},services,{account:'a'.repeat(32),key:'k'.repeat(32),model:'@cf/qwen/qwen3-30b-a3b-fp8'},async()=>response)).rejects.toMatchObject({status:503});
    }
  });

  it('rejects unapproved or misspelled model configuration before any provider call',async()=>{
    let calls=0;
    await expect(cloudflareServiceAnswer({question:'A website?',recent_questions:[]},services,{account:'a'.repeat(32),key:'k'.repeat(32),model:'unapproved-model'},async()=>{calls++;throw new Error('Unexpected provider call');})).rejects.toMatchObject({status:503});
    expect(calls).toBe(0);
  });

});

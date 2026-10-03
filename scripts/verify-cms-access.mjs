import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const c=JSON.parse(await fs.readFile('.local/cms-secrets.json','utf8'));const s=JSON.parse(await fs.readFile('.local/cms-session.json','utf8'));
const call=async(path,token,method='GET',body)=>{const r=await fetch(c.cmsUrl+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json();return {http:r.status,data:j.data,code:j.errors?.[0]?.extensions?.code};};
let v=await call('/versions?filter[key][_eq]=security-check',s.access_token);let id=v.data?.[0]?.id;if(!id){v=await call('/versions',s.access_token,'POST',{key:'security-check',name:'Security verification draft',collection:'services',item:'business-websites'});id=v.data?.id;}
if(!id){console.log({versionCreation:v.http,code:v.code});process.exit(1);}
await call('/versions/'+id+'/save',s.access_token,'POST',{title:'Unpublished security check'});
const paths=['/items/services?fields=id,title&limit=5','/items/services/business-websites?fields=id,title&version=security-check','/versions/'+id,'/revisions?limit=1','/users?limit=1'];const report=[];
for(const kind of ['anonymous','published','preview'])for(const path of paths){const r=await call(path,c.readers[kind]?.token);report.push({kind,path,http:r.http,code:r.code,draftExposed:JSON.stringify(r.data??null).includes('Unpublished security check')});}
await fs.writeFile('artifacts/cms-access-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));



for(const row of report){if(row.kind==='anonymous')assert.equal(row.http,403);if(row.kind==='published'){assert.equal(row.draftExposed,false);if(!row.path.startsWith('/items/services?'))assert.equal(row.http,403);}if(row.kind==='preview'&&(row.path.startsWith('/users')||row.path.startsWith('/revisions')))assert.equal(row.http,403);}
for(const kind of ['published','preview']){const denied=await call('/items/services/business-websites',c.readers[kind].token,'PATCH',{title:'Forbidden writer'});assert.equal(denied.http,403);}
console.log('CMS permission assertions passed');

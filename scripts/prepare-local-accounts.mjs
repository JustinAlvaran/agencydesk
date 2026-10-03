import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';

await mkdir('.local',{recursive:true});
const file='.local/accounts.json';
let accounts;
try { accounts=JSON.parse(await readFile(file,'utf8')); }
catch {
  accounts=['admin','clientA','clientB'].map(role=>({role,id:randomUUID(),email:role==='admin'?'admin@agencydesk.example':`${role.toLowerCase()}@agencydesk.example`,password:randomBytes(24).toString('base64url')}));
  await writeFile(file,JSON.stringify(accounts,null,2));
}
const sql=accounts.map(a=>`insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,recovery_token,email_change_token_new)
values('00000000-0000-0000-0000-000000000000','${a.id}','authenticated','authenticated','${a.email}',extensions.crypt('${a.password}',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','') on conflict(id) do nothing;
insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
values(gen_random_uuid(),'${a.id}','${a.id}','{"sub":"${a.id}","email":"${a.email}","email_verified":true,"phone_verified":false}','email',now(),now(),now()) on conflict(provider_id,provider) do nothing;`).join('\n');
await writeFile('.local/bootstrap.sql',sql+`\ninsert into public.staff_members(user_id,role,active) values('${accounts[0].id}','admin',true) on conflict(user_id) do nothing;
insert into public.client_memberships(user_id,company_id,active,can_accept_proposals) values('${accounts[1].id}','20000000-0000-4000-8000-000000000001',true,true),('${accounts[2].id}','20000000-0000-4000-8000-000000000002',true,true) on conflict(user_id,company_id) do nothing;`);
console.log('Prepared private local account file and SQL; credentials were not printed.');

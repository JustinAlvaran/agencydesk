import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync,existsSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';

if(existsSync('.env.local'))for(const line of readFileSync('.env.local','utf8').split(/\r?\n/)){
 const match=line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
 if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');
}
type Account={role:string;email:string;password:string};
const accounts:Account[]=existsSync('.local/accounts.json')?JSON.parse(readFileSync('.local/accounts.json','utf8')):[];
test.use({trace:'off',video:'off'});

test('authenticated CRM and portal screens fit mobile and remain accessible',async({page})=>{
 test.skip(!accounts.length,'Live screens require private fictional accounts.');
 test.setTimeout(120000);
 for(const role of ['admin','clientA']){
  const account=accounts.find(a=>a.role===role)!;
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email address',{exact:true}).fill(account.email);
  await page.getByLabel('Password',{exact:true}).fill(account.password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page).toHaveURL(role==='admin'?/\/crm$/:/\/portal$/);
  const paths=role==='admin'?['/crm','/crm/leads','/crm/contacts','/crm/proposals','/crm/projects','/crm/tasks','/crm/settings']:['/portal','/portal/projects','/portal/proposals'];
  for(const width of [1440,390])for(const path of paths){
   await page.setViewportSize({width,height:900});
   await page.goto(path);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`${path} fits ${width}px`).toBeTruthy();
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),`${path} accessibility`).toEqual([]);
  }
 }
});

test('public signup is disabled and clients cannot generate access links',async()=>{
 test.skip(!accounts.length,'Live access checks require private fictional accounts.');
 const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 const signup=await client.auth.signUp({email:`signup-check-${Date.now()}@agencydesk.example`,password:'Fictional-test-only-password-42!'});
 expect(Boolean(signup.error)).toBeTruthy();
 const account=accounts.find(a=>a.role==='clientA')!;
 const login=await client.auth.signInWithPassword(account);
 expect(Boolean(login.error)).toBeFalsy();
 const result=await client.functions.invoke('admin-invite',{body:{email:account.email,type:'recovery',role:'admin',app_url:'http://localhost:3000'}});
 expect(Boolean(result.error)).toBeTruthy();
 expect(Boolean(result.data?.link)).toBeFalsy();
});

test('admin invitation reaches password setup once with assigned client access',async({page,browser},testInfo)=>{
 test.skip(!accounts.length,'Live invitation requires private fictional accounts.');
 const admin=accounts.find(a=>a.role==='admin')!;
 const clientAccount=accounts.find(a=>a.role==='clientA')!;
 const sdk=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 await sdk.auth.signInWithPassword(clientAccount);
 const {data:companies}=await sdk.from('companies').select('id').limit(1);
 await page.goto('/login');
 await page.getByLabel('Email address',{exact:true}).fill(admin.email);
 await page.getByLabel('Password',{exact:true}).fill(admin.password);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page).toHaveURL(/\/crm$/);
 await page.goto('/crm/settings');
 await page.getByLabel('Account email').fill(`invitation-check-${Date.now()}@agencydesk.example`);
 await page.getByLabel('Client company').selectOption(companies![0].id);
 await page.getByRole('button',{name:'Generate private link'}).click();
 await expect(page.getByLabel('Private access link')).toBeVisible();
 const privateLink=await page.getByLabel('Private access link').inputValue();
 const link=new URL(privateLink);
 expect(link.origin===new URL(testInfo.project.use.baseURL as string).origin).toBeTruthy();
 const context=await browser.newContext({baseURL:testInfo.project.use.baseURL});
 const invited=await context.newPage();
 await invited.goto(privateLink);
 await expect(invited).toHaveURL(/\/auth\/password$/);
 await expect(invited.getByRole('heading',{name:'Set your password.'})).toBeVisible();
 const accessibility=await new AxeBuilder({page:invited}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 expect(accessibility.violations.map(v=>v.id)).toEqual([]);
 await invited.goto('/portal');
 await expect(invited).toHaveURL(/\/portal$/);
 await invited.goto('/crm');
 await expect(invited).toHaveURL(/\/portal$/);
 await invited.goto(privateLink);
 await expect(invited).toHaveURL(/\/login\?error=/);
 await context.close();
});

import {test,expect,type Page} from '@playwright/test';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {createClient} from '@supabase/supabase-js';

const envPath=path.join(process.cwd(),'.env.local');
if(existsSync(envPath))for(const line of readFileSync(envPath,'utf8').split(/\r?\n/)){const match=line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^['"]|['"]$/g,'');}
type Account={role:string;email:string;password:string};
const accountPath=path.join(process.cwd(),'.local','accounts.json');
const accounts:Account[]=existsSync(accountPath)?JSON.parse(readFileSync(accountPath,'utf8')):[];
const admin=accounts.find(a=>a.role==='admin');
const clientAccount=accounts.find(a=>a.role==='clientA');
const otherClientAccount=accounts.find(a=>a.role==='clientB');
test.use({video:'on',trace:'off',actionTimeout:15000,navigationTimeout:20000});

async function signIn(page:Page,account:Account,destination:RegExp){
 await page.goto('/login');
 await expect(page.getByRole('heading',{name:'Sign in',exact:true})).toBeVisible();
 await page.getByLabel('Email address',{exact:true}).fill(account.email);
 await page.getByLabel('Password',{exact:true}).fill(account.password);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page).toHaveURL(destination);
}
async function saved(page:Page){await expect(page.getByRole('status').filter({hasText:'Saved successfully.'}).last()).toBeVisible();}

test('inquiry becomes an accepted project with follow-ups, milestones, and client conversation',async({page,browser},testInfo)=>{
 test.skip(!admin||!clientAccount,'Live walkthrough requires ignored local fictional test accounts.');
 test.setTimeout(240000);
 const unique=Date.now().toString(36);
 const contactName=`Browser QA ${unique}`;
 const proposalTitle=`Browser QA workspace ${unique}`;
 const note=`Private discovery note ${unique}`;
 const taskTitle=`Follow up discovery ${unique}`;
 const milestoneTitle=`Client review milestone ${unique}`;
 const update=`Shared progress update ${unique}`;
 const comment=`Client approved direction ${unique}`;
 const localDate=(days:number)=>new Date(Date.now()+days*86400000+8*3600000).toISOString().slice(0,16);
 const baseURL=testInfo.project.use.baseURL as string;

 // Read the fictional client's permitted company for setup; all business writes
 // below go through the real browser forms and their Server Actions.
 const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {error:loginError}=await supabase.auth.signInWithPassword({email:clientAccount!.email,password:clientAccount!.password});
 expect(loginError,'Fictional client setup authentication').toBeNull();
 const {data:companies,error:companyError}=await supabase.from('companies').select('id,name').limit(1);
 expect(companyError).toBeNull();
 expect(companies?.length).toBe(1);
 const company=companies![0];
 await supabase.auth.signOut();

 await page.goto('/inquire');
 await page.getByLabel('Your name',{exact:true}).fill(contactName);
 await page.getByLabel('Email address',{exact:true}).fill(`browser-qa-${unique}@example.com`);
 await page.locator('select[name="service"]').selectOption('Web application');
 await page.getByLabel('Estimated budget (USD)',{exact:true}).fill('2500');
 await page.getByLabel('Project brief',{exact:true}).fill('A fictional browser verification project for an agency client workspace.');
 await page.getByRole('button',{name:'Send project inquiry',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Your inquiry has been saved.');

 await signIn(page,admin!,/\/crm$/);
 await page.goto(`/crm/leads?q=${encodeURIComponent(contactName)}`);
 await page.getByRole('link',{name:contactName,exact:true}).click();
 await expect(page).toHaveURL(/\/crm\/leads\/[a-f0-9-]+$/);
 const leadURL=page.url();
 await page.locator('select[name="status"]').selectOption('qualified');
 await page.locator('select[name="company_id"]').selectOption(company.id);
 await page.getByRole('button',{name:'Save lead',exact:true}).click();
 await saved(page);
 await page.getByLabel('New internal note',{exact:true}).fill(note);
 await page.getByRole('button',{name:'Add note',exact:true}).click();
 await expect(page.getByText(note,{exact:true})).toBeVisible();

 await page.goto('/crm/tasks');
 await page.locator('details.create-record > summary').filter({hasText:'Create task'}).click();
 await page.getByLabel('Task title',{exact:true}).fill(taskTitle);
 await page.locator('select[name="lead_id"]').selectOption({label:contactName});
 await page.getByLabel('Due date and time (Manila)',{exact:true}).fill(localDate(7));
 await page.getByRole('button',{name:'Create task',exact:true}).click();
 const task=page.getByRole('row').filter({hasText:taskTitle});
 await expect(task).toBeVisible();
 await task.getByRole('button',{name:'Mark complete',exact:true}).click();
 await expect(task).toContainText('Completed');

 await page.goto('/crm/proposals');
 await page.locator('details.create-record > summary').filter({hasText:'Create proposal'}).click();
 await page.getByLabel('Proposal title',{exact:true}).fill(proposalTitle);
 await page.locator('select[name="lead_id"]').selectOption({label:contactName});
 await page.locator('select[name="company_id"]').selectOption(company.id);
 await page.getByRole('button',{name:'Create proposal',exact:true}).click();
 await expect(page).toHaveURL(/\/crm\/proposals\/[a-f0-9-]+$/);
 const proposalURL=page.url();
 await page.getByLabel('Scope of work',{exact:true}).fill('Build an original client workspace with three milestones and a shared activity feed.');
 await page.getByLabel('Expiry (Manila time)',{exact:true}).fill(localDate(30));
 await page.getByRole('button',{name:'Create draft revision',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Revision 1 · Draft',exact:true})).toBeVisible();
 await page.getByLabel('Item description',{exact:true}).fill('Workspace design and implementation');
 await page.getByLabel('Quantity',{exact:true}).fill('1');
 await page.getByLabel('Unit price in USD cents',{exact:true}).fill('250000');
 await page.getByRole('button',{name:'Add item',exact:true}).click();
 await expect(page.getByText('Workspace design and implementation · 1 × $2,500',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Publish revision',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Revision 1 · Published',exact:true})).toBeVisible();

 const clientContext=await browser.newContext({baseURL,recordVideo:{dir:path.join(process.cwd(),'artifacts','walkthrough'),size:{width:1440,height:900}}});
 const client=await clientContext.newPage();
 await signIn(client,clientAccount!,/\/portal$/);
 await client.goto(proposalURL.replace('/crm/','/portal/'));
 await expect(client.getByText(note,{exact:true})).toHaveCount(0);
 await client.getByRole('button',{name:'Accept and start project',exact:true}).click();
 await expect(client.getByRole('heading',{name:'Version 1 · Accepted',exact:true})).toBeVisible();
 await client.goto('/portal/projects');
 await client.getByRole('link',{name:proposalTitle,exact:true}).click();
 await expect(client).toHaveURL(/\/portal\/projects\/[a-f0-9-]+$/);
 const projectURL=client.url();
 await expect(client.getByRole('heading',{name:proposalTitle,exact:true})).toBeVisible();

 await page.goto(projectURL.replace('/portal/','/crm/'));
 await page.getByLabel('Milestone title',{exact:true}).fill(milestoneTitle);
 await page.getByLabel('Due date (Manila, optional)',{exact:true}).fill(localDate(14));
 await page.getByRole('button',{name:'Add milestone',exact:true}).click();
 const milestone=page.locator('article').filter({hasText:milestoneTitle});
 await milestone.getByRole('button',{name:'Complete milestone',exact:true}).click();
 await expect(milestone).toContainText('Completed');
 await page.getByLabel('Update visible to the client',{exact:true}).fill(update);
 await page.getByRole('button',{name:'Post update',exact:true}).click();
 await expect(page.getByText(update,{exact:true})).toBeVisible();

 await client.reload();
 await expect(client.getByText(milestoneTitle,{exact:true})).toBeVisible();
 await client.getByLabel('Reply to this update',{exact:true}).fill(comment);
 await client.getByRole('button',{name:'Send comment',exact:true}).click();
 await expect(client.getByText(comment,{exact:true})).toBeVisible();
 await page.reload();
 await expect(page.getByText(comment,{exact:true})).toBeVisible();
 await page.goto(leadURL);
 await expect(page.locator('select[name="status"]')).toHaveValue('won');
 mkdirSync(path.join(process.cwd(),'artifacts','walkthrough'),{recursive:true});
 await page.screenshot({path:path.join(process.cwd(),'artifacts','walkthrough','staff-converted-lead.png'),fullPage:true});
 await page.goto('/crm');
 await expect(page.getByRole('link',{name:proposalTitle,exact:true})).toHaveAttribute('href',projectURL.replace(baseURL,'').replace('/portal/','/crm/'));
 await client.screenshot({path:path.join(process.cwd(),'artifacts','walkthrough','client-project.png'),fullPage:true});
 await clientContext.close();
 const video=client.video();
 if(video){const videoPath=path.join(process.cwd(),'artifacts','walkthrough','client-workflow.webm');await video.saveAs(videoPath);await testInfo.attach('client-workflow-video',{path:videoPath,contentType:'video/webm'});}
 if(otherClientAccount){
  const outsiderContext=await browser.newContext({baseURL});
  const outsider=await outsiderContext.newPage();
  await signIn(outsider,otherClientAccount,/\/portal$/);
  await outsider.goto(projectURL);
  await expect(outsider.getByRole('heading',{name:'This page isn’t here.',exact:true})).toBeVisible();
  await expect(outsider.getByText(update,{exact:true})).toHaveCount(0);
  await outsider.goto('/crm');
  await expect(outsider).toHaveURL(/\/portal$/);
  await outsiderContext.close();
 }
});

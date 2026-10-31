import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {resolve,dirname} from 'node:path';

for(const width of [390,1280,1440]){
 test(`empty real pipeline component is readable and navigable at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  const mutations:string[]=[];page.on('request',request=>{if(!['GET','HEAD','OPTIONS'].includes(request.method()))mutations.push(request.method());});
  await page.goto('/demo/design/leads');
  await expect(page.getByRole('heading',{level:1,name:'Lead pipeline'})).toBeVisible();
  await expect(page.getByText('Empty interface preview. No records are loaded.',{exact:true})).toBeVisible();
  const board=page.getByRole('region',{name:'Lead pipeline stages'});
  await expect(board).toBeVisible();
  await expect(board.getByRole('heading',{level:3})).toHaveCount(6);
  await expect(page.locator('form')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const stage of ['New','Contacted','Qualified','Proposal Sent','Won','Lost']){
   const column=board.getByRole('region',{name:`${stage} leads`,exact:true});
   await expect(column).toBeVisible();
   expect(await column.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  }
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id)).toEqual([]);
  await page.screenshot({path:resolve(dirname(test.info().file),'../../docs/images',`crm-pipeline-${width}.png`),fullPage:true});
  await page.getByRole('navigation',{name:'Preview lead view'}).getByRole('link',{name:'Table',exact:true}).click();
  await expect(page.getByRole('region',{name:'Leads table'})).toBeVisible();
  await expect(page.getByText('No leads match these filters.',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width===390){await page.setViewportSize({width,height:380});const trigger=page.getByRole('button',{name:'Open navigation'});await trigger.click();const drawer=page.getByRole('dialog');await expect(drawer).toBeVisible();await drawer.getByRole('button',{name:'Close navigation'}).click();await expect(trigger).toBeFocused();}
  expect(mutations).toEqual([]);
 });
}

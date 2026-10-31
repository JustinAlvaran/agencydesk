import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.setTimeout(90000);
for(const width of [390,1440]) {
  test(`emerald homepage preserves the real workflow at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000});
    const mutations:string[]=[];
    page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method()))mutations.push(request.url());});
    await page.goto('/');
    await expect(page.getByRole('heading',{level:1,name:'Websites and workflows built around your business.'})).toBeVisible();
    const preview=page.getByRole('region',{name:'AgencyDesk workflow preview'});
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('Empty interface preview');
    await expect(preview).not.toContainText('Maya Chen');
    await expect(preview).not.toContainText('$25,100');
    await page.screenshot({path:`docs/images/emerald-home-${width}.png`,fullPage:false});
    await expect(page.getByRole('link',{name:'Discuss your project',exact:true})).toHaveAttribute('href','/inquire');
    await expect(page.getByRole('link',{name:'Explore services',exact:true})).toHaveAttribute('href','/services');
    await page.getByRole('button',{name:'Watch the workflow',exact:true}).click();
    await expect(page.getByRole('heading',{name:'From first hello to final handoff.'})).toBeInViewport();
    const question=page.locator('summary').filter({hasText:'Follow up on leads'});
    await question.focus();await page.keyboard.press('Enter');
    await expect(question.locator('..').getByText('Review new inquiries, record internal notes, and schedule the next conversation.',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
    await page.goto('/');
    await page.screenshot({path:`docs/images/emerald-home-full-${width}.png`,fullPage:true});
    await page.getByRole('link',{name:'Open workspace demo',exact:true}).click();
    await expect(page).toHaveURL(/\/demo$/,{timeout:20000});
    await expect(page.getByRole('heading',{name:'Your next moves'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id)).toEqual([]);
    await page.goto('/demo/design');
    await expect(page.getByText('Empty interface preview. No records are loaded.',{exact:true})).toBeVisible();
    await expect(page.getByText('Maya Chen',{exact:true})).toHaveCount(0);
    await page.screenshot({path:`docs/images/emerald-crm-${width}.png`,fullPage:true});
    expect(mutations).toEqual([]);
  });
}

test('reduced motion and WebGL failure keep the homepage useful',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.getByRole('region',{name:'AgencyDesk workflow preview'})).toBeVisible();
  await expect(page.locator('[data-agency-world] canvas')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'Discuss your project',exact:true})).toBeVisible();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,kind:string,...args:unknown[]){
      if(kind==='webgl2'||kind==='webgl')return null;
      return Reflect.apply(original,this,[kind,...args]);
    } as typeof original;
  });
  await page.reload();
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await expect(page.getByRole('link',{name:'Discuss your project',exact:true})).toBeEnabled();
  await expect(page.getByRole('region',{name:'AgencyDesk workflow preview'})).toBeVisible();
});

test('homepage content and inquiry navigation survive without JavaScript',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await expect(page.getByRole('region',{name:'AgencyDesk workflow preview'})).toBeVisible();
  await page.getByRole('link',{name:'Discuss your project',exact:true}).click();
  await expect(page).toHaveURL(/\/inquire$/);
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await context.close();
});

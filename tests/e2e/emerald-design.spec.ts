import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.setTimeout(90000);
for(const width of [390,1440]) {
  test(`studio homepage preserves the real workflow at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000});
    const mutations:string[]=[];
    page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method()))mutations.push(request.url());});
    await page.goto('/');
    await expect(page.getByRole('heading',{level:1,name:'Websites and workflows built around your business.'})).toBeVisible();
    const preview=page.getByRole('region',{name:'AgencyDesk workflow preview'});
    await expect(preview).toBeVisible();
    await expect(preview).toContainText('Fictional demo');
    await expect(preview).toContainText('Illustrative interface with fictional records.');
    await expect(preview).not.toContainText('Maya Chen');
    await expect(preview).not.toContainText('$25,100');
    const connections=page.getByRole('region',{name:'Planned integrations',exact:true});
    await expect(page.getByRole('heading',{name:'Connect with',exact:true})).toBeVisible();
    await expect(connections.locator('img')).toHaveCount(12);
    await expect.poll(()=>connections.locator('img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0))).toBe(true);
    const previous=page.getByRole('button',{name:'Scroll integrations backward',exact:true});
    const next=page.getByRole('button',{name:'Scroll integrations forward',exact:true});
    await expect(previous).toBeDisabled();
    await next.click();
    await expect.poll(()=>connections.evaluate(node=>node.scrollLeft)).toBeGreaterThan(0);
    await expect(previous).toBeEnabled();
    await previous.click();
    await expect(previous).toBeDisabled();
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:`docs/images/studio-home-${width}.png`,fullPage:false,style:'nextjs-portal { display: none }'});
    if(width===390) {
      const trigger=page.getByRole('button',{name:'Open main navigation',exact:true});
      await trigger.click();
      const menu=page.getByRole('dialog',{name:'AgencyDesk',exact:true});
      await expect(menu.getByRole('link',{name:'Services',exact:true})).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(menu).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
    await expect(page.getByRole('link',{name:'Discuss your project',exact:true})).toHaveAttribute('href','/inquire');
    await expect(page.getByRole('link',{name:'Explore services',exact:true})).toHaveAttribute('href','/services');
    await page.getByRole('button',{name:'Watch the workflow',exact:true}).click();
    await expect(page.getByRole('heading',{name:'From first hello to final handoff.'})).toBeInViewport();
    const question=page.locator('summary').filter({hasText:'Can you work with our existing website or systems?'});
    await question.focus();await page.keyboard.press('Enter');
    await expect(question.locator('..').getByText('Yes. We review what you already have and agree on what to retain, improve, or replace. Existing systems and access boundaries are part of discovery.',{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
    await page.goto('/');
    await page.screenshot({path:`docs/images/studio-home-full-${width}.png`,fullPage:true,style:'nextjs-portal { display: none }'});
    await page.getByRole('link',{name:'Take a look inside',exact:true}).click();
    await expect(page).toHaveURL(/\/demo$/,{timeout:20000});
    await expect(page.getByRole('heading',{name:'Your next moves'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id)).toEqual([]);
    await page.goto('/demo/design');
    await expect(page.getByText('Empty interface preview. No records are loaded.',{exact:true})).toBeVisible();
    await expect(page.getByText('Maya Chen',{exact:true})).toHaveCount(0);
    await page.screenshot({path:`docs/images/studio-crm-${width}.png`,fullPage:true,style:'nextjs-portal { display: none }'});
    expect(mutations).toEqual([]);
  });
}

test('connection carousel reaches both edges after resizing with reduced motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const next=page.getByRole('button',{name:'Scroll integrations forward',exact:true});
  const previous=page.getByRole('button',{name:'Scroll integrations backward',exact:true});
  const rail=page.getByRole('region',{name:'Planned integrations',exact:true});
  async function clickAndSettle(button:typeof next) {
    // Register before the real click: reduced motion can complete scrolling immediately.
    await rail.evaluate(node=>{
      node.setAttribute('data-test-scroll','pending');
      node.addEventListener('scrollend',()=>node.setAttribute('data-test-scroll','complete'),{once:true});
    });
    await button.click();
    await expect(rail).toHaveAttribute('data-test-scroll','complete');
    // The scroll event updates React's controls asynchronously. Wait for those
    // rendered controls before deciding whether another click is possible.
    await expect.poll(async()=>{
      const edges=await rail.evaluate(node=>({start:node.scrollLeft<=1,end:node.scrollLeft+node.clientWidth>=node.scrollWidth-1}));
      return await previous.isDisabled()===edges.start&&await next.isDisabled()===edges.end;
    }).toBe(true);
  }
  await page.getByRole('region',{name:'Connect with',exact:true}).screenshot({path:'docs/images/studio-connections-390.png'});
  for(let step=0;step<12&&!await next.isDisabled();step++)await clickAndSettle(next);
  await expect(next).toBeDisabled();
  await page.setViewportSize({width:1440,height:1000});
  await expect(next).toBeDisabled();
  for(let step=0;step<12&&!await previous.isDisabled();step++)await clickAndSettle(previous);
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await page.getByRole('region',{name:'Connect with',exact:true}).screenshot({path:'docs/images/studio-connections-1440.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

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

import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Includes real WebGL, two Axe audits and screenshot capture on software-rendered CI.
test.setTimeout(120000);
for(const width of [390,1440]) {
 test(`full agency world and operator workbench at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});
  const mutations:string[]=[],assets:string[]=[];
  page.on('request',request=>{if(['POST','PATCH','PUT','DELETE'].includes(request.method()))mutations.push(request.url());if(/fal\.ai|meshy|\.glb(?:\?|$)|\.gltf(?:\?|$)/i.test(request.url()))assets.push(request.url());});
  await page.goto('/');
  await expect(page.getByRole('heading',{level:1,name:'Websites and workflows built around your business.'})).toBeVisible();
  await expect(page.locator('[data-agency-world] canvas')).toHaveCount(1);
  await expect(page.locator('[data-agency-world]')).toHaveAttribute('data-rendered','true');
  // Stabilize the real rendered scene through its public control before DOM/a11y inspection.
  await page.getByRole('button',{name:'Pause world',exact:true}).click();
  const layers=page.getByRole('button',{name:'Open the layers',exact:true});
  await expect(layers).toHaveAttribute('aria-pressed','false');
  await layers.click();
  await expect(page.getByRole('button',{name:'Close the layers',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Close the layers',exact:true}).click();
  await expect(layers).toHaveAttribute('aria-pressed','false');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id)).toEqual([]);
  await page.setViewportSize({width,height:1001});await page.setViewportSize({width,height:1000});
  await expect(page.getByRole('button',{name:'Resume world',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  expect(await page.evaluate(()=>window.scrollY)).toBe(0);
  await page.screenshot({path:`docs/images/diorama-world-home-${width}.png`,fullPage:false});
  await page.getByRole('button',{name:'Watch the workflow',exact:true}).click();
  await expect(page.getByRole('heading',{name:'From first hello to final handoff.'})).toBeInViewport();
  await page.screenshot({path:`docs/images/diorama-world-scroll-${width}.png`,fullPage:false});
  await expect(page.getByRole('link',{name:'Discuss your project',exact:true})).toHaveAttribute('href','/inquire');
  await page.goto('/demo/design');
  await expect(page.getByText('Empty interface preview. No records are loaded.',{exact:true})).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  const tasks=page.getByRole('heading',{name:'Your next moves',exact:true}),totals=page.getByRole('region',{name:'Workspace totals'});
  expect(await tasks.evaluate((heading)=>!!(heading.compareDocumentPosition(document.querySelector('[aria-label="Workspace totals"]')!)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await expect(totals).toContainText('—');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id)).toEqual([]);
  await page.screenshot({path:`docs/images/diorama-world-crm-${width}.png`,fullPage:true});
  expect(mutations).toEqual([]);expect(assets).toEqual([]);
 });
}
test('full world retains a usable reduced-motion and no-WebGL view',async({browser})=>{
 const reduced=await browser.newContext({baseURL:test.info().project.use.baseURL as string,reducedMotion:'reduce'}),page=await reduced.newPage();
 await page.goto('/');await expect(page.getByRole('button',{name:'Open the layers'})).toBeVisible();await expect(page.locator('canvas')).toHaveCount(0);
 await page.getByRole('button',{name:'Open the layers'}).click();await expect(page.getByRole('button',{name:'Close the layers'})).toHaveAttribute('aria-pressed','true');await reduced.close();
 const failed=await browser.newContext({baseURL:test.info().project.use.baseURL as string});await failed.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,kind:string,...args:unknown[]){if(/webgl/.test(kind))return null;return original.apply(this,[kind,...args] as never);} as typeof original;});
 const fallback=await failed.newPage();await fallback.goto('/');await expect(fallback.getByText('Static world', {exact:true})).toBeVisible();await expect(fallback.getByRole('link',{name:'Discuss your project',exact:true})).toBeVisible();await failed.close();
});
test('full world content and inquiry survive without JavaScript',async({browser})=>{
 const context=await browser.newContext({baseURL:test.info().project.use.baseURL as string,javaScriptEnabled:false}),page=await context.newPage();await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Websites and workflows');await expect(page.getByText('Inquiry → proposal → delivery',{exact:true})).toBeVisible();await page.getByRole('link',{name:'Discuss your project',exact:true}).click();await expect(page).toHaveURL(/\/inquire$/);await context.close();
});


test('a context-loss event releases the real world and reveals static fallback',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
 const world=page.locator('[data-agency-world]');await expect(world).toHaveAttribute('data-rendered','true');
 await world.locator('canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost')));
 await expect(page.getByText('Static world',{exact:true})).toBeVisible();
 await expect(world.locator('canvas')).toHaveCount(0);await expect(world).not.toHaveAttribute('data-rendered','true');
 await page.getByRole('link',{name:'Discuss your project',exact:true}).click();await expect(page).toHaveURL(/\/inquire$/);
});

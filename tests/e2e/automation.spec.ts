import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('automation sample stops stale work and never sends a message',async({page})=>{
  const writes:string[]=[];page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method()))writes.push(request.url());});
  await page.goto('/demo/automations');
  await expect(page.getByRole('heading',{name:'Automations',exact:true})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Workspace navigation'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Automations',exact:true})).toHaveAttribute('aria-current','page');
  await page.getByRole('button',{name:'Run sample dry run'}).click();
  await expect(page.getByRole('status')).toContainText('Simulated. No message was sent');
  await page.getByLabel('Current proposal state').selectOption('accepted');
  await page.getByRole('button',{name:'Run sample dry run'}).click();
  await expect(page.getByRole('status')).toHaveText('Skipped: the proposal is accepted.');
  await page.getByLabel('Current proposal state').selectOption('published');
  await page.getByLabel('Recipient has permitted email updates').uncheck();
  await page.getByRole('button',{name:'Run sample dry run'}).click();
  await expect(page.getByRole('status')).toHaveText('Skipped: channel permission is missing.');
  expect(writes).toEqual([]);
});
test('automation and setup screens fit desktop and mobile with accessible controls',async({page})=>{
  test.setTimeout(120000);
  for(const width of [1440,390])for(const route of ['/demo/automations','/demo/automations/setup','/inquire']){
    await page.setViewportSize({width,height:900});await page.goto(route);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} at ${width}px`).toBeTruthy();
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))).toEqual([]);
  }
});

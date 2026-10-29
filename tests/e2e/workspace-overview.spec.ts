import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.setTimeout(60000);

for(const width of [390,1440]) {
  test(`workspace overview and navigation at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:1000});
    const mutations:string[]=[];
    page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method()))mutations.push(request.url());});
    await page.goto('/demo');
    await expect(page.getByRole('heading',{level:1,name:'Overview'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Your next moves'})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Pipeline snapshot'})).toBeVisible();
    await expect(page.getByText('Fictional sample data', {exact:true})).toBeVisible();
    await expect(page.getByRole('region',{name:'Workspace totals'})).toContainText('Open leads');
    await expect(page.getByRole('region',{name:'Workspace totals'})).toContainText('$25,100');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(audit.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))).toEqual([]);
    await page.screenshot({path:`docs/images/workspace-overview-${width}.png`,fullPage:true});
    await page.getByRole('link',{name:'View pipeline',exact:true}).click();
    await expect(page).toHaveURL(/\/demo\/leads$/,{timeout:20000});
    await page.getByRole('textbox',{name:'Search leads'}).fill('Maya');
    await expect(page.getByRole('heading',{name:'Maya Chen'})).toBeVisible();
    expect(mutations).toEqual([]);
  });
}

test('mobile drawer keeps keyboard focus and restores the trigger', async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/demo');
  const trigger=page.getByRole('button',{name:'Open navigation'});
  await trigger.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(audit.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}))).toEqual([]);
  await page.keyboard.press('Tab');expect(await dialog.evaluate(node=>node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();
  await trigger.click();await dialog.getByRole('link',{name:'Tasks',exact:true}).click();
  await expect(page).toHaveURL(/\/demo\/tasks$/,{timeout:20000});await expect(dialog).toHaveCount(0);
});

test('short mobile drawer can scroll its final navigation into view',async({page})=>{
  await page.setViewportSize({width:844,height:390});
  await page.goto('/demo');
  await page.getByRole('button',{name:'Open navigation'}).click();
  const dialog=page.getByRole('dialog');
  const website=dialog.getByRole('link',{name:'Back to website'});
  await website.focus();
  await expect(website).toBeInViewport();
  expect(await dialog.evaluate(node=>node.contains(document.activeElement))).toBe(true);
  const automation=dialog.getByRole('link',{name:'Automations',exact:true});
  await automation.click();await expect(page).toHaveURL(/\/demo\/automations$/,{timeout:20000});
  await expect(dialog).toHaveCount(0);
});


test('short desktop sidebar keeps its final link reachable',async({page})=>{
  await page.setViewportSize({width:1440,height:600});
  await page.goto('/demo');
  const sidebar=page.locator('aside.app-sidebar');
  const website=sidebar.getByRole('link',{name:'Back to website'});
  await website.focus();
  await expect(website).toBeFocused();
  await expect(website).toBeInViewport();
  await expect(sidebar.getByRole('link',{name:'Overview',exact:true})).toHaveAttribute('aria-current','page');
});

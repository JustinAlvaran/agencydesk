import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {dirname,resolve} from 'node:path';

for (const width of [390, 1280, 1440]) {
  test(`AI composer stays usable across answers and quota fallback at ${width}px`, async ({page,baseURL})=>{
    expect(['localhost','127.0.0.1']).toContain(new URL(baseURL!).hostname);
    await page.setViewportSize({width,height:844});
    const inputs:Array<{question:string;recent_questions:string[]}>=[];
    await page.route('**/api/service-chat',async route=>{
      if(route.request().method()==='GET')return route.fulfill({json:{available:true}});
      inputs.push(route.request().postDataJSON());
      return route.fulfill(inputs.length>2?{status:429,json:{error:'Rate limited'}}:{json:{answer:inputs.length===1?'A client portal can organize shared project records.':'Prepare a brief so the team can review the scope.',service_id:'web-applications'}});
    });
    await page.goto('/services');
    await page.getByRole('button',{name:'Ask about services'}).click();
    const dialog=page.getByRole('dialog',{name:'AgencyDesk services guide'});
    await dialog.getByRole('button',{name:'Ask a services question with AI'}).click();
    const question=dialog.getByLabel('Your services question');
    await question.fill('Can you build a client portal?');
    await dialog.getByRole('button',{name:'Ask AI',exact:true}).click();
    await expect(dialog.getByText('A client portal can organize shared project records.',{exact:false})).toBeVisible();
    await expect(question).toBeFocused();
    await question.fill('How do we begin?');
    await dialog.getByRole('button',{name:'Ask AI',exact:true}).click();
    await expect(dialog.getByText('Prepare a brief so the team can review the scope.',{exact:false})).toBeVisible();
    expect(inputs[1]).toEqual({question:'How do we begin?',recent_questions:['Can you build a client portal?']});
    await page.screenshot({path:width===1440?test.info().outputPath('service-chat-wide-1440.png'):resolve(dirname(test.info().file),`../../docs/images/service-chat-local-test-${width}.png`),fullPage:false,animations:'disabled'});
    await expect(dialog.getByRole('link',{name:/Read web applications/})).toHaveAttribute('href','/services/web-applications');
    await question.fill('What happens next?');
    await dialog.getByRole('button',{name:'Ask AI',exact:true}).click();
    await expect(dialog.getByRole('status')).toContainText('AI answers are unavailable');
    await expect(question).toBeEnabled();
    await expect(dialog.getByRole('button',{name:'Back to service guide'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).include('[role="dialog"]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(item=>item.id)).toEqual([]);
    await dialog.getByRole('button',{name:'Prepare project inquiry'}).click();
    await expect(dialog.getByRole('checkbox',{name:/by email/})).not.toBeChecked();
    await expect(dialog.getByRole('checkbox',{name:/on WhatsApp/})).not.toBeChecked();
    await dialog.getByRole('button',{name:'Back to service guide',exact:true}).click();
    await expect(dialog.getByRole('button',{name:'Explore services',exact:true}).last()).toBeVisible();
    await expect(dialog.getByLabel('Your services question')).toHaveCount(0);
  });

  test(`runtime AI switch and availability failure preserve the guide at ${width}px`,async({page,baseURL})=>{
    expect(['localhost','127.0.0.1']).toContain(new URL(baseURL!).hostname);
    await page.setViewportSize({width,height:844});
    let availability:'off'|'on'|'failed'='off',posts=0;
    const discovery={pending:false,release:()=>{}};
    await page.route('**/api/service-chat',async route=>{
      if(route.request().method()==='POST'){posts++;return route.abort();}
      if(availability==='on')await new Promise<void>(resolve=>{discovery.pending=true;discovery.release=resolve;});
      return route.fulfill(availability==='failed'?{status:503,json:{error:'Unavailable'}}:{json:{available:availability==='on'}});
    });
    await page.goto('/services');
    const trigger=page.getByRole('button',{name:'Ask about services'});
    await trigger.click();
    const dialog=page.getByRole('dialog',{name:'AgencyDesk services guide'});
    await expect(dialog.getByRole('button',{name:'Explore services',exact:true}).last()).toBeVisible();
    await expect(dialog.getByRole('button',{name:'Ask a services question with AI'})).toHaveCount(0);
    await page.keyboard.press('Escape');
    availability='on';await trigger.click();
    await expect(dialog.getByRole('button',{name:'Explore services',exact:true}).last()).toBeVisible();
    await expect.poll(()=>discovery.pending).toBe(true);
    discovery.release();
    await expect(dialog.getByRole('button',{name:'Ask a services question with AI'})).toBeVisible();
    await page.keyboard.press('Escape');
    availability='failed';await trigger.click();
    await expect(dialog.getByRole('button',{name:'Explore services',exact:true}).last()).toBeVisible();
    await expect(dialog.getByRole('button',{name:'Ask a services question with AI'})).toHaveCount(0);
    expect(posts).toBe(0);
  });

  test(`services guide respects catalog, contact consent and keyboard focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/services');
    const trigger = page.getByRole('button', { name: 'Ask about services' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'AgencyDesk services guide' });
    await expect(dialog).toBeVisible();
    // The transcript may retain older menus; use the latest guide choices.
    await dialog.getByRole('button', { name: 'Explore services', exact: true }).last().click();
    await dialog.getByRole('button', { name: 'CRM and automation setup', exact: true }).click();
    await expect(dialog.getByText('Connect lead intake, follow-up tasks, and reviewed email or WhatsApp workflows around your agency’s process.', { exact: false })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Read service details' })).toHaveAttribute('href', '/services/crm-automation');
    await dialog.getByRole('button', { name: 'Prepare project inquiry' }).click();
    await expect(dialog.getByRole('combobox', { name: 'Service', exact: true })).toHaveValue('CRM and automation setup');
    await expect(dialog.getByRole('checkbox', { name: /by email/ })).not.toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: /on WhatsApp/ })).not.toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(item => item.id)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test(`AI deadline and closing a pending availability check retain manual contact at ${width}px`,async({page,baseURL})=>{
    expect(['localhost','127.0.0.1']).toContain(new URL(baseURL!).hostname);
    await page.setViewportSize({width,height:844});
    let lookup:'pending'|'available'='pending',pendingLookups=0,pendingQuestions=0;
    await page.route('**/api/service-chat',async route=>{
      if(route.request().method()==='POST'){pendingQuestions++;return;}
      if(lookup==='pending'){pendingLookups++;return;}
      await route.fulfill({json:{available:true}});
    });
    await page.goto('/services');
    const trigger=page.getByRole('button',{name:'Ask about services'});
    const dialog=page.getByRole('dialog',{name:'AgencyDesk services guide'});
    const isLookup=(request:import('@playwright/test').Request)=>request.method()==='GET'&&new URL(request.url()).pathname==='/api/service-chat';
    const timedOut=page.waitForEvent('requestfailed',{predicate:isLookup});
    await trigger.click();
    await expect(dialog.getByRole('button',{name:'Explore services',exact:true}).last()).toBeVisible();
    await timedOut;
    await expect(dialog.getByRole('button',{name:'Ask a services question with AI'})).toHaveCount(0);
    await page.keyboard.press('Escape');
    const cancelled=page.waitForEvent('requestfailed',{predicate:isLookup});
    await trigger.click();
    await expect.poll(()=>pendingLookups).toBe(2);
    await page.keyboard.press('Escape');
    await cancelled;
    await expect(trigger).toBeFocused();
    lookup='available';await trigger.click();
    await dialog.getByRole('button',{name:'Ask a services question with AI'}).click();
    await page.clock.install();
    await dialog.getByLabel('Your services question').fill('Can you explain client portals?');
    await dialog.getByRole('button',{name:'Ask AI',exact:true}).click();
    await expect.poll(()=>pendingQuestions).toBe(1);
    await page.clock.fastForward(16001);
    await expect(dialog.getByRole('status')).toContainText('answer took too long');
    await expect(dialog.getByLabel('Your services question')).toBeEnabled();
    await dialog.getByRole('button',{name:'Prepare project inquiry'}).click();
    await expect(dialog.getByRole('checkbox',{name:/by email/})).not.toBeChecked();
    await expect(dialog.getByRole('checkbox',{name:/on WhatsApp/})).not.toBeChecked();
  });
}

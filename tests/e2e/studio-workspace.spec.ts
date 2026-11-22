import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.setTimeout(120000);
for(const width of [390,1440]) {
  test(`account entry stays honest and accessible at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000});
    await page.goto('/login');
    await expect(page.getByRole('heading',{name:'Sign in',exact:true})).toBeVisible();
    await expect(page.getByText('No account or password needed.',{exact:false})).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>v.id)).toEqual([]);
    await page.screenshot({path:`docs/images/studio-account-${width}.png`,fullPage:true,style:'nextjs-portal { display: none }'});
    await page.getByRole('link',{name:'View the client experience',exact:true}).click();
    await expect(page).toHaveURL(/\/demo\/portal$/);
  });
  test(`studio workspace and client routes remain usable at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000});
    await page.goto('/demo');
    await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
    await page.screenshot({path:`docs/images/studio-workspace-${width}.png`,fullPage:true,style:'nextjs-portal { display: none }'});
    if(width===390){
      const trigger=page.getByRole('button',{name:'Open navigation',exact:true});
      await trigger.click();
      const menu=page.getByRole('dialog',{name:'Workspace navigation',exact:true});
      await expect(menu.getByRole('link',{name:'Lead pipeline',exact:true})).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(menu).not.toBeVisible();
      await expect(trigger).toBeFocused();
    }
    await page.goto('/demo/leads');
    const search=page.getByRole('textbox',{name:'Search leads',exact:true});
    await search.fill('Maya');
    await expect(page.getByRole('link',{name:'Maya Chen',exact:true})).toBeVisible();
    await search.fill('no-such-fixture-7729');
    await expect(page.getByRole('heading',{name:'No matching leads',exact:true})).toBeVisible();
    await search.fill('');
    await page.getByRole('link',{name:'Maya Chen',exact:true}).click();
    await expect(page).toHaveURL(/\/demo\/leads\/1$/);
    await page.goto('/demo/portal');
    await expect(page.getByRole('heading',{name:'Client workspace',exact:true})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Your projects',exact:true})).toBeVisible();
    await expect(page.getByText('Northline',{exact:false})).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
    await page.screenshot({path:`docs/images/studio-portal-${width}.png`,fullPage:true,style:'nextjs-portal { display: none }'});
    await page.getByRole('link',{name:'View project',exact:true}).click();
    await expect(page).toHaveURL(/\/demo\/portal\/projects\/1$/);
  });
}

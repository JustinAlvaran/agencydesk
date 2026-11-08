import {test,expect} from '@playwright/test';
// A slow phone should paint content before downloading/initializing offscreen WebGL.
test('mobile world waits for its visible controls, then renders and remains interactive',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/');await page.waitForLoadState('networkidle');
 await expect(page.getByRole('heading',{level:1})).toBeVisible();
 await expect(page.getByText('THE AGENCY WORLD',{exact:true})).not.toBeInViewport();
 const world=page.locator('[data-agency-world]');await expect(world.locator('canvas')).toHaveCount(0);
 await page.getByText('THE AGENCY WORLD',{exact:true}).scrollIntoViewIfNeeded();
 await expect(world).toHaveAttribute('data-rendered','true',{timeout:30000});
 await page.getByRole('button',{name:'Pause world',exact:true}).click();
 await page.getByRole('button',{name:'Open the layers',exact:true}).click();
 await expect(page.getByRole('button',{name:'Close the layers',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('link',{name:'Discuss your project',exact:true}).click();await expect(page).toHaveURL(/\/inquire$/);await expect(page.locator('canvas')).toHaveCount(0);
});
test('world startup is reachable on a very short desktop viewport',async({page})=>{
 await page.setViewportSize({width:1440,height:180});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
 await page.getByText('THE AGENCY WORLD',{exact:true}).scrollIntoViewIfNeeded();
 await expect(page.locator('[data-agency-world]')).toHaveAttribute('data-rendered','true',{timeout:30000});
 await page.getByRole('button',{name:'Pause world',exact:true}).click();await expect(page.getByRole('button',{name:'Resume world',exact:true})).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

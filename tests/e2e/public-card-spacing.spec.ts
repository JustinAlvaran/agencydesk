import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {resolve,dirname} from 'node:path';

for(const width of [390,1280,1440]){
 test(`public cards have readable gutters and complete content at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  const defects:string[]=[];const writes:string[]=[];
  page.on('request',request=>{if(!['GET','HEAD','OPTIONS'].includes(request.method()))writes.push(request.method());});
  for(const [path,name] of [['/services','services'],['/services/business-websites','scope'],['/case-studies','projects']]){
   await page.goto(path);
   const cards=page.locator('.public-service-list > div:has(article), .public-service-list > article, .public-project-list > article');
   expect(await cards.count()).toBeGreaterThan(0);
   const measured=await cards.evaluateAll(elements=>elements.map(element=>{const style=getComputedStyle(element),box=element.getBoundingClientRect(),heading=element.querySelector('h2')!.getBoundingClientRect();return {left:parseFloat(style.paddingLeft),right:parseFloat(style.paddingRight),top:parseFloat(style.paddingTop),bottom:parseFloat(style.paddingBottom),headingInset:heading.left-box.left,overflow:element.scrollWidth>element.clientWidth+1};}));
   const gutter=width<=650?20:24;
   for(const [index,item] of measured.entries())if(item.left<gutter||item.right<gutter||item.top<gutter||item.bottom<gutter||item.headingInset<gutter||item.overflow)defects.push(`${name}[${index}]: ${JSON.stringify(item)}`);
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))defects.push(`${name}: page overflow`);
   if(name!=='scope'&&width!==1280){const phase=process.env.CARD_LAYOUT_PHASE==='before'?'before':'after';await page.screenshot({path:resolve(dirname(test.info().file),'../../docs/images',`public-spacing-${phase}-${name}-${width}.png`),fullPage:true});}
   if(name==='services'){
    await expect(cards.first().getByRole('link',{name:'Explore business websites',exact:true})).toHaveAttribute('href','/services/business-websites');
    await expect(cards.first().getByRole('link',{name:'Discuss this service',exact:true})).toHaveAttribute('href','/inquire?service=business-websites');
   }
   if(name==='projects')await expect(page.getByText('Fictional scenarios showing how inquiries, proposals, and client projects move through the workspace.',{exact:true})).toBeVisible();
   if(process.env.CARD_LAYOUT_PHASE!=='before')expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(item=>item.id)).toEqual([]);
   if(await page.getByRole('button',{name:'Ask about services',exact:true}).evaluate(element=>getComputedStyle(element).position)==='fixed')defects.push(`${name}: guide trigger floats over content`);
  }
  expect(writes).toEqual([]);expect(defects).toEqual([]);
 });
}

test('catalog guide and inquiry links remain reachable in a short phone viewport',async({page})=>{
 await page.setViewportSize({width:390,height:400});await page.goto('/services');
 const trigger=page.getByRole('button',{name:'Ask about services',exact:true});await trigger.click();
 const dialog=page.getByRole('dialog',{name:'AgencyDesk services guide'});await expect(dialog).toBeVisible();
 await page.getByRole('button',{name:'Close services guide'}).click();await expect(trigger).toBeFocused();
 await page.getByRole('link',{name:'Explore business websites',exact:true}).click();await expect(page).toHaveURL(/\/services\/business-websites$/);
 await page.getByRole('link',{name:'Start a project inquiry',exact:true}).click();await expect(page).toHaveURL(/\/inquire\?service=business-websites$/);
 await expect(page.locator('form')).toBeVisible();
});

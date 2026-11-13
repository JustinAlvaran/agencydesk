import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [390, 1440]) {
  test(`A2UI lead review stays local and accessible at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height: 960});
    const mutations: string[] = [];
    const providers: string[] = [];
    const errors: string[] = [];
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) mutations.push(request.method());
      if (/supabase|generativelanguage|api\.openai|api\.anthropic/.test(request.url())) providers.push(new URL(request.url()).hostname);
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/demo/ai');
    await expect(page.getByRole('heading', {level: 1, name: 'A clearer way to review leads.'})).toBeVisible();
    await expect(page.getByText('Prebuilt demo responses. No AI model is connected.', {exact: true})).toBeVisible();
    const surface = page.getByRole('region', {name: 'Lead review response'});
    await expect(surface.getByRole('article')).toHaveCount(4);
    await expect(surface.getByRole('heading', {name: 'Your open pipeline', exact: true})).toBeVisible();
    await surface.getByRole('button', {name: 'Inspect Maya Chen'}).click();
    const detail = page.getByRole('region', {name: 'Maya Chen details'});
    await expect(detail).toBeVisible();
    await expect(detail.getByRole('heading', {name: 'Suggested next step'})).toBeVisible();
    await expect(detail).toBeFocused();
    const proposalPrompt = page.getByRole('button', {name: 'Review proposal follow-ups', exact: true});
    await proposalPrompt.focus();
    await page.keyboard.press('Enter');
    await expect(surface.getByRole('article')).toHaveCount(1);
    await expect(surface.getByRole('heading', {name: 'Theo Rivera', exact: true})).toBeVisible();
    await expect(page.getByRole('region', {name: 'Maya Chen details'})).toHaveCount(0);
    await page.getByRole('button', {name: 'Explore closed leads', exact: true}).click();
    await expect(surface.getByRole('article')).toHaveCount(2);
    await page.getByRole('button', {name: 'Reset demo', exact: true}).focus();
    await page.keyboard.press('Space');
    await expect(surface.getByRole('article')).toHaveCount(4);
    await expect(page.getByRole('button', {name: 'Show open leads', exact: true})).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(violation => violation.id)).toEqual([]);
    await page.screenshot({path: `docs/images/a2ui-lead-review-${width}.png`, fullPage: true});
    if (width === 390) await page.getByRole('button', {name: 'Open navigation'}).click();
    await expect(page.getByRole('link', {name: 'AI workspace', exact: true}).filter({visible: true})).toHaveAttribute('aria-current', 'page');
    expect(mutations).toEqual([]);
    expect(providers).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('pilot is discoverable from the demo workspace', async ({page}) => {
  await page.goto('/demo');
  await page.getByRole('link', {name: 'AI workspace', exact: true}).click();
  await expect(page).toHaveURL('/demo/ai');
  await expect(page.getByRole('heading', {name: 'Your open pipeline', exact: true})).toBeVisible();
});

test('a renderer failure shows a recoverable error without exposing diagnostics', async ({page}) => {
  await page.addInitScript(() => {
    const get = Map.prototype.get;
    let failing = true;
    document.addEventListener('click', event => {
      if (event.target instanceof Element && event.target.closest('button')?.textContent?.includes('Reset demo')) failing = false;
    }, true);
    Map.prototype.get = function(key) {
      const value = get.call(this, key);
      if (failing && key === 'lead-review' && value?.id === 'lead-review') {
        throw new Error('Injected SDK surface failure');
      }
      return value;
    };
  });
  await page.goto('/demo/ai');
  const alert = page.getByRole('alert').filter({hasText: 'The sample view could not load.'});
  await expect(alert).toBeVisible();
  await expect(page.getByText('Injected SDK surface failure', {exact: true})).toHaveCount(0);
  await alert.getByRole('button', {name: 'Reset demo'}).click();
  await expect(page.getByRole('region', {name: 'Lead review response'}).getByRole('article')).toHaveCount(4);
});

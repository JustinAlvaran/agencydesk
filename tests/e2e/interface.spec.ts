import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicPaths = ['/', '/services', '/case-studies', '/demo', '/demo/leads', '/demo/proposals', '/demo/projects', '/demo/tasks', '/demo/contacts', '/demo/portal', '/demo/leads/1', '/demo/proposals/2', '/demo/projects/1', '/demo/portal/projects/1', '/demo/portal/proposals/2', '/inquire'];
for (const width of [1440, 390]) {
  test(`public screens are accessible and fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of publicPaths) {
      await page.goto(path);
      await expect(page.locator('h1').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${path} overflows at ${width}px`).toBeTruthy();
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })), `${path} accessibility`).toEqual([]);
    }
  });
}

test('anonymous visitors cannot enter the CRM', async ({ page }) => {
  await page.goto('/crm');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel('Email')).toBeVisible();
});

test('demo navigation, search and client isolation are read-only', async ({ page }) => {
  const mutations: string[] = [];
  page.on('request', request => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) mutations.push(request.url()); });
  await page.goto('/demo');
  await page.getByRole('link', { name: 'Lead pipeline', exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/leads/);
  await page.getByRole('textbox', { name: 'Search leads' }).fill('Maya');
  await expect(page.getByRole('heading', { name: 'Maya Chen' })).toBeVisible();
  await expect(page.getByText('Theo Rivera', { exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search leads' }).fill('no-such-person');
  await expect(page.getByRole('heading', { name: 'No matching leads' })).toBeVisible();
  await page.getByRole('link', { name: 'Contacts', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search contacts' }).fill('Maya');
  await expect(page.getByText('Maya Chen', { exact: true })).toBeVisible();
  await expect(page.getByText('Theo Rivera', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'See client experience' }).click();
  await expect(page).toHaveURL(/\/demo\/portal/);
  await expect(page.getByRole('heading', { name: 'Client workspace' })).toBeVisible();
  await page.getByRole('link', { name: 'Forma — digital launch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Milestones', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Forma digital launch', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Scope', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to client workspace' }).click();
  const otherClient = await page.request.get('/demo/portal/projects/2');
  // Next.js may stream a not-found page with HTTP 200; verify no record is exposed.
  expect(await otherClient.text()).not.toContain('Northline — operations portal');
  await page.goto('/demo/portal/projects/2');
  await expect(page.getByRole('heading', { name: 'This page isn’t here.' })).toBeVisible();
  await page.goto('/demo/portal');
  await expect(page.getByText('Northline — operations portal', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /accept|publish|create|save/i })).toHaveCount(0);
  expect(mutations).toEqual([]);
  await page.screenshot({ path: 'artifacts/client-portal.png', fullPage: true });
});

test('mobile navigation supports keyboard focus, Escape and route selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  const trigger = page.getByRole('button', { name: 'Open navigation' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const menuAccessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(menuAccessibility.violations.map(v => v.id)).toEqual([]);
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL(/\/demo\/projects/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
});


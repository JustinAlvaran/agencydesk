import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [390, 1280]) {
  test(`services guide respects catalog, contact consent and keyboard focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/services');
    const trigger = page.getByRole('button', { name: 'Ask about services' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'AgencyDesk services guide' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Explore services', exact: true }).click();
    await dialog.getByRole('button', { name: 'CRM and automation setup', exact: true }).click();
    await expect(dialog.getByText('Connect lead intake, follow-up tasks, and reviewed email or WhatsApp workflows around your agency’s process.', { exact: false })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Read service details' })).toHaveAttribute('href', '/services/crm-automation');
    await dialog.getByRole('button', { name: 'Prepare project inquiry' }).click();
    await expect(dialog.getByLabel('Service', { exact: true })).toHaveValue('CRM and automation setup');
    await expect(dialog.getByRole('checkbox', { name: /by email/ })).not.toBeChecked();
    await expect(dialog.getByRole('checkbox', { name: /on WhatsApp/ })).not.toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.map(item => item.id)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

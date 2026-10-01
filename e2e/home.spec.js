import { test, expect } from '@playwright/test';

test('NIRDHOOM production shell renders and primary surfaces navigate', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('NIRDHOOM').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Overview', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ops Map', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Field PWA', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Verification', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Ops Map', exact: true }).click();
  await expect(page.getByText(/operations|dispatch|ops/i).first()).toBeVisible();

  await page.getByRole('button', { name: 'Field PWA', exact: true }).click();
  await expect(page.getByText(/operator|field/i).first()).toBeVisible();

  await page.getByRole('button', { name: 'Verification', exact: true }).click();
  await expect(page.getByText(/verification|satellite/i).first()).toBeVisible();
});

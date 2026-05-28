import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TRUP/);
  await expect(page.locator('nav')).toBeVisible();
});

test('events page loads', async ({ page }) => {
  await page.goto('/wydarzenia');
  await expect(page.locator('h1, h2').first()).toBeVisible();
});

test('404 page shows not found', async ({ page }) => {
  await page.goto('/nieistniejaca-strona');
  await expect(page.locator('text=404')).toBeVisible();
});

test('navigation links work', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/wydarzenia"]');
  await expect(page).toHaveURL('/wydarzenia');
});

test('calendar page loads', async ({ page }) => {
  await page.goto('/kalendarz');
  await expect(page.locator('h1, h2').first()).toBeVisible();
});

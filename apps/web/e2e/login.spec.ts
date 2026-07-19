import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should show register page', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test('should redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/auth\/login/);
  });
});

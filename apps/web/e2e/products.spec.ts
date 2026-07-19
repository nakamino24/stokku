import { test, expect } from '@playwright/test';
import { generateTestUser, registerUserViaApi, loginViaUi } from './helpers';

let user: ReturnType<typeof generateTestUser>;

test.beforeEach(async ({ page }) => {
  user = generateTestUser();
  await registerUserViaApi(user);
  await loginViaUi(page, user.email, user.password);
});

test.describe('Products', () => {
  test('should show empty state when no products exist', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('text=No products yet')).toBeVisible();
    await expect(page.locator('text=Create your first product')).toBeVisible();
  });

  test('should create a product via the modal', async ({ page }) => {
    await page.goto('/products');
    await page.click('button:has-text("New Product")');

    await expect(page.locator('h2')).toHaveText('Create Product');

    await page.fill('input[name="name"]', 'E2E Test Product');
    await page.fill('input[name="sku"]', 'E2E-SKU-001');
    await page.fill('input[name="unitPrice"]', '29.99');
    await page.fill('input[name="minStock"]', '10');
    await page.click('button:has-text("Create Product")');

    await expect(page.locator('text=E2E Test Product')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=E2E-SKU-001')).toBeVisible();
    await expect(page.locator('text=29.99')).toBeVisible();
  });

  test('should show validation error for product without name', async ({ page }) => {
    await page.goto('/products');
    await page.click('button:has-text("New Product")');
    await page.click('button:has-text("Create Product")');

    await expect(page.locator('text=Name is required')).toBeVisible();
  });

  test('should deactivate a product', async ({ page }) => {
    await page.goto('/products');

    await page.click('button:has-text("New Product")');
    await page.fill('input[name="name"]', 'Product to Delete');
    await page.fill('input[name="sku"]', 'DEL-SKU');
    await page.click('button:has-text("Create Product")');
    await expect(page.locator('text=Product to Delete')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Deactivate")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to deactivate this product?')).toBeVisible();
    await page.click('button:has-text("Deactivate")');

    await expect(page.locator('text=Product to Delete')).not.toBeVisible();
  });

  test('should cancel deactivation', async ({ page }) => {
    await page.goto('/products');

    await page.click('button:has-text("New Product")');
    await page.fill('input[name="name"]', 'Keep Me');
    await page.click('button:has-text("Create Product")');
    await expect(page.locator('text=Keep Me')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Deactivate")');
    await page.click('button:has-text("Cancel")');

    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=Keep Me')).toBeVisible();
  });

  test('should search products by name', async ({ page }) => {
    await page.goto('/products');

    await page.click('button:has-text("New Product")');
    await page.fill('input[name="name"]', 'Apple iPhone');
    await page.click('button:has-text("Create Product")');
    await expect(page.locator('text=Apple iPhone')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("New Product")');
    await page.fill('input[name="name"]', 'Samsung Galaxy');
    await page.click('button:has-text("Create Product")');
    await expect(page.locator('text=Samsung Galaxy')).toBeVisible({ timeout: 10000 });

    await page.fill('input[placeholder="Search by name or SKU..."]', 'Apple');
    await expect(page.locator('text=Apple iPhone')).toBeVisible();
    await expect(page.locator('text=Samsung Galaxy')).not.toBeVisible();
  });
});

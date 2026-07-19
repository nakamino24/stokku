import { test, expect } from '@playwright/test';
import { generateTestUser, registerUserViaApi, loginViaUi } from './helpers';

let user: ReturnType<typeof generateTestUser>;

test.beforeEach(async ({ page }) => {
  user = generateTestUser();
  await registerUserViaApi(user);
  await loginViaUi(page, user.email, user.password);
});

test.describe('Navigation', () => {
  test('should show sidebar with all sections', async ({ page }) => {
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Inventory')).toBeVisible();
    await expect(page.locator('text=Purchasing')).toBeVisible();
    await expect(page.locator('text=Sales')).toBeVisible();
    await expect(page.locator('text=Reports')).toBeVisible();
    await expect(page.locator('text=Administration')).toBeVisible();
  });

  test('should render dashboard with stat cards', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Dashboard');
    await expect(page.locator('text=Overview of your inventory operations')).toBeVisible();

    await expect(page.locator('a[href="/products"]')).toBeVisible();
    await expect(page.locator('a[href="/suppliers"]')).toBeVisible();
    await expect(page.locator('a[href="/customers"]')).toBeVisible();
    await expect(page.locator('a[href="/warehouses"]')).toBeVisible();
    await expect(page.locator('a[href="/purchase-orders"]')).toBeVisible();
    await expect(page.locator('a[href="/sales-orders"]')).toBeVisible();
  });

  test.describe('All pages render correctly', () => {
    const pages = [
      { path: '/products', title: 'Products' },
      { path: '/categories', title: 'Categories' },
      { path: '/stock', title: 'Stock Levels' },
      { path: '/warehouses', title: 'Warehouses' },
      { path: '/purchase-orders', title: 'Purchase Orders' },
      { path: '/sales-orders', title: 'Sales Orders' },
      { path: '/suppliers', title: 'Suppliers' },
      { path: '/customers', title: 'Customers' },
      { path: '/users', title: 'Users' },
      { path: '/reports', title: 'Reports' },
      { path: '/settings', title: 'Settings' },
    ];

    for (const { path, title } of pages) {
      test(`should render ${path} with correct title`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('h1')).toHaveText(title);
      });
    }
  });

  test('sidebar navigation should navigate between pages', async ({ page }) => {
    await page.locator('a[href="/products"]').click();
    await page.waitForURL('/products');
    await expect(page.locator('h1')).toHaveText('Products');

    await page.locator('a[href="/warehouses"]').click();
    await page.waitForURL('/warehouses');
    await expect(page.locator('h1')).toHaveText('Warehouses');

    await page.locator('a[href="/purchase-orders"]').click();
    await page.waitForURL('/purchase-orders');
    await expect(page.locator('h1')).toHaveText('Purchase Orders');

    await page.locator('a[href="/products"]').click();
    await page.waitForURL('/products');
  });

  test('should render empty states on all data pages', async ({ page }) => {
    const emptyPageTexts = [
      { path: '/products', text: 'No products yet' },
      { path: '/categories', text: 'No categories yet' },
      { path: '/stock', text: 'No stock levels found' },
      { path: '/warehouses', text: 'No warehouses yet' },
      { path: '/purchase-orders', text: 'No purchase orders yet' },
      { path: '/sales-orders', text: 'No sales orders yet' },
      { path: '/suppliers', text: 'No suppliers yet' },
      { path: '/customers', text: 'No customers yet' },
    ];

    for (const { path, text } of emptyPageTexts) {
      await page.goto(path);
      await expect(page.locator(`text=${text}`)).toBeVisible();
    }
  });

  test('should show user avatar in header', async ({ page }) => {
    const avatar = page.locator('text=E').first();
    await expect(avatar).toBeVisible();
  });
});

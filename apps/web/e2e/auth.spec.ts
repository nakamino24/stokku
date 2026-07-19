import { test, expect } from '@playwright/test';
import { generateTestUser, registerUserViaApi, loginViaUi } from './helpers';

test.describe('Authentication', () => {
  test.describe('Registration', () => {
    test('should register a new user and redirect to dashboard', async ({ page }) => {
      const user = generateTestUser();

      await page.goto('/auth/register');
      await expect(page.locator('h1')).toHaveText('Create your account');

      await page.fill('#name', user.name);
      await page.fill('#email-address', user.email);
      await page.fill('#organization', user.organizationSlug);
      await page.fill('#password', user.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('/', { timeout: 15000 });
      await expect(page.locator('h1')).toHaveText('Dashboard');
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/auth/register');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Enter a valid email address')).toBeVisible();
      await expect(page.locator('text=Organization name is required')).toBeVisible();
      await expect(page.locator('text=Must be at least 8 characters')).toBeVisible();
    });

    test('should show duplicate email error', async ({ page }) => {
      const user = generateTestUser();
      await registerUserViaApi(user);

      await page.goto('/auth/register');
      await page.fill('#name', user.name);
      await page.fill('#email-address', user.email);
      await page.fill('#organization', user.organizationSlug);
      await page.fill('#password', user.password);
      await page.click('button[type="submit"]');

      await expect(page.locator('text=already in use')).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
      const user = generateTestUser();
      await registerUserViaApi(user);

      await loginViaUi(page, user.email, user.password);
      await expect(page.locator('h1')).toHaveText('Dashboard');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('#email-address', 'nonexistent@test.com');
      await page.fill('#password', 'WrongPass1');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid email or password')).toBeVisible();
    });

    test('should show validation errors on login form', async ({ page }) => {
      await page.goto('/auth/login');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Enter a valid email address')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user to login', async ({ page }) => {
      await page.goto('/products');
      await page.waitForURL('/auth/login', { timeout: 10000 });
    });

    test('should allow authenticated user to access protected pages', async ({ page }) => {
      const user = generateTestUser();
      await registerUserViaApi(user);
      await loginViaUi(page, user.email, user.password);

      await page.goto('/products');
      await expect(page.locator('h1')).toHaveText('Products');

      await page.goto('/categories');
      await expect(page.locator('h1')).toHaveText('Categories');
    });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to login page', async ({ page }) => {
      const user = generateTestUser();
      await registerUserViaApi(user);
      await loginViaUi(page, user.email, user.password);

      await page.click('button:has-text("Logout")');
      await page.waitForURL('/auth/login', { timeout: 10000 });
    });
  });

  test.describe('Navigation Links', () => {
    test('should have link to register from login page', async ({ page }) => {
      await page.goto('/auth/login');
      await expect(page.locator('a[href="/auth/register"]')).toBeVisible();
    });

    test('should have link to login from register page', async ({ page }) => {
      await page.goto('/auth/register');
      await expect(page.locator('a[href="/auth/login"]')).toBeVisible();
    });
  });
});

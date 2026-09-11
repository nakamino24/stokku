import { Page, request } from '@playwright/test';

const API_ORIGIN = process.env.API_ORIGIN || 'http://127.0.0.1:3001';
const API_URL = `${API_ORIGIN}/api/v1`;

export interface TestUser {
  email: string;
  password: string;
  name: string;
  organizationName: string;
  organizationSlug: string;
}

export function generateTestUser(): TestUser {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    email: `e2e-${id}@test.com`,
    password: 'TestPass1',
    name: 'E2E Tester',
    organizationName: `E2E Org ${id}`,
    organizationSlug: `e2e-org-${id}`,
  };
}

export async function registerUserViaApi(user: TestUser) {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API_URL}/auth/register`, {
    data: {
      email: user.email,
      password: user.password,
      name: user.name,
      organizationName: user.organizationName,
    },
  });
  return { response: res, context: ctx };
}

export async function loginAsDemoUser(page: Page) {
  await loginViaUi(page, 'demo@stokku.app', 'password123');
}

export async function createSupplierViaUi(page: Page, name: string) {
  await page.goto('/suppliers');
  await page.getByRole('button', { name: 'New Supplier' }).click();
  await page.getByRole('heading', { name: 'New Supplier' }).waitFor();
  await page.locator('form input').nth(0).fill(name);
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByText(name).waitFor();
}

export async function createCustomerViaUi(page: Page, name: string) {
  await page.goto('/customers');
  await page.getByRole('button', { name: 'New Customer' }).click();
  await page.getByRole('heading', { name: 'New Customer' }).waitFor();
  await page.locator('form input').nth(0).fill(name);
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByText(name).waitFor();
}

export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.waitForSelector('#email-address');
  await page.fill('#email-address', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 15000 });
}

export async function getAccessToken(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  });
}

export async function cleanupUser(context: any, userId: string) {
  try {
    await context.delete(`${API_URL}/users/${userId}`);
  } catch {
  }
}

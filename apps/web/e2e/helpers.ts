import { Page, request } from '@playwright/test';

const API_URL = process.env.PLAYWRITH_API_URL || 'http://localhost:4000/api/v1';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  organizationSlug: string;
}

export function generateTestUser(): TestUser {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return {
    email: `e2e-${id}@test.com`,
    password: 'TestPass1',
    name: 'E2E Tester',
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
      organization: user.organizationSlug,
    },
  });
  return { response: res, context: ctx };
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

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const API_ORIGIN = process.env.API_ORIGIN || 'http://127.0.0.1:3001';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @stokku/api dev',
      url: `${API_ORIGIN}/health`,
      env: {
        API_ORIGIN,
        PORT: '3001',
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://stokku:stokku@127.0.0.1:5432/stokku-test',
        DIRECT_URL: process.env.DIRECT_URL || 'postgresql://stokku:stokku@127.0.0.1:5432/stokku-test',
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'local-playwright-access-token-secret-at-least-32-characters',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'pnpm --filter @stokku/web dev -- --hostname 127.0.0.1 --port 3000',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        API_ORIGIN,
      },
    },
  ],
});

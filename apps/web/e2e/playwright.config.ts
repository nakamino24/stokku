import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3002',
    headless: true,
  },
  webServer: {
    command: 'pnpm dev --port 3002',
    port: 3002,
    cwd: '../..',
    reuseExistingServer: true,
  },
});

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
    navigationTimeout: 15 * 1000,
    actionTimeout: 8 * 1000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: [['list']],
});

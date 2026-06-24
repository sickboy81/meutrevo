import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'set PORT=3001&& npm run dev',
    port: 3001,
    reuseExistingServer: false,
    timeout: 120000,
  },
};

export default config;

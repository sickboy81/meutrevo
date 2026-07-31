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
    command:
      'cross-env PIXGO_API_KEY=pk_placeholder_e2e PIXGO_WEBHOOK_SECRET=whsec_placeholder_e2e PORT=3001 npm run start',
    port: 3001,
    reuseExistingServer: false,
    timeout: 120000,
  },
};

export default config;

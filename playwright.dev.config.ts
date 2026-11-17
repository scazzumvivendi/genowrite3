import { defineConfig } from '@playwright/test';
import configuration from './playwright.config.ts';

export default defineConfig({
  ...configuration,
  testMatch: 'development.spec.ts',
  use: { ...configuration.use, baseURL: 'http://127.0.0.1:5175' },
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: false,
  },
});

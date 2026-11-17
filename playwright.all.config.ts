import { defineConfig } from '@playwright/test';
import configuration from './playwright.config.ts';

export default defineConfig({
  ...configuration,
  projects: [
    ...(configuration.projects ?? []),
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});

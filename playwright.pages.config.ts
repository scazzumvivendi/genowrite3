import { defineConfig } from '@playwright/test';
import configuration from './playwright.all.config.ts';

const base = `${process.env.PAGES_BASE_PATH ?? '/genowrite3'}/`.replace(
  /\/+$/u,
  '/',
);
if (!/^\/[\w/.-]*$/u.test(base) || base.includes('..')) {
  throw new Error('PAGES_BASE_PATH deve essere un percorso locale assoluto.');
}

export default defineConfig({
  ...configuration,
  testMatch: 'pages.spec.ts',
  testIgnore: [],
  use: { ...configuration.use, baseURL: `http://127.0.0.1:4174${base}` },
  webServer: {
    command: `npm run preview -- --outDir dist-pages --base=${base} --port 4174 --strictPort`,
    url: `http://127.0.0.1:4174${base}`,
    reuseExistingServer: false,
  },
});

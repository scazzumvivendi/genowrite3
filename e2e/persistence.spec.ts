import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

test('chiusura e riapertura del browser con profilo persistente, completamente offline', async ({
  playwright,
  browserName,
}) => {
  const profile = await mkdtemp(join(tmpdir(), 'genowrite-browser-'));
  const options = {
    headless: true,
    baseURL: 'http://127.0.0.1:4173',
    ...(browserName === 'chromium' &&
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  };
  let context = await playwright[browserName].launchPersistentContext(
    profile,
    options,
  );
  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await startManuscript(page);
    await page
      .getByRole('textbox', { name: 'Testo · Capitolo' })
      .fill('Conservato dopo la chiusura del browser.');
    await expect(page.getByRole('status')).toHaveText(
      'Salvato sul dispositivo',
    );
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await context.close();
    context = await playwright[browserName].launchPersistentContext(
      profile,
      options,
    );
    await context.setOffline(true);
    const reopened = context.pages()[0] ?? (await context.newPage());
    await reopened.goto('/');
    await expect(
      reopened.getByRole('textbox', { name: 'Testo · Capitolo' }),
    ).toHaveText('Conservato dopo la chiusura del browser.');
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

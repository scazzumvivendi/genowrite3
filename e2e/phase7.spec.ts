import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { performanceFixture } from '../src/test/performance-fixture';
import { startManuscript } from './helpers';

for (const chapters of [40, 1]) {
  test(`profiling 100k parole, ${chapters} documenti, editor e DOCX`, async ({
    page,
  }, testInfo) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Ripristina backup', exact: true })
      .click();
    const restore = page.getByRole('main', {
      name: 'Ripristina backup JSON',
    });
    const input = Buffer.from(
      JSON.stringify(performanceFixture(100_000, chapters)),
    );
    const started = performance.now();
    await restore.getByLabel('File di backup').setInputFiles({
      name: 'large.json',
      mimeType: 'application/json',
      buffer: input,
    });
    await restore
      .getByRole('button', { name: 'Ripristina come nuovo progetto' })
      .click();
    await page.getByRole('button', { name: 'Capitolo 1', exact: true }).click();
    const editor = page.getByRole('textbox', { name: 'Testo · Capitolo 1' });
    await expect(editor).toBeVisible();
    const openMs = performance.now() - started;
    await expect(
      page.getByRole('region', { name: 'Statistiche intero progetto' }),
    ).toContainText('100.000 parole');
    const handle = await editor.elementHandle();
    await editor.click();
    await page.keyboard.press('ControlOrMeta+End');
    const typingStarted = performance.now();
    await page.keyboard.type(' finale');
    const typingMs = performance.now() - typingStarted;
    await expect(
      page.getByRole('region', { name: 'Statistiche intero progetto' }),
    ).toContainText('100.001 parole');
    expect(await handle?.evaluate((node) => node.isConnected)).toBe(true);
    await page.getByRole('button', { name: 'Esporta', exact: true }).click();
    await page.evaluate(() => {
      const metrics = { last: performance.now(), maxPauseMs: 0 };
      (window as unknown as { exportMetrics: typeof metrics }).exportMetrics =
        metrics;
      const timer = window.setInterval(() => {
        const now = performance.now();
        metrics.maxPauseMs = Math.max(metrics.maxPauseMs, now - metrics.last);
        metrics.last = now;
      }, 16);
      (window as unknown as { exportTimer: number }).exportTimer = timer;
    });
    const download = page.waitForEvent('download');
    const exporting = performance.now();
    await page.getByRole('button', { name: 'Scarica file' }).click();
    await download;
    const exportMs = performance.now() - exporting;
    const maxPauseMs = await page.evaluate(() => {
      const state = window as unknown as {
        exportMetrics: { maxPauseMs: number };
        exportTimer: number;
      };
      clearInterval(state.exportTimer);
      return state.exportMetrics.maxPauseMs;
    });
    const results = {
      chapters,
      words: 100_000,
      openMs,
      typingMs,
      exportMs,
      maxPauseMs,
      browser: await page.context().browser()?.version(),
    };
    console.log(JSON.stringify(results));
    await testInfo.attach('performance.json', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });
  });
}

test('aggiornamento PWA esplicito salva gli ultimi caratteri prima del reload', async ({
  page,
}) => {
  await startManuscript(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js?test-update=1');
  });
  await expect(
    page.getByRole('button', { name: 'Salva e aggiorna' }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Testo · Capitolo' })
    .fill('Ultimo carattere prima dell’aggiornamento.');
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Salva e aggiorna' }).click();
  await reloaded;
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toHaveText('Ultimo carattere prima dell’aggiornamento.');
  await expect(page.getByRole('status')).toHaveText('Salvato sul dispositivo');
});

test('manifest e icone PWA validi nel browser Chromium', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Controllo CDP specifico Chromium.');
  await page.goto('/');
  const session = await context.newCDPSession(page);
  const manifest = await session.send('Page.getAppManifest');
  expect(manifest.errors).toEqual([]);
  const data = JSON.parse(manifest.data!);
  expect(data.display).toBe('standalone');
  expect(
    data.icons.some((icon: { sizes: string }) => icon.sizes === '192x192'),
  ).toBe(true);
  expect(
    data.icons.some((icon: { sizes: string }) => icon.sizes === '512x512'),
  ).toBe(true);
});

test('errore quota: nessuna navigazione distruttiva, copia di emergenza e ritentativo', async ({
  page,
}) => {
  await startManuscript(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (
        this.name === 'documents' &&
        sessionStorage.getItem('test-quota') === '1'
      ) {
        throw new DOMException('Quota simulata', 'QuotaExceededError');
      }
      return key === undefined
        ? original.call(this, value)
        : original.call(this, value, key);
    };
    sessionStorage.setItem('test-quota', '1');
  });
  await page
    .getByRole('textbox', { name: 'Testo · Capitolo' })
    .fill('Testo non ancora scritto su disco.');
  await expect(page.getByRole('status')).toHaveText('Errore di salvataggio');
  await page.getByRole('button', { name: 'Progetti', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveText(
    'Testo non ancora scritto su disco.',
  );
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Scarica copia di emergenza' })
    .click();
  const recovery = await download;
  expect(recovery.suggestedFilename()).toContain('emergenza');
  expect(await readFile((await recovery.path())!, 'utf8')).toContain(
    'Testo non ancora scritto su disco.',
  );
  await page.evaluate(() => sessionStorage.removeItem('test-quota'));
  await page.getByRole('button', { name: 'Riprova salvataggio' }).click();
  await expect(page.getByRole('status')).toHaveText('Salvato sul dispositivo');
  await page.reload();
  await expect(page.getByRole('textbox')).toHaveText(
    'Testo non ancora scritto su disco.',
  );
});

test('CRUD progetto: proprietà, cestino e ripristino mantengono il manoscritto', async ({
  page,
}) => {
  await startManuscript(page);
  await page
    .getByRole('textbox', { name: 'Testo · Capitolo' })
    .fill('Contenuto conservato.');
  await page.getByRole('button', { name: /Proprietà progetto/ }).click();
  const properties = page.getByRole('dialog', { name: 'Proprietà progetto' });
  await properties
    .getByLabel('Titolo', { exact: true })
    .fill('Titolo rinominato');
  await properties.getByLabel('Autore', { exact: true }).fill('Autrice');
  await properties.getByRole('button', { name: 'Salva progetto' }).click();
  await expect(properties).not.toBeVisible();
  await page.getByRole('button', { name: /Proprietà progetto/ }).click();
  page.once('dialog', (dialog) => void dialog.accept());
  await properties
    .getByRole('button', { name: 'Sposta progetto nel cestino' })
    .click();
  await page
    .getByRole('button', { name: 'Cestino progetti', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Ripristina Titolo rinominato' })
    .click();
  await page
    .getByRole('button', { name: 'Mostra progetti', exact: true })
    .click();
  await page.getByRole('button', { name: 'Apri Titolo rinominato' }).click();
  await page.getByRole('button', { name: 'Capitolo', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveText('Contenuto conservato.');
});

test('schede concorrenti: selezione indipendente e conflitti senza sovrascrittura', async ({
  page,
  context,
}) => {
  await startManuscript(page);
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto('/');
  await expect(
    other.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toBeVisible();
  await other.getByRole('textbox').fill('Versione della seconda scheda.');
  await expect(other.getByRole('status')).toHaveText('Salvato sul dispositivo');
  await page.getByRole('textbox').fill('Modifica concorrente della prima.');
  await expect(page.getByRole('status')).toHaveText('Errore di salvataggio');
  await expect(page.getByRole('alert')).toContainText('altra scheda');
  await expect(page.getByRole('textbox')).toHaveText(
    'Modifica concorrente della prima.',
  );
  await other.getByRole('button', { name: 'Progetti', exact: true }).click();
  await other.getByLabel('Titolo del nuovo progetto').fill('Altro progetto');
  await other
    .getByRole('button', { name: 'Crea progetto', exact: true })
    .click();
  await expect(
    other.getByRole('button', { name: /Proprietà progetto/ }),
  ).toHaveText('Altro progetto');
  await expect(page.getByRole('textbox')).toHaveText(
    'Modifica concorrente della prima.',
  );
  await other.close();
});

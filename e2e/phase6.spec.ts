import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

test('download DOCX/TXT e backup completo, ripristino come nuovo progetto', async ({
  page,
}, testInfo) => {
  await startManuscript(page);
  await page
    .getByRole('textbox', { name: 'Testo · Capitolo' })
    .fill('Il mare è blu.');
  await page.getByRole('button', { name: 'Esporta', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Esporta e crea backup' });
  const docxDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Scarica file' }).click();
  const docx = await docxDownload;
  expect(docx.suggestedFilename()).toBe('Prova.docx');
  await docx.saveAs(testInfo.outputPath('manuscript.docx'));
  await dialog
    .getByRole('combobox', { name: 'Formato', exact: true })
    .selectOption('txt');
  const txtDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Scarica file' }).click();
  const txt = await txtDownload;
  expect(await readFile((await txt.path())!, 'utf8')).toContain(
    'Il mare è blu.',
  );
  await dialog
    .getByRole('combobox', { name: 'Formato', exact: true })
    .selectOption('json');
  const backupDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Scarica file' }).click();
  const backup = await backupDownload;
  const file = await readFile((await backup.path())!);
  await dialog.getByRole('button', { name: 'Chiudi finestra' }).click();
  await page.getByRole('button', { name: 'Progetti', exact: true }).click();
  await page
    .getByRole('button', { name: 'Ripristina backup', exact: true })
    .click();
  const restore = page.getByRole('dialog', { name: 'Ripristina backup JSON' });
  await restore.getByLabel('File di backup').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: file,
  });
  await restore
    .getByRole('button', { name: 'Ripristina come nuovo progetto' })
    .click();
  await page.getByRole('button', { name: 'Capitolo', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toHaveText('Il mare è blu.');
});

test('PWA: riavvio completamente offline, testo locale e risorse DOCX precache', async ({
  page,
  context,
}) => {
  await startManuscript(page);
  await page
    .getByRole('textbox', { name: 'Testo · Capitolo' })
    .fill('Scritto senza rete.');
  await expect(page.getByRole('status')).toHaveText('Salvato sul dispositivo');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => resolve(),
          { once: true },
        ),
      );
    }
  });
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toHaveText('Scritto senza rete.');
  await page
    .getByRole('textbox', { name: 'Testo · Capitolo' })
    .fill('Aggiornato offline.');
  await expect(page.getByRole('status')).toHaveText('Salvato sul dispositivo');
  await page.getByRole('button', { name: 'Esporta', exact: true }).click();
  const file = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Scarica file' }).click();
  expect((await file).suggestedFilename()).toBe('Prova.docx');
});

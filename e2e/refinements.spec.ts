import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

test('barra compatta, preferenze persistenti e Zen con formattazione', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startManuscript(page);
  const toolbar = page.getByRole('group', { name: 'Formattazione testo' });
  await expect(
    toolbar.getByRole('button', { name: 'Trova e sostituisci' }),
  ).toBeVisible();
  await expect(
    toolbar.getByRole('button', { name: /Segnalazioni/ }),
  ).toBeVisible();
  await expect(
    page.locator('.editing-notice, .document-kind, .toolbar-caption'),
  ).toHaveCount(0);
  await expect(page.locator('.writing-statistics')).not.toContainText(
    /min|lettura/,
  );
  await page.getByRole('button', { name: 'Preferenze', exact: true }).click();
  await page.getByLabel('Interlinea', { exact: true }).fill('1');
  await page.getByLabel('Larghezza testo (px)').fill('1600');
  await page.getByRole('button', { name: 'Salva preferenze' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toHaveCSS('line-height', '19px');
  await page.reload();
  const editor = page.getByRole('textbox', { name: 'Testo · Capitolo' });
  await expect(editor).toHaveCSS('line-height', '19px');
  await expect(editor).toHaveCSS('border-top-width', '1px');
  await page.getByRole('button', { name: 'Modalità Zen' }).click();
  await expect(toolbar).toBeVisible();
  await expect(page.locator('.brand-context')).toBeHidden();
  await expect(
    page.getByRole('region', { name: 'Statistiche documento corrente' }),
  ).toBeVisible();
  await toolbar.getByRole('button', { name: 'Grassetto', exact: true }).click();
  await editor.fill('Testo zen');
  await page.screenshot({ path: 'test-results/refinements-zen.png' });
  await page.getByRole('button', { name: 'Modalità Zen' }).click();
  await expect(page.locator('.brand-context')).toBeVisible();
  expect(errors).toEqual([]);
});

test('installazione offerta soltanto nelle preferenze', async ({ page }) => {
  await startManuscript(page);
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        (window as unknown as { installCalled: boolean }).installCalled = true;
      },
    });
    window.dispatchEvent(event);
  });
  await expect(
    page.getByRole('button', { name: 'Installa Genowrite' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Preferenze', exact: true }).click();
  await page.getByRole('button', { name: 'Installa Genowrite' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { installCalled: boolean }).installCalled,
      ),
    )
    .toBe(true);
  await expect(
    page.getByRole('button', { name: 'Installa Genowrite' }),
  ).toHaveCount(0);
});

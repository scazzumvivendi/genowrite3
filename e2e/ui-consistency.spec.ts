import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

test('biblioteca e preferenze sono pagine e proteggono le modifiche', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startManuscript(page);
  await page.getByRole('button', { name: 'Personaggi', exact: true }).click();
  const library = page.getByRole('main', { name: 'Personaggi', exact: true });
  await expect(library).toBeVisible();
  await page.screenshot({
    path: 'test-results/library-page.png',
    fullPage: true,
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await library.getByLabel('Nome o titolo').fill('Ada');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Chiudi finestra' }).click();
  await expect(library).toBeVisible();
  await library.getByRole('button', { name: 'Salva scheda' }).click();
  await page.getByRole('button', { name: 'Chiudi finestra' }).click();
  await page.getByRole('button', { name: 'Preferenze', exact: true }).click();
  await expect(
    page.getByRole('main', { name: 'Preferenze di scrittura' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Salva preferenze' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toBeVisible();
  await expect(page.locator('.brand-mark')).toHaveCSS(
    'border-top-width',
    '0px',
  );
  await expect(page.locator('.project-title-button')).toHaveCSS(
    'border-top-width',
    '0px',
  );
  expect(errors).toEqual([]);
});

test('cancellazione progetto dalla home con conferma e recupero del testo', async ({
  page,
}) => {
  await startManuscript(page);
  await page
    .getByRole('textbox', { name: 'Testo · Capitolo' })
    .fill('Testo conservato');
  await page.getByRole('button', { name: 'Progetti', exact: true }).click();
  const remove = page.getByRole('button', { name: 'Sposta nel cestino Prova' });
  page.once('dialog', (dialog) => dialog.dismiss());
  await remove.click();
  await expect(
    page.getByRole('button', { name: 'Apri Prova', exact: true }),
  ).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await remove.click();
  await expect(
    page.getByRole('button', { name: 'Apri Prova', exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Cestino progetti', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Ripristina Prova', exact: true })
    .click();
  await page.getByRole('button', { name: 'Mostra progetti' }).click();
  await page.getByRole('button', { name: 'Apri Prova', exact: true }).click();
  await page.getByRole('button', { name: 'Capitolo', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toHaveText('Testo conservato');
});

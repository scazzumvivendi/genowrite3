import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

test('home collegata, ricerca e proprietà dei progetti', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startManuscript(page);
  await page.getByRole('button', { name: 'Progetti', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Genowrite 3' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Genowrite 3' }),
  ).toBeVisible();
  await page.getByLabel('Cerca progetti').fill('inesistente');
  await expect(
    page.getByRole('heading', { name: 'Nessun risultato' }),
  ).toBeVisible();
  await page.getByLabel('Cerca progetti').fill('prova');
  await page.getByRole('button', { name: 'Proprietà progetto Prova' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Titolo', { exact: true }).fill('Romanzo');
  await dialog.getByLabel('Autore', { exact: true }).fill('Ada');
  await dialog.getByRole('button', { name: 'Salva progetto' }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByLabel('Cerca progetti').fill('Ada');
  await expect(
    page.getByRole('button', { name: 'Apri Romanzo', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/project-home.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Apri Romanzo', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Proprietà progetto · Romanzo' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

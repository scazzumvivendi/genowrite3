import { expect, type Page } from '@playwright/test';

export async function startManuscript(page: Page) {
  await page.goto('/');
  await page.getByLabel('Titolo del nuovo progetto').fill('Prova');
  await page
    .getByRole('button', { name: 'Crea progetto', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Nuovo elemento', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'Nuovo elemento' });
  await dialog.getByLabel('Titolo', { exact: true }).fill('Capitolo');
  await dialog.getByRole('button', { name: 'Crea elemento' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toBeVisible();
}

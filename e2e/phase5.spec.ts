import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

test('biblioteca locale, collegamenti, ricerca e duplicazione indipendente', async ({
  page,
}) => {
  await startManuscript(page);
  await page
    .getByRole('textbox', { name: 'Testo · Capitolo' })
    .fill('Il mare e la città.');
  await page.getByRole('button', { name: 'Personaggi', exact: true }).click();
  const library = page.getByRole('dialog', { name: 'Personaggi', exact: true });
  await library.getByLabel('Nome o titolo').fill('Elena');
  await library
    .getByLabel('Descrizione', { exact: true })
    .fill('Protagonista della città.');
  await library
    .getByRole('checkbox', { name: 'Capitolo', exact: true })
    .check();
  await library
    .getByRole('button', { name: 'Salva scheda', exact: true })
    .click();
  await expect(
    library.getByRole('button', { name: 'Elena', exact: true }),
  ).toBeVisible();
  await library.getByRole('button', { name: 'Chiudi finestra' }).click();
  await page
    .getByRole('button', { name: 'Cerca nel progetto', exact: true })
    .click();
  const search = page.getByRole('dialog', {
    name: 'Cerca nel progetto',
    exact: true,
  });
  await search.getByLabel('Cerca testo, titoli e riferimenti').fill('Elena');
  await search.getByRole('button', { name: /Elena/ }).click();
  await expect(
    page
      .getByRole('dialog', { name: 'Personaggi' })
      .getByLabel('Nome o titolo'),
  ).toHaveValue('Elena');
  await page.getByRole('button', { name: 'Chiudi finestra' }).click();
  await page
    .getByRole('button', { name: 'Organizza', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Duplica elemento' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo (copia)' }),
  ).toHaveText('Il mare e la città.');
  await page.getByRole('textbox').fill('Solo nella copia.');
  await page.getByRole('button', { name: 'Capitolo', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveText('Il mare e la città.');
});

test('drag and drop conserva il testo e rifiuta una destinazione invalida', async ({
  page,
}) => {
  await startManuscript(page);
  await page.getByRole('textbox').fill('Testo da spostare.');
  await page
    .getByRole('button', { name: 'Nuovo elemento', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'Nuovo elemento' });
  await dialog.getByLabel('Titolo', { exact: true }).fill('Archivio');
  await dialog
    .getByRole('combobox', { name: 'Tipo', exact: true })
    .selectOption('folder');
  await dialog.getByRole('button', { name: 'Crea elemento' }).click();
  const navigation = page.getByRole('navigation', {
    name: 'Manoscritto',
    exact: true,
  });
  const chapter = navigation
    .locator('button.document-link')
    .filter({ hasText: /^Capitolo$/ });
  const folder = navigation
    .locator('button.document-link')
    .filter({ hasText: /^Archivio$/ });
  await chapter.dragTo(folder);
  await expect(
    navigation
      .locator('details')
      .filter({ hasText: 'Archivio' })
      .getByRole('button', { name: 'Capitolo', exact: true }),
  ).toBeVisible();
  await chapter.click();
  await expect(page.getByRole('textbox')).toHaveText('Testo da spostare.');
  await folder.dragTo(chapter);
  await expect(page.getByRole('alert')).toContainText('posizione');
  await expect(page.getByRole('textbox')).toHaveText('Testo da spostare.');
});

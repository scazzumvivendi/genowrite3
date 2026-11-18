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
  const library = page.getByRole('main', { name: 'Personaggi', exact: true });
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
    page.getByRole('main', { name: 'Personaggi' }).getByLabel('Nome o titolo'),
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

test('bacheca riordina senza perdere testo; navigazione senza trascinamento', async ({
  page,
}) => {
  await startManuscript(page);
  await page.getByRole('textbox').fill('Testo da spostare.');
  await page
    .getByRole('button', { name: 'Nuovo elemento', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'Nuovo elemento' });
  await expect(
    dialog
      .getByRole('combobox', { name: 'Tipo', exact: true })
      .locator('option'),
  ).toHaveCount(2);
  await dialog.getByLabel('Titolo', { exact: true }).fill('Secondo');
  await dialog.getByRole('button', { name: 'Crea elemento' }).click();
  await page
    .getByRole('button', { name: 'Vista globale dei capitoli' })
    .click();
  const cards = page.locator('.chapter-cards > li');
  await cards.nth(1).getByRole('button', { name: 'Sposta prima' }).click();
  await expect(cards.first()).toContainText('Secondo');
  await cards.first().dragTo(cards.nth(1));
  await expect(cards.first()).toContainText('Capitolo');
  await cards.first().getByRole('button', { name: 'Apri capitolo' }).click();
  await expect(page.getByRole('textbox')).toHaveText('Testo da spostare.');
  await expect(page.locator('.manuscript-list [draggable]')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('textbox')).toHaveText('Testo da spostare.');
});

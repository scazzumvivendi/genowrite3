import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

test('regole configurate: trasformazioni, undo/redo e selezione integra', async ({
  page,
}) => {
  await startManuscript(page);
  await page.getByRole('button', { name: 'Preferenze', exact: true }).click();
  const preferences = page.getByRole('dialog', {
    name: 'Preferenze di scrittura',
  });
  for (const label of [
    'Apostrofi italiani',
    'Tre punti → ellissi',
    'Spazi ripetuti',
    'Maiuscole dopo frasi non ambigue',
  ]) {
    await preferences.getByLabel(label, { exact: true }).check();
  }
  await preferences
    .getByRole('combobox', { name: 'Trattini' })
    .selectOption('em');
  await preferences.getByRole('button', { name: 'Salva preferenze' }).click();
  const editor = page.getByRole('textbox', { name: 'Testo · Capitolo' });
  for (const [input, output] of [
    ["e' ", 'è '],
    ["l'a", 'l’a'],
    ['...', '…'],
    ['-- ', '— '],
    ['Testo  ', 'Testo '],
    ['Fine. c', 'Fine. C'],
  ]) {
    await editor.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(input!);
    await expect(editor).toHaveText(output!);
    await page.keyboard.press('ControlOrMeta+z');
    await expect(editor).toHaveText(input!);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(editor).toHaveText(output!);
  }
});

test('ricerca/sostituzione, formattazione e segnalazioni non riscrivono gli acronimi', async ({
  page,
}) => {
  await startManuscript(page);
  const editor = page.getByRole('textbox', { name: 'Testo · Capitolo' });
  await editor.fill('mare mare NASA NAto');
  await page.getByRole('button', { name: 'Trova e sostituisci' }).click();
  await page.getByLabel('Trova nel documento').fill('mare');
  await page.getByLabel('Sostituisci con').fill('città');
  await page
    .getByRole('button', { name: 'Sostituisci tutti', exact: true })
    .click();
  await expect(editor).toHaveText('città città NASA NAto');
  await page.getByRole('button', { name: /Segnalazioni/ }).click();
  await expect(
    page.getByRole('button', {
      name: 'Maiuscole consecutive: verifica nome o acronimo.',
    }),
  ).toHaveCount(1);
  await expect(editor).toHaveText('città città NASA NAto');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.getByRole('button', { name: 'Sottolineato', exact: true }).click();
  await expect(editor.locator('u')).toHaveText('città città NASA NAto');
  await expect(page.getByRole('status')).toHaveText('Salvato sul dispositivo');
});

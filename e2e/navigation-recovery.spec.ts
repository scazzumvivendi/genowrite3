import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

test('uscita annullata con bozza pendente conserva testo e autosalvataggio', async ({
  page,
}) => {
  await startManuscript(page);
  await page.getByRole('button', { name: 'Preferenze', exact: true }).click();
  const preferences = page.getByRole('dialog');
  await preferences.getByLabel(/Ritardo autosalvataggio/).fill('2000');
  await preferences.getByRole('button', { name: 'Salva preferenze' }).click();
  await expect(preferences).toHaveCount(0);
  const editor = page.getByRole('textbox', { name: 'Testo · Capitolo' });
  await editor.fill('Conserva questa bozza anche annullando l’uscita.');
  const prompt = page.waitForEvent('dialog');
  await page.evaluate(() =>
    window.setTimeout(() => window.location.reload(), 0),
  );
  const dialog = await prompt;
  expect(dialog.type()).toBe('beforeunload');
  await dialog.dismiss();
  await expect(editor).toHaveText(
    'Conserva questa bozza anche annullando l’uscita.',
  );
  await expect(page.getByRole('status')).toHaveText('Salvato sul dispositivo');
  await page.reload();
  await expect(editor).toHaveText(
    'Conserva questa bozza anche annullando l’uscita.',
  );
});

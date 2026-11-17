import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

test('conteggi reali aggiornati mentre si scrive, nessun rimontaggio e Zen', async ({
  page,
}) => {
  await startManuscript(page);
  const editor = page.getByRole('textbox', { name: 'Testo · Capitolo' });
  const element = await editor.elementHandle();
  const current = page.getByRole('region', {
    name: 'Statistiche documento corrente',
  });
  const project = page.getByRole('region', {
    name: 'Statistiche intero progetto',
  });
  await expect(current).toContainText('0 parole');
  await editor.fill('Due parole');
  await expect(current).toContainText('2 parole');
  await expect(current).toContainText('10 caratteri');
  await expect(project).toContainText('2 parole');
  expect(await element?.evaluate((node) => node.isConnected)).toBe(true);
  await page.getByRole('button', { name: 'Modalità Zen' }).click();
  await expect(current).toBeVisible();
  await expect(project).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveText('Due parole');
});

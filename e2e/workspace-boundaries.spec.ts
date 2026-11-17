import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

test('pannelli: Escape e chiusura restituiscono focus al controllo', async ({
  page,
}) => {
  await startManuscript(page);
  const close = page.getByRole('button', { name: 'Chiudi navigazione' });
  await close.focus();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Navigazione', exact: true }),
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Dettagli documento', exact: true })
    .click();
  const inspector = page.getByRole('complementary', {
    name: 'Dettagli documento',
  });
  await inspector.getByRole('button', { name: 'Chiudi', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Dettagli documento', exact: true }),
  ).toBeFocused();
  await page
    .getByRole('button', { name: 'Dettagli documento', exact: true })
    .click();
  await inspector.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Dettagli documento', exact: true }),
  ).toBeFocused();
});

test('cestino da altra scheda: editor e ultima bozza restano aperti e recuperabili', async ({
  page,
  context,
}) => {
  await startManuscript(page);
  await page.reload();
  const editor = page.getByRole('textbox', { name: 'Testo · Capitolo' });
  await expect(editor).toBeVisible();
  const handle = await editor.elementHandle();
  const other = await context.newPage();
  await other.goto('/');
  await other.getByRole('button', { name: 'Organizza', exact: true }).click();
  other.once('dialog', (dialog) => void dialog.accept());
  await other
    .getByRole('button', { name: 'Sposta nel cestino', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('spostato nel cestino');
  expect(await handle?.evaluate((element) => element.isConnected)).toBe(true);
  await editor.fill('Ultima bozza conservata nel cestino.');
  await expect(
    page.getByRole('region', { name: 'Statistiche documento corrente' }),
  ).toContainText('5 parole');
  await expect(
    page.getByRole('region', { name: 'Statistiche intero progetto' }),
  ).toContainText('0 parole');
  await expect(page.getByRole('status')).toHaveText('Salvato sul dispositivo');
  await page.getByRole('button', { name: 'Apri cestino elementi' }).click();
  await page.getByRole('button', { name: 'Ripristina', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Capitolo', exact: true }),
  ).toBeVisible();
  await expect(editor).toHaveText('Ultima bozza conservata nel cestino.');
  await page.reload();
  await expect(editor).toHaveText('Ultima bozza conservata nel cestino.');
  await other.close();
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  test(`workspace ${viewport.width}×${viewport.height}: pannelli e statistiche separati`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await startManuscript(page);
    const navToggle = page.getByRole('button', {
      name: 'Navigazione',
      exact: true,
    });
    if ((await navToggle.getAttribute('aria-expanded')) === 'false') {
      await navToggle.click();
    }
    await page
      .getByRole('button', { name: 'Dettagli documento', exact: true })
      .click();
    const main = await page.getByRole('main').boundingBox();
    const inspector = await page
      .getByRole('complementary', { name: 'Dettagli documento' })
      .boundingBox();
    const stats = await page
      .getByRole('contentinfo', { name: 'Statistiche di scrittura' })
      .boundingBox();
    expect(
      main!.x + main!.width <= inspector!.x + 1 ||
        inspector!.y + inspector!.height <= main!.y + 1,
    ).toBe(true);
    expect(main!.y + main!.height).toBeLessThanOrEqual(stats!.y + 1);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Modalità Zen' }).click();
    await expect(
      page.getByRole('contentinfo', { name: 'Statistiche di scrittura' }),
    ).toBeVisible();
  });
}

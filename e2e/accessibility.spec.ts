import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

for (const dark of [false, true]) {
  test(`accessibilità WCAG 2.2 AA workspace e preferenze, scuro=${dark}`, async ({
    page,
  }) => {
    await startManuscript(page);
    if (dark) {
      await page
        .getByRole('button', { name: 'Preferenze', exact: true })
        .click();
      await page
        .getByRole('combobox', { name: 'Tema', exact: true })
        .selectOption('dark');
      await page.getByRole('button', { name: 'Salva preferenze' }).click();
    }
    const audit = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
    expect((await audit()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Preferenze', exact: true }).click();
    expect((await audit()).violations).toEqual([]);
  });
}

test('workspace reale compatto: statistiche e testo non coperti', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await startManuscript(page);
  const main = page.getByRole('main');
  const brand = await page.locator('.brand-context').boundingBox();
  const actions = await page.locator('.workspace-actions').boundingBox();
  expect(brand!.y + brand!.height).toBeLessThanOrEqual(actions!.y + 1);

  await expect(page.getByRole('textbox')).toBeVisible();
  const stats = page.getByRole('contentinfo', {
    name: 'Statistiche di scrittura',
  });
  const mainBox = await main.boundingBox();
  const statsBox = await stats.boundingBox();
  expect(mainBox!.y + mainBox!.height).toBeLessThanOrEqual(statsBox!.y + 1);
  await expect(
    stats.getByRole('region', { name: 'Statistiche documento corrente' }),
  ).toBeVisible();
  await expect(
    stats.getByRole('region', { name: 'Statistiche intero progetto' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth &&
        document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('live-mobile.png') });
});

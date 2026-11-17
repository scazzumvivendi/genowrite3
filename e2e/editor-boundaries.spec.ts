import { expect, test } from '@playwright/test';
import { startManuscript } from './helpers';

for (const [input, expected] of [
  ["e' ", 'è '],
  ["E' ", 'È '],
  ["Questo e' ", 'Questo è '],
  ["Dice: E' ", 'Dice: È '],
] as const) {
  test(`accento italiano: ${input}, cursore, undo/redo e Backspace`, async ({
    page,
  }) => {
    await startManuscript(page);
    const editor = page.getByRole('textbox', { name: 'Testo · Capitolo' });
    await editor.click();
    await page.keyboard.type(input);
    await expect(editor).toHaveText(expected);
    expect(
      await editor.evaluate((element) => {
        const selection = window.getSelection();
        return (
          element.contains(selection?.anchorNode ?? null) &&
          selection?.anchorOffset === element.textContent?.length
        );
      }),
    ).toBe(true);
    await page.keyboard.press('ControlOrMeta+z');
    await expect(editor).toHaveText(input);
    await page.keyboard.press('ControlOrMeta+Shift+z');
    await expect(editor).toHaveText(expected);
    await page.keyboard.press('Backspace');
    await expect(editor).toHaveText(expected.slice(0, -1));
    await page.keyboard.press('Backspace');
    await expect(editor).toHaveText(expected.slice(0, -2));
  });
}

test('incolla letterale, composizione Unicode e sostituzione di una selezione', async ({
  page,
}) => {
  await startManuscript(page);
  const editor = page.getByRole('textbox', { name: 'Testo · Capitolo' });
  await editor.click();
  await editor.evaluate((element) => {
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
      value: {
        getData: (format: string) =>
          format === 'text/plain' ? "E' città 👩🏽‍💻" : '',
        files: [],
      },
    });
    element.dispatchEvent(event);
  });
  await expect(editor).toHaveText("E' città 👩🏽‍💻");
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Backspace');
  await editor.dispatchEvent('compositionstart');
  await page.keyboard.insertText('日本語');
  await editor.dispatchEvent('compositionend', { data: '日本語' });
  await expect(editor).toHaveText('日本語');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type("Questo e' ");
  await expect(editor).toHaveText('Questo è ');
  await expect(page.getByRole('status')).toHaveText('Salvato sul dispositivo');
  await page.reload();
  await expect(editor).toHaveText('Questo è ');
});

test('errore all’apertura IndexedDB: avviso visibile, nessuna falsa sessione', async ({
  page,
}) => {
  await page.addInitScript(() => {
    IDBFactory.prototype.open = () => {
      throw new DOMException('Archivio bloccato', 'SecurityError');
    };
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Impossibile aprire l’archivio locale' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Archivio bloccato');
  await expect(page.getByRole('textbox')).toHaveCount(0);
});

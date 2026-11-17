import { expect, test } from '@playwright/test';

test('bootstrap senza errori console o richieste esterne', async ({ page }) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('request', (request) => {
    if (!['127.0.0.1', 'localhost'].includes(new URL(request.url()).hostname)) {
      external.push(request.url());
    }
  });
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Crea progetto', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

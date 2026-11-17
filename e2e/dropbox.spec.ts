import { expect, test } from '@playwright/test';

test('Dropbox: esportazione esplicita, anteprima e importazione indipendente', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'genowrite3.dropbox.token',
      JSON.stringify({
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000,
      }),
    );
  });
  let exported = '';
  await page.route(
    'https://content.dropboxapi.com/2/files/upload',
    async (route) => {
      exported = route.request().postData()!;
      expect(
        JSON.parse(route.request().headers()['dropbox-api-arg']!).mode,
      ).toBe('add');
      await route.fulfill({
        json: { id: 'id:backup', name: 'Copia.genowrite3.json' },
      });
    },
  );
  await page.route('https://api.dropboxapi.com/2/files/list_folder', (route) =>
    route.fulfill({
      json: {
        entries: [
          {
            '.tag': 'file',
            id: 'id:backup',
            name: 'Copia.genowrite3.json',
            size: 1000,
            server_modified: '2026-11-17T12:00:00Z',
          },
        ],
        has_more: false,
      },
    }),
  );
  await page.route('https://content.dropboxapi.com/2/files/download', (route) =>
    route.fulfill({ body: exported, contentType: 'application/octet-stream' }),
  );
  await page.goto('/');
  await page.getByLabel('Titolo del nuovo progetto').fill('Progetto Dropbox');
  await page
    .getByRole('button', { name: 'Crea progetto', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Nuovo elemento', exact: true })
    .first()
    .click();
  await page
    .getByRole('dialog', { name: 'Nuovo elemento' })
    .getByLabel('Titolo', { exact: true })
    .fill('Capitolo cloud');
  await page
    .getByRole('button', { name: 'Crea elemento', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Testo · Capitolo cloud' })
    .fill('Ultime parole da conservare.');
  await page.getByRole('button', { name: 'Esporta', exact: true }).click();
  expect(exported).toBe('');
  await page
    .getByRole('button', { name: 'Esporta su Dropbox', exact: true })
    .click();
  await expect(
    page.getByText('Backup esportato su Dropbox:', { exact: false }),
  ).toBeVisible();
  expect(exported).toContain('Ultime parole da conservare.');
  await page.getByRole('button', { name: 'Chiudi finestra' }).click();
  // Torna all’archivio progetti attraverso il comando della barra.
  await page.getByRole('button', { name: 'Progetti', exact: true }).click();
  await page
    .getByRole('button', { name: 'Ripristina backup', exact: true })
    .click();
  await page.getByRole('button', { name: 'Mostra backup Dropbox' }).click();
  await page
    .getByRole('button', { name: 'Copia.genowrite3.json', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Ripristina come nuovo progetto' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Ripristina come nuovo progetto' })
    .click();
  await page
    .getByRole('button', { name: 'Capitolo cloud', exact: true })
    .click();
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo cloud' }),
  ).toHaveText('Ultime parole da conservare.');
  await page.getByRole('button', { name: 'Progetti', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Apri Progetto Dropbox', exact: true }),
  ).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('Dropbox automatico: pulsante visibile, invio periodico solo su modifiche e disattivazione', async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'genowrite3.dropbox.token',
      JSON.stringify({
        accessToken: 'test-token',
        expiresAt: Date.now() + 3600000,
      }),
    );
  });
  let uploads = 0;
  await page.route(
    'https://content.dropboxapi.com/2/files/upload',
    async (route) => {
      uploads += 1;
      await route.fulfill({
        json: { id: 'id:copy', name: 'copy.genowrite3.json' },
      });
    },
  );
  await page.goto('/');
  await page.getByLabel('Titolo del nuovo progetto').fill('Periodico');
  await page
    .getByRole('button', { name: 'Crea progetto', exact: true })
    .click();
  await page.getByRole('button', { name: 'Dropbox', exact: true }).click();
  await page.clock.install();
  await page
    .getByRole('button', { name: 'Attiva backup automatico', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Disattiva backup automatico' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Chiudi finestra' }).click();
  expect(uploads).toBe(0);
  await page.clock.fastForward(60_000);
  await expect.poll(() => uploads).toBe(1);
  await page.clock.fastForward(60_000);
  await page.getByRole('button', { name: 'Dropbox', exact: true }).click();
  await expect(
    page.getByText('Ultimo backup automatico:', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Disattiva backup automatico' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Attiva backup automatico', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false');
  await page.clock.fastForward(60_000);
  expect(uploads).toBe(1);
});

import { readFile } from 'node:fs/promises';
import { expect, test, type BrowserContext } from '@playwright/test';
import { startManuscript } from './helpers';

test.use({ serviceWorkers: 'block' });
test('due dispositivi: apertura con stessa identità, merge, conflitto e recupero', async ({
  page,
  context,
  browser,
}) => {
  let remote = '';
  let revision = 0;
  let name = '';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const metadata = () => ({
    id: 'id:canonical',
    name,
    rev: String(revision),
    size: remote.length,
    server_modified: '2026-11-18T12:00:00Z',
  });
  async function routes(target: BrowserContext) {
    await target.addInitScript(() =>
      sessionStorage.setItem(
        'genowrite3.dropbox.token',
        JSON.stringify({
          accessToken: 'test',
          expiresAt: Date.now() + 3600000,
        }),
      ),
    );
    await target.route('https://*.dropboxapi.com/**', async (route) => {
      const url = route.request().url();
      if (url.endsWith('/files/list_folder')) {
        return route.fulfill({
          json: {
            entries: remote ? [{ '.tag': 'file', ...metadata() }] : [],
            has_more: false,
          },
        });
      }
      if (url.endsWith('/files/download')) {
        if (!remote) {
          return route.fulfill({
            status: 409,
            json: { error_summary: 'path/not_found/' },
          });
        }
        return route.fulfill({
          body: remote,
          headers: {
            'Dropbox-API-Result': JSON.stringify(metadata()),
            'Access-Control-Expose-Headers': 'Dropbox-API-Result',
            'Content-Type': 'application/json',
          },
        });
      }
      if (url.endsWith('/files/upload')) {
        const argument = JSON.parse(
          route.request().headers()['dropbox-api-arg']!,
        );
        if (remote) {
          expect(argument.mode).toEqual({
            '.tag': 'update',
            update: String(revision),
          });
        } else {
          expect(argument.mode).toBe('add');
          name = argument.path.slice(1);
        }
        remote = route.request().postData()!;
        revision++;
        return route.fulfill({ json: metadata() });
      }
      await route.abort();
    });
  }
  await routes(context);
  await startManuscript(page);
  await page.getByRole('textbox').fill('La casa era vuota.');
  await page.getByRole('button', { name: 'Dropbox', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Attiva sincronizzazione automatica',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Disattiva sincronizzazione',
      exact: true,
    }),
  ).toBeVisible();
  const projectId = JSON.parse(remote).snapshot.project.id;
  await page.getByRole('button', { name: 'Chiudi finestra' }).click();
  await page.getByRole('textbox').fill('La grande casa era vuota.');
  const otherVersion = JSON.parse(remote);
  otherVersion.snapshot.documents[0].content.content[0].content[0].text =
    'La casa era silenziosa.';
  remote = JSON.stringify(otherVersion);
  revision++;
  await page.getByRole('button', { name: 'Dropbox', exact: true }).click();
  await page
    .getByRole('button', { name: 'Controlla e sincronizza ora' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Controlla e sincronizza ora' }),
  ).toBeEnabled();
  await expect(
    page.getByText('Copie allineate all’ultimo controllo', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Chiudi finestra' }).click();
  await expect(page.getByRole('textbox')).toHaveText(
    'La grande casa era silenziosa.',
  );

  const secondContext = await browser.newContext({ serviceWorkers: 'block' });
  try {
    await routes(secondContext);
    const second = await secondContext.newPage();
    second.on('pageerror', (error) => errors.push(error.message));
    await second.goto(new URL('/', page.url()).href);
    await second
      .getByRole('button', { name: 'Ripristina backup', exact: true })
      .click();
    await second.getByRole('button', { name: 'Mostra backup Dropbox' }).click();
    await second.locator('.backup-projects button').click();
    await second.getByRole('button', { name, exact: true }).click();
    await second
      .getByRole('button', { name: 'Apri come progetto sincronizzato' })
      .click();
    await second.getByRole('button', { name: 'Capitolo', exact: true }).click();
    await expect(second.getByRole('textbox')).toHaveText(
      'La grande casa era silenziosa.',
    );
    await second.getByRole('textbox').fill('La grande casa era rossa.');
    await second.getByRole('button', { name: 'Dropbox', exact: true }).click();
    await second
      .getByRole('button', { name: 'Controlla e sincronizza ora' })
      .click();
    await expect
      .poll(
        () =>
          JSON.parse(remote).snapshot.documents[0].content.content[0].content[0]
            .text,
      )
      .toBe('La grande casa era rossa.');
    expect(JSON.parse(remote).snapshot.project.id).toBe(projectId);

    await page.getByRole('textbox').fill('La grande casa era blu.');
    await page.getByRole('button', { name: 'Dropbox', exact: true }).click();
    await page
      .getByRole('button', { name: 'Controlla e sincronizza ora' })
      .click();
    await expect(
      page.getByRole('button', { name: 'Usa la copia Dropbox', exact: true }),
    ).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await page
      .getByRole('button', { name: 'Usa la copia Dropbox', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Usa la copia Dropbox', exact: true }),
    ).toHaveCount(0);
    await page
      .getByText('Copie locali prima della sincronizzazione', { exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Scarica copia di recupero' }).first(),
    ).toBeVisible();
    await page.screenshot({
      path: 'test-results/dropbox-sync-screen.png',
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Chiudi finestra' }).click();
    await expect(page.getByRole('textbox')).toHaveText(
      'La grande casa era rossa.',
    );
  } finally {
    await secondContext.close();
  }
  expect(errors).toEqual([]);
});

test('sincronizzazione da altra scheda mantiene editor e bozza pendente', async ({
  page,
  context,
}) => {
  let remote = '';
  let revision = 0;
  await context.addInitScript(() =>
    sessionStorage.setItem(
      'genowrite3.dropbox.token',
      JSON.stringify({ accessToken: 'test', expiresAt: Date.now() + 3600000 }),
    ),
  );
  await context.route('https://*.dropboxapi.com/**', async (route) => {
    if (route.request().url().endsWith('/files/upload')) {
      remote = route.request().postData()!;
      revision++;
      return route.fulfill({
        json: { id: 'id:canonical', rev: String(revision) },
      });
    }
    if (!remote) {
      return route.fulfill({
        status: 409,
        json: { error_summary: 'path/not_found/' },
      });
    }
    return route.fulfill({
      body: remote,
      headers: {
        'Dropbox-API-Result': JSON.stringify({
          id: 'id:canonical',
          rev: String(revision),
          size: remote.length,
        }),
        'Access-Control-Expose-Headers': 'Dropbox-API-Result',
      },
    });
  });
  await startManuscript(page);
  await page.getByRole('textbox').fill('Testo iniziale');
  await page.getByRole('button', { name: 'Dropbox', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Attiva sincronizzazione automatica',
      exact: true,
    })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Disattiva sincronizzazione',
      exact: true,
    }),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto('/');
  await expect(other.getByRole('textbox')).toHaveText('Testo iniziale');
  const editor = await other.getByRole('textbox').elementHandle();
  await other.clock.install();
  await other.getByRole('textbox').fill('Bozza ancora in memoria');
  const changed = JSON.parse(remote);
  changed.snapshot.documents[0].content.content[0].content[0].text =
    'Testo remoto';
  remote = JSON.stringify(changed);
  revision++;
  await page
    .getByRole('button', { name: 'Controlla e sincronizza ora' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Controlla e sincronizza ora' }),
  ).toBeEnabled();
  await other.clock.fastForward(2000);
  await expect(other.getByRole('status')).toHaveText('Errore di salvataggio');
  await expect(other.getByRole('textbox')).toHaveText(
    'Bozza ancora in memoria',
  );
  expect(await editor?.evaluate((element) => element.isConnected)).toBe(true);
  const download = other.waitForEvent('download');
  await other
    .getByRole('button', { name: 'Scarica copia di emergenza' })
    .click();
  const file = await download;
  expect(await readFile((await file.path())!, 'utf8')).toContain(
    'Bozza ancora in memoria',
  );
});

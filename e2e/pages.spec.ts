import { expect, test } from '@playwright/test';

async function createManuscript(page: import('@playwright/test').Page) {
  await page.goto('./');
  await page.getByLabel('Titolo del nuovo progetto').fill('Pages');
  await page
    .getByRole('button', { name: 'Crea progetto', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Nuovo elemento', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'Nuovo elemento' });
  await dialog.getByLabel('Titolo', { exact: true }).fill('Capitolo');
  await dialog.getByRole('button', { name: 'Crea elemento' }).click();
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toBeVisible();
}

async function waitForOffline(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => resolve(),
          { once: true },
        ),
      );
    }
    return registration.scope;
  });
}

test('Pages: risorse nel sottopercorso, manifest, persistenza e DOCX completamente offline', async ({
  page,
  context,
  baseURL,
}) => {
  const errors: string[] = [];
  const wrongPaths: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('request', (request) => {
    if (
      request.url().startsWith('http') &&
      !request.url().startsWith(baseURL!)
    ) {
      wrongPaths.push(request.url());
    }
  });
  await createManuscript(page);
  expect(await waitForOffline(page)).toBe(baseURL);
  const icon = page.locator('.brand-mark img');
  await expect(icon).toHaveJSProperty('complete', true);
  expect(
    await icon.evaluate(
      (element) => (element as HTMLImageElement).naturalWidth,
    ),
  ).toBeGreaterThan(0);
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    )!;
    const response = await fetch(link.href);
    return { url: link.href, data: await response.json() };
  });
  for (const field of ['id', 'start_url', 'scope']) {
    expect(new URL(manifest.data[field], manifest.url).href).toBe(baseURL);
  }
  for (const entry of manifest.data.icons) {
    expect(new URL(entry.src, manifest.url).href).toContain(baseURL!);
  }
  await page.getByRole('button', { name: 'Preferenze', exact: true }).click();
  const licenses = page.getByRole('link', { name: /licenz/i });
  expect(await licenses.getAttribute('href')).toBe(
    `${new URL(baseURL!).pathname}third-party-notices.txt`,
  );
  await page.getByRole('button', { name: 'Chiudi finestra' }).click();
  const editor = page.getByRole('textbox', { name: 'Testo · Capitolo' });
  await editor.fill('Manoscritto pubblicato come app statica.');
  await expect(page.getByRole('status')).toHaveText('Salvato sul dispositivo');
  await context.setOffline(true);
  await page.reload();
  await expect(editor).toHaveText('Manoscritto pubblicato come app statica.');
  await editor.fill('Modifica locale senza rete.');
  await page.getByRole('button', { name: 'Esporta', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Scarica file' }).click();
  expect((await download).suggestedFilename()).toBe('Pages.docx');
  expect(errors).toEqual([]);
  expect(wrongPaths).toEqual([]);
});

test('Pages: aggiornamento conserva la bozza e le cache delle altre applicazioni', async ({
  page,
  context,
  baseURL,
}) => {
  await createManuscript(page);
  await waitForOffline(page);
  await page.evaluate(async () => {
    await (
      await caches.open('genowrite-shell-other-application')
    ).put('/other-app/sentinel', new Response('conservata'));
  });
  await page.evaluate(async () => {
    await navigator.serviceWorker.register(
      new URL('sw.js?test-update=1', location.href),
    );
  });
  await expect(
    page.getByRole('button', { name: 'Salva e aggiorna' }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Testo · Capitolo' })
    .fill('Ultima bozza prima dell’aggiornamento Pages.');
  const reloaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Salva e aggiorna' }).click();
  await reloaded;
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toHaveText('Ultima bozza prima dell’aggiornamento Pages.');
  expect(
    await page.evaluate(() => caches.has('genowrite-shell-other-application')),
  ).toBe(true);
  expect(await waitForOffline(page)).toBe(baseURL);
  // Le schede della versione precedente possono ancora caricare i loro chunk lazy.
  await page.evaluate(async () => {
    const name = (await caches.keys()).find(
      (key) =>
        key.startsWith('genowrite-shell-') &&
        key !== 'genowrite-shell-other-application',
    )!;
    const cache = await caches.open(name);
    await cache.put(
      new URL('assets/previous-version.js', location.href),
      new Response('previous-version', {
        headers: { 'Content-Type': 'text/javascript' },
      }),
    );
  });
  await context.setOffline(true);
  expect(
    await page.evaluate(async () =>
      (
        await fetch(new URL('assets/previous-version.js', location.href))
      ).text(),
    ),
  ).toBe('previous-version');
  expect(
    await page.evaluate(async () => {
      try {
        await fetch('/other-app/sentinel');
        return false;
      } catch {
        return true;
      }
    }),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'Testo · Capitolo' }),
  ).toHaveText('Ultima bozza prima dell’aggiornamento Pages.');
});

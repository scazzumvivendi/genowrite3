import { expect, test, type Page } from '@playwright/test';

async function createProject(page: Page) {
  await page.goto('/');
  await page.getByLabel('Titolo del nuovo progetto').fill('Romanzo locale');
  await page
    .getByRole('button', { name: 'Crea progetto', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Proprietà progetto' }),
  ).toHaveText('Romanzo locale');
}
async function chapter(page: Page, title: string) {
  await page
    .getByRole('button', { name: 'Nuovo elemento', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'Nuovo elemento' });
  await dialog.getByLabel('Titolo', { exact: true }).fill(title);
  await dialog.getByRole('button', { name: 'Crea elemento' }).click();
  await expect(
    page.getByRole('textbox', { name: `Testo · ${title}` }),
  ).toBeVisible();
}

test('progetto e testo sopravvivono al reload, conversione recuperabile e preferenze locali', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (reason) => errors.push(reason.message));
  await createProject(page);
  await chapter(page, 'Primo');
  await page
    .getByRole('textbox', { name: 'Testo · Primo' })
    .fill('Contenuto italiano, città e mare.');
  await expect(page.getByRole('status')).toHaveText('Modifiche da salvare…');
  await expect(page.getByRole('status')).toHaveText('Salvato sul dispositivo');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Testo · Primo' })).toHaveText(
    'Contenuto italiano, città e mare.',
  );
  await page
    .getByRole('button', { name: 'Organizza', exact: true })
    .first()
    .click();
  const organize = page.getByRole('dialog', { name: 'Organizza manoscritto' });
  page.once('dialog', (dialog) => void dialog.accept());
  await organize.getByRole('button', { name: 'Converti in scene' }).click();
  await expect(
    organize.getByRole('button', { name: 'Annulla conversione' }),
  ).toBeVisible();
  await organize.getByRole('button', { name: 'Annulla conversione' }).click();
  await expect(page.getByRole('textbox', { name: 'Testo · Primo' })).toHaveText(
    'Contenuto italiano, città e mare.',
  );
  await page.getByRole('button', { name: 'Preferenze', exact: true }).click();
  const preferences = page.getByRole('dialog', {
    name: 'Preferenze di scrittura',
  });
  await preferences
    .getByRole('combobox', { name: 'Tema', exact: true })
    .selectOption('dark');
  await preferences.getByRole('button', { name: 'Salva preferenze' }).click();
  await expect(preferences).not.toBeVisible();
  await expect(page.locator('.writing-shell')).toHaveAttribute(
    'data-theme',
    'dark',
  );
  await page.reload();
  await expect(page.locator('.writing-shell')).toHaveAttribute(
    'data-theme',
    'dark',
  );
  expect(errors).toEqual([]);
});

test('cambio documento prima del debounce salva gli ultimi caratteri; cestino e ripristino', async ({
  page,
}) => {
  await createProject(page);
  await chapter(page, 'Primo');
  await page.getByRole('textbox').fill('Ultimi caratteri da preservare.');
  await chapter(page, 'Secondo');
  await page.getByRole('button', { name: 'Primo', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveText(
    'Ultimi caratteri da preservare.',
  );
  await page
    .getByRole('button', { name: 'Organizza', exact: true })
    .first()
    .click();
  page.once('dialog', (dialog) => void dialog.accept());
  await page
    .getByRole('button', { name: 'Sposta nel cestino', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Organizza', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Ripristina', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveText(
    'Ultimi caratteri da preservare.',
  );
});

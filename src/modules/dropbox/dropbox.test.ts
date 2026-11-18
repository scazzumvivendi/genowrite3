import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GenowriteDatabase } from '../../database/db';
import { ProjectService } from '../storage/project-service';
import { exportBackup } from '../backup/backup';

let storage: Map<string, string>;
beforeEach(() => {
  vi.resetModules();
  storage = new Map();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  vi.stubGlobal('window', {
    location: {
      origin: 'https://example.org',
      href: 'https://example.org/',
      assign: vi.fn(),
    },
  });
  vi.stubGlobal('history', { replaceState: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());
function authorize() {
  storage.set(
    'genowrite3.dropbox.token',
    JSON.stringify({
      accessToken: 'test-token',
      expiresAt: Date.now() + 60_000,
    }),
  );
}
it('PKCE usa S256 e non include segreti; il redirect segue la base Vite', async () => {
  const auth = await import('./auth');
  expect(
    await auth.pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
  ).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  await auth.connectDropbox();
  const url = new URL(
    vi.mocked(window.location.assign).mock.calls[0]![0] as string,
  );
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.get('token_access_type')).toBe('offline');
  expect(url.searchParams.has('client_secret')).toBe(false);
  expect(url.searchParams.get('redirect_uri')).toBe(auth.redirectUri());
  expect(new URL(auth.redirectUri()).pathname).toBe(
    `${import.meta.env.BASE_URL}index.html`,
  );
  expect(url.searchParams.get('client_id')).toBe(auth.clientId);
});
it('callback rifiuta state estraneo e non chiama Dropbox', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  window.location.href = 'https://example.org/?code=secret-code&state=wrong';
  storage.set(
    'genowrite3.dropbox.pending',
    JSON.stringify({ state: 'expected', createdAt: Date.now() }),
  );
  const { finishDropboxAuth } = await import('./auth');
  await expect(finishDropboxAuth()).rejects.toThrow('non valido');
  expect(fetcher).not.toHaveBeenCalled();
  expect(storage.has('genowrite3.dropbox.pending')).toBe(false);
  expect(history.replaceState).toHaveBeenCalled();
});
it('callback scambia una sola volta il codice e conserva solo un token di sessione a scadenza', async () => {
  const auth = await import('./auth');
  window.location.href = 'https://example.org/?code=code&state=expected';
  storage.set(
    'genowrite3.dropbox.pending',
    JSON.stringify({
      state: 'expected',
      verifier: 'verifier',
      redirect: auth.redirectUri(),
      createdAt: Date.now(),
    }),
  );
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      Response.json({ access_token: 'token', expires_in: 3600 }),
    );
  vi.stubGlobal('fetch', fetcher);
  await Promise.all([auth.finishDropboxAuth(), auth.finishDropboxAuth()]);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(auth.dropboxToken()).toBe('token');
  auth.disconnectDropbox();
  expect(auth.dropboxToken()).toBeUndefined();
});
it('elenca tutte le pagine filtrando i backup; 401 scollega e offline produce un errore leggibile', async () => {
  authorize();
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        entries: [
          {
            '.tag': 'file',
            id: 'id:1',
            name: 'uno.genowrite3.json',
            server_modified: '2026-01-01',
          },
          { '.tag': 'folder', name: 'folder.genowrite3.json' },
        ],
        has_more: true,
        cursor: 'next',
      }),
    )
    .mockResolvedValueOnce(
      Response.json({
        entries: [
          {
            '.tag': 'file',
            id: 'id:2',
            name: 'due.genowrite3.json',
            server_modified: '2026-02-01',
          },
        ],
        has_more: false,
      }),
    );
  vi.stubGlobal('fetch', fetcher);
  const { listDropboxBackups } = await import('./files');
  expect((await listDropboxBackups()).map((file) => file.id)).toEqual([
    'id:2',
    'id:1',
  ]);
  expect(JSON.parse(fetcher.mock.calls[1]![1].body)).toEqual({
    cursor: 'next',
  });
  fetcher.mockResolvedValueOnce(new Response('', { status: 401 }));
  await expect(listDropboxBackups()).rejects.toThrow('revocata');
  expect(storage.has('genowrite3.dropbox.token')).toBe(false);
  authorize();
  fetcher.mockRejectedValueOnce(new TypeError('network'));
  await expect(listDropboxBackups()).rejects.toThrow('connessione');
});
it('esporta una copia completa senza sovrascrivere, header Unicode valido e importazione validata', async () => {
  authorize();
  const database = new GenowriteDatabase(`dropbox-${crypto.randomUUID()}`);
  try {
    const id = await new ProjectService(database).createProject('Città 📖');
    const text = await exportBackup(database, id);
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ id: 'id:backup', name: 'backup' }));
    vi.stubGlobal('fetch', fetcher);
    const { uploadDropboxBackup, downloadDropboxBackup } =
      await import('./files');
    await uploadDropboxBackup(text);
    const options = fetcher.mock.calls[0]![1];
    const argument = JSON.parse(options.headers['Dropbox-API-Arg']);
    expect(argument).toMatchObject({
      mode: 'add',
      autorename: false,
      strict_conflict: true,
    });
    expect(argument.path).toContain('Città');
    expect(
      [...options.headers['Dropbox-API-Arg']].every(
        (character) => character.charCodeAt(0) < 128,
      ),
    ).toBe(true);
    expect(options.headers['Content-Type']).toBe('application/octet-stream');
    expect(options.body).toBe(text);
    const file = {
      id: 'id:backup',
      name: 'backup',
      size: 1000,
      server_modified: '',
    };
    fetcher.mockResolvedValueOnce(new Response(text));
    expect((await downloadDropboxBackup(file)).snapshot.project.id).toBe(id);
    fetcher.mockResolvedValueOnce(new Response('{"format":"foreign"}'));
    await expect(downloadDropboxBackup(file)).rejects.toThrow();
    await expect(
      downloadDropboxBackup({ ...file, size: 100_000_001 }),
    ).rejects.toThrow('100 MB');
    expect(await database.projects.count()).toBe(1);
  } finally {
    await database.delete();
  }
});

it('refresh persistente condiviso tra richieste; offline conserva credenziali, revoca le elimina', async () => {
  const persistent = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => persistent.get(key) ?? null,
    setItem: (key: string, value: string) => persistent.set(key, value),
    removeItem: (key: string) => persistent.delete(key),
  });
  const expired = JSON.stringify({
    accessToken: 'old',
    expiresAt: 0,
    refreshToken: 'refresh',
  });
  persistent.set('genowrite3.dropbox.token', expired);
  const auth = await import('./auth');
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      Response.json({ access_token: 'new', expires_in: 3600 }),
    );
  vi.stubGlobal('fetch', fetcher);
  expect(auth.dropboxConnected()).toBe(true);
  expect(
    await Promise.all([auth.validDropboxToken(), auth.validDropboxToken()]),
  ).toEqual(['new', 'new']);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(String(fetcher.mock.calls[0]![1].body)).toContain(
    'grant_type=refresh_token',
  );
  expect(String(fetcher.mock.calls[0]![1].body)).not.toContain('client_secret');
  persistent.set('genowrite3.dropbox.token', expired);
  fetcher.mockRejectedValueOnce(new TypeError('offline'));
  await expect(auth.validDropboxToken()).rejects.toThrow();
  expect(auth.dropboxConnected()).toBe(true);
  fetcher.mockResolvedValueOnce(
    Response.json({ error: 'invalid_grant' }, { status: 400 }),
  );
  await expect(auth.validDropboxToken()).rejects.toThrow();
  expect(auth.dropboxConnected()).toBe(false);
});

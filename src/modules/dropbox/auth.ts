import { t } from '../../i18n';
const pendingKey = 'genowrite3.dropbox.pending';
const tokenKey = 'genowrite3.dropbox.token';
export const clientId =
  import.meta.env.VITE_DROPBOX_APP_KEY || 'ksxl1uointtcidi';

export function redirectUri() {
  return new URL(
    'index.html',
    new URL(import.meta.env.BASE_URL, window.location.origin),
  ).href;
}
function randomCode() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}
function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/=+$/u, '');
}
export async function pkceChallenge(verifier: string) {
  return base64url(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
    ),
  );
}
interface Credentials {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
}
function persistentStorage() {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
function credentials(): Credentials | undefined {
  try {
    const value = JSON.parse(
      persistentStorage()?.getItem(tokenKey) ||
        sessionStorage.getItem(tokenKey) ||
        'null',
    );
    if (
      typeof value?.accessToken === 'string' &&
      Number.isFinite(value.expiresAt)
    ) {
      return value;
    }
  } catch {
    /* Corrupted credentials require reconnecting. */
  }
}
function remember(value: Credentials) {
  if (value.refreshToken && persistentStorage()) {
    persistentStorage()!.setItem(tokenKey, JSON.stringify(value));
    sessionStorage.removeItem(tokenKey);
  } else {
    sessionStorage.setItem(tokenKey, JSON.stringify(value));
  }
}
export function disconnectDropbox() {
  sessionStorage.removeItem(tokenKey);
  sessionStorage.removeItem(pendingKey);
  persistentStorage()?.removeItem(tokenKey);
}
export function dropboxToken(): string | undefined {
  const token = credentials();
  return token && token.expiresAt > Date.now() + 30_000
    ? token.accessToken
    : undefined;
}
export function dropboxConnected() {
  return Boolean(dropboxToken() || credentials()?.refreshToken);
}
let refreshing: Promise<string> | undefined;
export async function validDropboxToken(): Promise<string> {
  const valid = dropboxToken();
  if (valid) {
    return valid;
  }
  refreshing ??= refresh().finally(() => {
    refreshing = undefined;
  });
  return refreshing;
}
async function refresh() {
  const previous = credentials();
  if (!previous?.refreshToken) {
    throw new Error(
      t('collega_nuovamente_dropbox_la_sessione_e_scaduta_e4f6f8'),
    );
  }
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: previous.refreshToken,
      client_id: clientId,
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (error.error === 'invalid_grant') {
      disconnectDropbox();
    }
    throw new Error(t('dropbox.refreshFailed'));
  }
  const token = await response.json();
  if (
    typeof token.access_token !== 'string' ||
    !Number.isFinite(token.expires_in) ||
    token.expires_in <= 0
  ) {
    throw new Error(t('risposta_dropbox_non_valida_8af7d6'));
  }
  // Disconnecting while the request is in flight must not reconnect the app.
  if (credentials()?.refreshToken !== previous.refreshToken) {
    throw new Error(t('dropbox.refreshFailed'));
  }
  remember({
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
    refreshToken: previous.refreshToken,
  });
  return token.access_token as string;
}
export async function connectDropbox() {
  const verifier = randomCode();
  const state = randomCode();
  const redirect = redirectUri();
  const challenge = await pkceChallenge(verifier);
  sessionStorage.setItem(
    pendingKey,
    JSON.stringify({ verifier, state, redirect, createdAt: Date.now() }),
  );
  const query = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirect,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    token_access_type: 'offline',
    scope: 'files.metadata.read files.content.read files.content.write',
  });
  window.location.assign(`https://www.dropbox.com/oauth2/authorize?${query}`);
}

let completion: Promise<boolean> | undefined;
export function finishDropboxAuth() {
  // React StrictMode può montare due volte: il codice OAuth si scambia una volta sola.
  completion ??= complete();
  return completion;
}
async function complete() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('code') && !url.searchParams.has('error')) {
    return false;
  }
  const raw = sessionStorage.getItem(pendingKey);
  sessionStorage.removeItem(pendingKey);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const denied = url.searchParams.has('error');
  for (const key of ['code', 'state', 'error', 'error_description']) {
    url.searchParams.delete(key);
  }
  history.replaceState(null, '', url);
  const pending = raw ? JSON.parse(raw) : null;
  if (
    !pending ||
    pending.state !== state ||
    pending.redirect !== redirectUri() ||
    Date.now() - pending.createdAt > 600_000
  ) {
    throw new Error(
      t(
        'collegamento_dropbox_scaduto_o_non_valido_riprova_dal_pulsante_co_95d447',
      ),
    );
  }
  if (denied || !code) {
    throw new Error(
      t(
        'collegamento_dropbox_annullato_i_progetti_locali_sono_disponibili_68fc74',
      ),
    );
  }
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      code_verifier: pending.verifier,
      redirect_uri: pending.redirect,
    }),
  });
  if (!response.ok) {
    throw new Error(
      t('impossibile_collegare_dropbox_riprova_il_collegamento_5c1bed'),
    );
  }
  const token = await response.json();
  if (
    typeof token.access_token !== 'string' ||
    !Number.isFinite(token.expires_in) ||
    token.expires_in <= 0
  ) {
    throw new Error(t('risposta_dropbox_non_valida_8af7d6'));
  }
  remember({
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
    ...(typeof token.refresh_token === 'string'
      ? { refreshToken: token.refresh_token }
      : {}),
  });
  return true;
}

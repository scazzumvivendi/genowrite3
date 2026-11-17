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
export function disconnectDropbox() {
  sessionStorage.removeItem(tokenKey);
  sessionStorage.removeItem(pendingKey);
}
export function dropboxToken(): string | undefined {
  try {
    const token = JSON.parse(sessionStorage.getItem(tokenKey) || 'null');
    if (
      typeof token?.accessToken === 'string' &&
      token.expiresAt > Date.now() + 30_000
    ) {
      return token.accessToken;
    }
  } catch {
    // Dati di sessione danneggiati: richiedere un nuovo collegamento.
  }
  sessionStorage.removeItem(tokenKey);
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
    token_access_type: 'online',
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
  sessionStorage.setItem(
    tokenKey,
    JSON.stringify({
      accessToken: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000,
    }),
  );
  return true;
}

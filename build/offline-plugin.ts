import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

/** Cache dei soli asset di build. IndexedDB rimane l'unico archivio dei contenuti. */
export function offlinePlugin(): Plugin {
  return {
    name: 'genowrite-offline-shell',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const publicAssets = [
        '/manifest.webmanifest',
        '/third-party-notices.txt',
        '/icon.svg',
        '/icon-192.png',
        '/icon-512.png',
      ];
      const assets = [
        ...new Set([
          '/',
          '/index.html',
          ...Object.keys(bundle).map((name) => `/${name}`),
          ...publicAssets,
        ]),
      ];
      const version = createHash('sha256')
        .update(
          JSON.stringify(assets) +
            publicAssets
              .map((name) => readFileSync(`public${name}`).toString('base64'))
              .join(''),
        )
        .digest('hex')
        .slice(0, 16);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `
const CACHE = 'genowrite-shell-${version}';
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('message', event => {
  if (event.data === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (windows.length <= 1) {
      for (const key of await caches.keys()) {
        if (key.startsWith('genowrite-shell-') && key !== CACHE) await caches.delete(key);
      }
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match('/index.html')).then(response => response || fetch(event.request)));
  } else if (ASSETS.includes(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith((async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith('genowrite-shell-')) {
          const match = await (await caches.open(key)).match(event.request, { ignoreSearch: true, ignoreVary: true });
          if (match) return match;
        }
      }
      return fetch(event.request);
    })());
  }
});
`,
      });
    },
  };
}

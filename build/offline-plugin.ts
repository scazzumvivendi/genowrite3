import { manifest } from './manifest.ts';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

/** Cache dei soli asset di build. IndexedDB rimane l'unico archivio dei contenuti. */
export function offlinePlugin(): Plugin {
  let base = '/';
  return {
    name: 'genowrite-offline-shell',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      base = config.base;
    },
    generateBundle(_options, bundle) {
      const publicAssets = [
        'manifest.webmanifest',
        'third-party-notices.txt',
        'icon.svg',
        'icon-192.png',
        'icon-512.png',
      ];
      const assets = [
        ...new Set([
          base,
          `${base}index.html`,
          ...Object.keys(bundle).map((name) => `${base}${name}`),
          ...publicAssets.map((name) => `${base}${name}`),
        ]),
      ];
      const version = createHash('sha256')
        .update(
          JSON.stringify(assets) +
            publicAssets
              .map((name) =>
                name === 'manifest.webmanifest'
                  ? JSON.stringify(manifest)
                  : readFileSync(`public/${name}`).toString('base64'),
              )
              .join(''),
        )
        .digest('hex')
        .slice(0, 16);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `
const PREFIX = 'genowrite-shell-${Buffer.from(base).toString('hex')}-';
const CACHE = PREFIX + '${version}';
const BASE = ${JSON.stringify(base)};
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
        if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      }
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(BASE + 'index.html')).then(response => response || fetch(event.request)));
  } else if (ASSETS.includes(url.pathname) || url.pathname.startsWith(BASE + 'assets/')) {
    event.respondWith((async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(PREFIX)) {
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

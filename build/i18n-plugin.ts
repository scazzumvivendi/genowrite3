import type { Plugin } from 'vite';
import { t } from '../src/i18n/index.ts';
import { manifest } from './manifest.ts';

export function i18nPlugin(): Plugin {
  let base = '/';
  return {
    name: 'genowrite-italian-metadata',
    configResolved(config) {
      base = config.base;
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== `${base}manifest.webmanifest`) {
          next();
          return;
        }
        response.setHeader('Content-Type', 'application/manifest+json');
        response.end(JSON.stringify(manifest));
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: JSON.stringify(manifest),
      });
    },
    transformIndexHtml(html) {
      return html.replace('%I18N_APP_TITLE%', t('app.title'));
    },
  };
}

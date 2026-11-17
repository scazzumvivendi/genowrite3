import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { offlinePlugin } from './build/offline-plugin.ts';

const developmentCsp: Plugin = {
  name: 'genowrite-development-csp',
  apply: 'serve',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) =>
      html.replace(
        "script-src 'self'",
        "script-src 'self' 'nonce-genowrite-local-development'",
      ),
  },
};
export default defineConfig(({ command }) => ({
  plugins: [react(), developmentCsp, offlinePlugin()],
  // Il preambolo React di Vite è inline soltanto durante lo sviluppo locale.
  html: command === 'serve' ? { cspNonce: 'genowrite-local-development' } : {},
}));

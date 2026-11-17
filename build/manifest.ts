import { t } from '../src/i18n/index.ts';

export const manifest = {
  id: './',
  name: t('app.name'),
  short_name: t('app.shortName'),
  lang: 'it',
  description: t('app.description'),
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: '#fef7ff',
  theme_color: '#6750a4',
  icons: [
    {
      src: './icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: './icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: './icon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
      purpose: 'any',
    },
  ],
};

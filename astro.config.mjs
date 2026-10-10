import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  compressHTML: true,
  site: 'https://www.smoothcornerstudio.com.au',
  i18n: { defaultLocale: 'en', locales: ['en', 'it'], routing: { prefixDefaultLocale: false } },
  integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', it: 'it' } }, filter: (page) => !page.includes('films-stories') && !page.endsWith('.xml') && !page.includes('/404') })],
  redirects: { '/films-stories': '/films' },
  vite: {
    optimizeDeps: {
      exclude: ['photoswipe'],
    },
    server: {
      watch: { usePolling: true },
    },
  },
});

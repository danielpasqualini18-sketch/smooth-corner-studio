import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  compressHTML: true,
  site: 'https://www.smoothcornerstudio.com.au',
  integrations: [sitemap({ filter: (page) => !page.includes('films-stories') && !page.endsWith('.xml') && !page.includes('/404') })],
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

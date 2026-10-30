import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({
  site: 'https://tbci.pavelml.ru',
  output: 'static',
  integrations: [react()],
  build: { format: 'directory' },
  vite: { build: { sourcemap: false } },
});

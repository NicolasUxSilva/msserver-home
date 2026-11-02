// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://msserver.com.br',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  // CSS inline: uma requisição bloqueante a menos na primeira dobra.
  build: { inlineStylesheets: 'always' },
});

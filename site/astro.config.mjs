// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cocola.github.io',
  base: '/pr-zen',
  output: 'static',
  build: {
    format: 'file',
  },
});

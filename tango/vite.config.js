import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/tango/',
  server: {
    port: 3001,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
  },
});

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/queens/',
  server: {
    port: 3002,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
  },
});

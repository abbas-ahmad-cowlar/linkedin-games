import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    proxy: {
      // Forward /tango requests to Tango's dev server
      '/tango': {
        target: 'http://localhost:3001',
        ws: true,
      },
      // Forward /queens requests to Queens' dev server
      '/queens': {
        target: 'http://localhost:3002',
        ws: true,
      },
    },
  },
});

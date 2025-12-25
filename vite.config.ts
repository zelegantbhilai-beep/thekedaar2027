import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  define: {
    // Polyfill process.env for the browser to support process.env.API_KEY
    'process.env': {
       API_KEY: process.env.API_KEY
    }
  }
});
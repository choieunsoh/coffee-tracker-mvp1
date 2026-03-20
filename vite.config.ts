import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/config': path.resolve(__dirname, './src/config'),
    },
  },
  server: {
    port: 3001,
  },
  build: {
    target: 'ES2022',
    outDir: 'dist',
    sourcemap: true,
  },
});

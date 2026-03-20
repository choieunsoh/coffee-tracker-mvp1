import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';

// Read package.json for version
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

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
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
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

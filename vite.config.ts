import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'assets/react-pricing',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/mount-nexus-comparison.tsx'),
      name: 'NexusPricingSection',
      formats: ['iife'],
      fileName: () => 'nexus-pricing-section.js',
    },
  },
});


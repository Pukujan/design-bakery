import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const repoRoot = path.resolve(__dirname, '../..');
const frontendUi = path.join(repoRoot, 'frontend/src/app/components/ui');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.join(repoRoot, 'frontend/src/app'),
      '@/components/ui': frontendUi,
    },
  },
  server: {
    port: 5310,
    strictPort: false,
  },
});

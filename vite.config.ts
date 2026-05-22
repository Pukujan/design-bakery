import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 5300,
    strictPort: true,
  },
  preview: {
    port: 4174,
    strictPort: true,
  },
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
      '@ekagajpatra-case-study': path.resolve(
        __dirname,
        './extras/Create Presentation Case Study/src'
      ),
      '@invest-ai-case-study': path.resolve(
        __dirname,
        './extras/invest-ai-case-study/src'
      ),
    },
  },
})

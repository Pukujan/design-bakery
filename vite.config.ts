import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readDevPortBase, resolveDevPort } from './scripts/resolve-dev-port.mjs'

/** Firebase Callable paths look like /{projectId}/{region}/{functionName} */
function functionsEmulatorProxy() {
  return {
    target: 'http://127.0.0.1:5001',
    changeOrigin: true,
    secure: false,
  }
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const projectId = env.VITE_FIREBASE_PROJECT_ID || 'auth-system-be464'
  const basePort = readDevPortBase()
  const devPort = await resolveDevPort(basePort)
  if (devPort !== basePort) {
    console.log(`[vite] port ${basePort} in use → using ${devPort}`)
  }

  return {
    server: {
      port: devPort,
      // Port freed in scripts/free-dev-port.mjs before dev — stay on 5300 so Functions proxy matches.
      strictPort: true,
      // Same-origin proxy → avoids CORS preflight to the Functions emulator on :5001
      proxy: {
        [`^/${projectId}/`]: functionsEmulatorProxy(),
      },
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
  }
})

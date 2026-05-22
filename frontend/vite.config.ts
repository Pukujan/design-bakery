import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readDevPortBase, resolveDevPort } from '../scripts/resolve-dev-port.mjs'

/** `extras/*` case studies import npm packages; resolve via frontend/node_modules. */
function resolveExtrasFromFrontend(): Plugin {
  const anchor = path.join(__dirname, 'src/main.tsx')
  return {
    name: 'resolve-extras-from-frontend',
    async resolveId(source, importer) {
      if (!importer?.includes(`${path.sep}extras${path.sep}`)) return null
      if (source.startsWith('.') || source.startsWith('/')) return null
      return this.resolve(source, anchor, { skipSelf: true })
    },
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

/** Firebase Callable paths look like /{projectId}/{region}/{functionName} */
function functionsEmulatorProxy() {
  return {
    target: 'http://127.0.0.1:5001',
    changeOrigin: true,
    secure: false,
  }
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const projectId = env.VITE_FIREBASE_PROJECT_ID || 'auth-system-be464'
  const basePort = readDevPortBase()
  const devPort = await resolveDevPort(basePort)
  if (devPort !== basePort) {
    console.log(`[vite] port ${basePort} in use → using ${devPort}`)
  }

  return {
    envDir: __dirname,
    server: {
      port: devPort,
      strictPort: true,
      proxy: {
        [`^/${projectId}/`]: functionsEmulatorProxy(),
      },
    },
    preview: {
      port: 4174,
      strictPort: true,
    },
    plugins: [react(), tailwindcss(), resolveExtrasFromFrontend()],
    resolve: {
      modules: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(repoRoot, 'node_modules'),
      ],
      alias: {
        '@': path.resolve(__dirname, './src/app'),
        '@ekagajpatra-case-study': path.resolve(
          repoRoot,
          'extras/Create Presentation Case Study/src',
        ),
        '@invest-ai-case-study': path.resolve(
          repoRoot,
          'extras/invest-ai-case-study/src',
        ),
      },
    },
  }
})

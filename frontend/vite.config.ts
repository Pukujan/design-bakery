import { defineConfig } from 'vite'
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

export default defineConfig(async () => {
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
        '@og': path.resolve(__dirname, './src/og'),
        '@ekagajpatra-case-study': path.resolve(
          __dirname,
          'extras/Create Presentation Case Study/src',
        ),
        '@invest-ai-case-study': path.resolve(__dirname, 'extras/invest-ai-case-study/src'),
        '@oni-agent-case-study-v3': path.resolve(
          __dirname,
          'extras/oni_agent_interactive_page_svg_darkmode_src',
        ),
        '@oni-agent-case-study-v4': path.resolve(
          __dirname,
          'extras/oni_agent_interactive_page_svg_darkmode_v4_src',
        ),
      },
    },
  }
})

#!/usr/bin/env node
// Builds the /version-2 page (frontend/version-2-app) and copies its output into the
// site's dist tree at /version-2/, where Caddy and Vercel serve it for /version-2 and
// /version-2/.
//
// frontend/version-2-app is deliberately NOT a pnpm workspace member: it wants Vite 8
// and Tailwind 3, while the root workspace pins Vite 6.3.5 and Tailwind 4. Joining would
// rewrite pnpm-lock.yaml and break the frozen-lockfile installs in Docker/CI, so it
// keeps its own lockfile and this script installs it separately.
//
// Best effort is NOT the rule here: the page is a real page, so a failure fails the
// build. Set VERSION_2_APP_BUILD=0 to skip it (offline builds).
import { spawnSync } from 'node:child_process';
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('../frontend/version-2-app', import.meta.url));
const target = fileURLToPath(new URL('../frontend/dist/version-2', import.meta.url));

function run(args, cwd) {
  const res = spawnSync(args.join(' '), { cwd, stdio: 'inherit', shell: true, env: { ...process.env, CI: '1' } });
  if (res.status !== 0) {
    console.error(`[version-2-app] "${args.join(' ')}" failed with exit code ${res.status}`);
    process.exit(res.status ?? 1);
  }
}

async function main() {
  if (process.env.VERSION_2_APP_BUILD === '0') {
    console.log('[version-2-app] skipped (VERSION_2_APP_BUILD=0).');
    return;
  }
  if (!existsSync(appDir)) {
    console.error(`[version-2-app] source not found at ${appDir}`);
    process.exit(1);
  }

  // --ignore-workspace matters: frontend/version-2-app sits inside the repo, so a plain
  // `pnpm install` walks up to the root pnpm-workspace.yaml and installs the workspace
  // instead of this project (leaving @vitejs/plugin-react-swc unresolvable).
  run(['pnpm', 'install', '--frozen-lockfile', '--ignore-workspace'], appDir);
  run(['pnpm', 'run', 'build'], appDir);

  const built = `${appDir}/dist`;
  if (!existsSync(built)) {
    console.error('[version-2-app] build produced no dist/ directory');
    process.exit(1);
  }

  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp(built, target, { recursive: true });
  const { size } = await stat(`${target}/index.html`);
  console.log(`[version-2-app] built and copied to frontend/dist/version-2 (index.html ${size} bytes).`);
}

main().catch((err) => {
  console.error(`[version-2-app] unexpected error: ${err.message}`);
  process.exit(1);
});

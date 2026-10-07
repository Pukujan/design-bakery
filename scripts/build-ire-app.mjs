#!/usr/bin/env node
// Builds the IRE React dashboard (frontend/ire-app) and copies its output into the
// site's dist tree at /ire/app/, where Caddy serves it as a plain directory index.
//
// frontend/ire-app is deliberately NOT a pnpm workspace member: it wants Vite 8 and
// Tailwind 3, while the root workspace pins Vite 6.3.5 and Tailwind 4. Joining would
// rewrite pnpm-lock.yaml and break the frozen-lockfile installs in Docker/CI, so it
// keeps its own lockfile and this script installs it separately.
//
// Best effort is NOT the rule here: the app is a real page, so a failure fails the
// build. Set IRE_APP_BUILD=0 to skip it (offline builds).
import { spawnSync } from 'node:child_process';
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('../frontend/ire-app', import.meta.url));
const target = fileURLToPath(new URL('../frontend/dist/ire/app', import.meta.url));

function run(args, cwd) {
  const res = spawnSync(args.join(' '), { cwd, stdio: 'inherit', shell: true, env: { ...process.env, CI: '1' } });
  if (res.status !== 0) {
    console.error(`[ire-app] "${args.join(' ')}" failed with exit code ${res.status}`);
    process.exit(res.status ?? 1);
  }
}

async function main() {
  if (process.env.IRE_APP_BUILD === '0') {
    console.log('[ire-app] skipped (IRE_APP_BUILD=0).');
    return;
  }
  if (!existsSync(appDir)) {
    console.error(`[ire-app] source not found at ${appDir}`);
    process.exit(1);
  }

  // --ignore-workspace matters: frontend/ire-app sits inside the repo, so a plain
  // `pnpm install` walks up to the root pnpm-workspace.yaml and installs the workspace
  // instead of this project (leaving @vitejs/plugin-react-swc unresolvable).
  run(['pnpm', 'install', '--frozen-lockfile', '--ignore-workspace'], appDir);
  run(['pnpm', 'run', 'build'], appDir);

  const built = `${appDir}/dist`;
  if (!existsSync(built)) {
    console.error('[ire-app] build produced no dist/ directory');
    process.exit(1);
  }

  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp(built, target, { recursive: true });
  const { size } = await stat(`${target}/index.html`);
  console.log(`[ire-app] built and copied to frontend/dist/ire/app (index.html ${size} bytes).`);
}

main().catch((err) => {
  console.error(`[ire-app] unexpected error: ${err.message}`);
  process.exit(1);
});

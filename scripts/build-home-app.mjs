#!/usr/bin/env node
// Promotes the cinematic-journey app (frontend/version-2-app) to the site's homepage.
//
// The site is two documents sharing one origin:
//   /            -> the journey (this app; a single scroll-driven page, no router)
//   /shell/index.html -> the site shell SPA (blogs, research, case studies, admin)
//
// Vercel evaluates `redirects` before the filesystem but `rewrites` after it, and Caddy
// mirrors that. So no rewrite can change what `/` serves: the file at frontend/dist/
// index.html IS the homepage. This script performs the swap the build order already set
// up — `vite build` has just written the shell to frontend/dist/index.html, so it is
// moved aside to frontend/dist/shell/index.html, and the journey build is copied in over
// it. The SPA fallback and the two consumers that read the shell by path
// (backend/src/og/blogShareHtml.ts, the Caddyfile `handle_errors`) are repointed at
// /shell/index.html by hand — see scripts/test-home-app.mjs, which fails if they drift.
//
// The app directory keeps its historical name `frontend/version-2-app`: it was first
// published additively at /version-2 (TASK-DB-0083) before becoming the homepage here.
//
// frontend/version-2-app is deliberately NOT a pnpm workspace member: it wants Vite 8
// and Tailwind 3, while the root workspace pins Vite 6.3.5 and Tailwind 4. Joining would
// rewrite pnpm-lock.yaml and break the frozen-lockfile installs in Docker/CI, so it
// keeps its own lockfile and this script installs it separately.
//
// Best effort is NOT the rule here: the homepage is the whole point, so a failure fails
// the build. Set HOME_APP_BUILD=0 to skip it (offline builds).
import { spawnSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rename, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('../frontend/version-2-app', import.meta.url));
const dist = fileURLToPath(new URL('../frontend/dist', import.meta.url));
const shellHtml = `${dist}/index.html`;
const shellTarget = `${dist}/shell`;

function run(args, cwd) {
  const res = spawnSync(args.join(' '), { cwd, stdio: 'inherit', shell: true, env: { ...process.env, CI: '1' } });
  if (res.status !== 0) {
    console.error(`[home-app] "${args.join(' ')}" failed with exit code ${res.status}`);
    process.exit(res.status ?? 1);
  }
}

async function main() {
  if (process.env.HOME_APP_BUILD === '0') {
    console.log('[home-app] skipped (HOME_APP_BUILD=0).');
    return;
  }
  if (!existsSync(appDir)) {
    console.error(`[home-app] source not found at ${appDir}`);
    process.exit(1);
  }

  // --ignore-workspace matters: frontend/version-2-app sits inside the repo, so a plain
  // `pnpm install` walks up to the root pnpm-workspace.yaml and installs the workspace
  // instead of this project (leaving @vitejs/plugin-react-swc unresolvable).
  run(['pnpm', 'install', '--frozen-lockfile', '--ignore-workspace'], appDir);
  run(['pnpm', 'run', 'build'], appDir);

  const built = `${appDir}/dist`;
  if (!existsSync(built)) {
    console.error('[home-app] build produced no dist/ directory');
    process.exit(1);
  }

  // The shell document must exist: `vite build` runs before this script in the frontend
  // build chain. If it is missing, the swap would silently publish a site with no shell
  // (blogs, research and case studies would 404 through the fallback), so fail loudly.
  if (!existsSync(shellHtml)) {
    console.error(`[home-app] no shell document at ${shellHtml} — run \`vite build\` first (the frontend build chains this script after it).`);
    process.exit(1);
  }

  // Move the shell aside, then put the journey where `/` is served from.
  await rm(shellTarget, { recursive: true, force: true });
  await mkdir(shellTarget, { recursive: true });
  await rename(shellHtml, `${shellTarget}/index.html`);
  await cp(`${built}/index.html`, shellHtml);

  // The journey's own assets and scene plates land at the site root. Assets are
  // content-hashed, so they sit beside the shell's without colliding.
  await mkdir(`${dist}/assets`, { recursive: true });
  await cp(`${built}/assets`, `${dist}/assets`, { recursive: true });
  for (const file of await readdir(built)) {
    if (/^(generated-|plate-).*\.png$/.test(file) || file === 'favicon.ico') {
      await cp(`${built}/${file}`, `${dist}/${file}`);
    }
  }

  const { size } = await stat(shellHtml);
  const shell = await readFile(`${shellTarget}/index.html`, 'utf8');
  const home = await readFile(shellHtml, 'utf8');
  console.log(
    `[home-app] homepage published at frontend/dist/index.html (${size} bytes); ` +
      `site shell moved to frontend/dist/shell/index.html (${shell.length} bytes).`,
  );
  if (!shell.includes('assets/')) {
    console.error('[home-app] the shell document has no asset script — the move looks wrong');
    process.exit(1);
  }
  if (home.includes('/shell/index.html')) {
    console.error('[home-app] the homepage document points at the shell — the swap looks wrong');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`[home-app] unexpected error: ${err.message}`);
  process.exit(1);
});

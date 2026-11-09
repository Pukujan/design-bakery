// Chrome's life: started cold for one job (a song, or the owner signing in), closed when that job ends. Only the profile
// (the Google sign-in) stays, in DATA_DIR/profile. Chrome is started by hand, not by Playwright's launch, so it carries no
// automation flags; Playwright attaches over the DevTools port, the same way video-studio drives Flow on the owner's Mac.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const DATA = process.env.DATA_DIR || '/data';
const PROFILE = path.join(DATA, 'profile');
const CDP_PORT = 9222;
const DISPLAY = ':99';

const procs = [];

function run(cmd, args, env = {}) {
  const p = spawn(cmd, args, { stdio: 'ignore', env: { ...process.env, DISPLAY, ...env } });
  procs.push(p);
  return p;
}

async function waitFor(check, ms, what) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await check().catch(() => false)) return;
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`${what} did not start`);
}

export const running = () => procs.some(p => p.exitCode === null);

// Start Xvfb and Chrome (and, for signing in, the remote screen: x11vnc + noVNC on :6080). Returns Playwright's browser.
export async function start({ screen = false, url = 'https://www.flowmusic.app/' } = {}) {
  if (running()) throw new Error('chrome is already running');
  fs.mkdirSync(PROFILE, { recursive: true });
  // A crash leaves Chrome's lock behind, and the next start would refuse the profile.
  for (const f of ['SingletonLock', 'SingletonSocket', 'SingletonCookie']) fs.rmSync(path.join(PROFILE, f), { force: true });
  fs.rmSync('/tmp/.X99-lock', { force: true });
  run('Xvfb', [DISPLAY, '-screen', '0', '1500x950x24', '-nolisten', 'tcp']);
  await waitFor(async () => fs.existsSync('/tmp/.X11-unix/X99'), 10000, 'Xvfb');
  if (screen) {
    run('x11vnc', ['-display', DISPLAY, '-forever', '-shared', '-nopw', '-localhost', '-rfbport', '5900', '-quiet']);
    run('websockify', ['--web', '/usr/share/novnc', '6080', 'localhost:5900']);
  }
  run('google-chrome', [
    `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${CDP_PORT}`, '--remote-debugging-address=127.0.0.1',
    '--no-sandbox', '--no-first-run', '--no-default-browser-check', '--password-store=basic', '--window-position=0,0',
    '--window-size=1500,950', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required', url,
  ]);
  await waitFor(async () => (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).ok, 30000, 'chrome');
  return chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
}

// Close Chrome politely (so the sign-in is written to disk), then everything else.
export async function stop(browser) {
  if (browser) {
    try {
      const cdp = await browser.newBrowserCDPSession();
      await cdp.send('Browser.close');
    } catch { /* already gone */ }
  }
  const chrome = procs.find(p => p.spawnargs[0] === 'google-chrome' && p.exitCode === null);
  if (chrome) await new Promise(r => { const t = setTimeout(r, 8000); chrome.once('exit', () => { clearTimeout(t); r(); }); });
  for (const p of procs.splice(0)) if (p.exitCode === null) p.kill('SIGTERM');
}

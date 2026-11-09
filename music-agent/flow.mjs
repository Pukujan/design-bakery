// Flow Music (www.flowmusic.app) driver. Its sign-in is Supabase's (sb.flowmusic.app); the site's own /__api/users/me
// answers `null` to a visitor who is not signed in.
import fs from 'node:fs';
import path from 'node:path';

export const HOME = 'https://www.flowmusic.app/';

export async function page(b) {
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(x => x.url().includes('flowmusic.app')) || ctx.pages()[0] || await ctx.newPage();
  if (!p.url().includes('flowmusic.app')) await p.goto(HOME);
  await p.waitForLoadState('domcontentloaded');
  return p;
}

export async function signedIn(p) {
  await p.waitForTimeout(3000);
  return p.evaluate(async () => {
    const r = await fetch('/__api/users/me', { credentials: 'include' });
    return r.ok && (await r.json()) !== null;
  });
}

// A look at the page without spending credits: a screenshot, its visible controls and the API calls it makes.
export async function probe(p, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const calls = [];
  p.on('request', r => { if (/flowmusic|googleapis/.test(r.url()) && r.resourceType() !== 'image') calls.push(`${r.method()} ${r.url().slice(0, 200)}`); });
  await p.goto(HOME);
  await p.waitForTimeout(6000);
  const signed = await signedIn(p);
  await p.screenshot({ path: path.join(dir, 'home.png') });
  const controls = await p.evaluate(() => [...document.querySelectorAll('button, a, input, textarea, [role=button], [contenteditable=true], [role=textbox]')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height; })
    .map(e => [e.tagName.toLowerCase(), e.getAttribute('aria-label') || '', (e.innerText || e.placeholder || '').trim().slice(0, 60), e.getAttribute('href') || ''].join(' | ')));
  const out = { url: p.url(), signedIn: signed, controls, calls: [...new Set(calls)].slice(0, 80) };
  fs.writeFileSync(path.join(dir, 'probe.json'), JSON.stringify(out, null, 2));
  return out;
}

// Mapped once the owner has signed in (TASK-DB-0160): until then, a song request fails clearly.
export async function makeSong() {
  throw new Error('the Flow Music page is not mapped yet');
}

/**
 * A call in a real browser: the page (Chromium through Playwright) talks to the local backend the way a voice call does, through
 * the store's own send(line, page, { voice: true }), and the checks look at the screen: where the page went, whether it scrolled
 * through a list, whether the booking card is in view with the right name and email. Only the microphone and the voice agent are
 * left out; the brain, the tools, the store and the page are the real ones.
 *
 * Needs the web app in dev mode on localhost:5300 (the `web` launch config) and the backend on 8787 (the `api-voice` launch config):
 *
 *   node scripts/sim/browser-call.mjs [--web http://localhost:5300] [--shots dir]
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const web = flag('--web', 'http://localhost:5300');
const shots = flag('--shots', '');
if (shots) mkdirSync(shots, { recursive: true });

const fails = [];
const ok = (cond, what) => { console.log(`${cond ? '✓' : '✗'} ${what}`); if (!cond) fails.push(what); };

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
if (args.includes('--debug')) page.on('response', async (r) => { if (r.url().includes('/api/copilot/chat')) { const req = r.request().postDataJSON(); const body = await r.text(); console.log('  req', JSON.stringify(req.messages.at(-1).content).slice(0, 56), '| flow in', req.flow?.step ?? '-', '| out', body.split('\n').filter((l) => l.includes('"flow"')).map((l) => JSON.parse(l).flow?.step ?? 'null').join('') || '-'); } });
await page.goto(`${web}/research`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
if (!(await page.evaluate(() => typeof window.__copilot === 'object'))) { console.error('no window.__copilot: run the web app in dev mode'); process.exit(2); }
await page.evaluate(() => window.__voiceSet({ status: 'connected' }));

/** One line said on the call: sent as the voice agent would, then the page's own moves are waited for. */
const say = (line) => page.evaluate(async (text) => {
  const c = window.__copilot;
  await c.send(text, { path: location.pathname, title: document.title }, { voice: true });
  // The call waits for the page's moves for up to 30 s (voice.ts); a walk through a long list can take most of that.
  await Promise.race([c.takeMoves(), new Promise((r) => setTimeout(r, 30000))]);
  // Then until the page has stopped changing, so the next line is said from where the call really is.
  let last = location.pathname;
  for (let stable = 0; stable < 4;) {
    await new Promise((r) => setTimeout(r, 300));
    if (location.pathname === last) stable += 1; else { last = location.pathname; stable = 0; }
  }
  return { path: location.pathname, list: c.takeListScroll() };
}, line);
const shot = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };

// 1. A list page: the call goes there and scrolls through it while the answer is spoken.
const list = await say('Show me your research papers.');
ok(list.path === '/research', `"show me your research papers" goes to /research (is ${list.path})`);
ok(list.list === true, 'the move to a list page is marked for scrolling through');
await page.evaluate(() => { window.scrollTo(0, 0); window.__copilot.scrollList(3000); });
await page.waitForTimeout(3300);
const y = await page.evaluate(() => ({ y: window.scrollY, vh: window.innerHeight, max: document.documentElement.scrollHeight - window.innerHeight }));
ok(y.y >= Math.min(y.max, y.vh * 3) - 60, `the list is scrolled through (${Math.round(y.y)} px of ${Math.round(y.max)} possible, 3 screens is ${y.vh * 3})`);
await shot('1-list-scrolled');

// 2. Next and previous follow the list.
const n1 = await say('Next.');
ok(n1.path === '/research/papers/db-r-2026-001', `"next" on the list opens the first paper (is ${n1.path})`);
const n2 = await say('Next one.');
ok(n2.path === '/research/papers/db-r-2026-002', `"next one" opens the second (is ${n2.path})`);
const p1 = await say('Previous.');
ok(p1.path === '/research/papers/db-r-2026-001', `"previous" goes back to the first (is ${p1.path})`);

// 3. Booking: the dialogue, then the card on the screen with the confirmed name and email.
const b0 = await say('Okay, book the call.');
ok(b0.path === '/contact', `"book the call" goes to /contact (is ${b0.path})`);
for (const line of ['Pujan.', 'Yes.', 'poo jun', 'P U J A N three six four five at gmail dot com.']) await say(line);
ok((await page.locator('.cp-book-card').count()) === 0, 'no booking card before the details are confirmed');
await say('Yes, that is right. Marketing.');
const card = page.locator('.cp-book-card');
await card.waitFor({ timeout: 5000 }).catch(() => undefined);
const text = (await card.count()) ? await card.innerText() : '';
ok(text.includes('Pujan') && text.includes('pujan3645@gmail.com'), `the booking card shows the confirmed name and email ("${text.split('\n').join(' ')}")`);
const href = (await card.count()) ? await card.locator('a.cp-book-go').getAttribute('href') : '';
ok((href ?? '').includes('name=Pujan') && (href ?? '').includes('email=pujan3645%40gmail.com'), 'its button carries the name and email');
const box = (await card.count()) ? await card.boundingBox() : null;
ok(!!box && box.y >= 0 && box.y + box.height <= 800, 'the card is fully inside the screen');
await shot('3-booking-card');

await browser.close();
console.log(fails.length ? `\nFAILED: ${fails.length} check(s)` : '\nOK');
process.exit(fails.length ? 1 : 0);

/**
 * The copilot's tools that replaced the regex router: booking by voice as slots, stepping through a list, the tour, and a line for
 * someone else. The model decides when to call them; these checks are that the code around them holds the rules: a booking
 * button only after the name and the email were confirmed, "next" follows the page's list, the tour never repeats a stop.
 *
 * Runs against the compiled backend (pnpm --dir backend run build).
 */
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url);
let tools, state;
try {
  tools = await import(new URL('./backend/lib/copilot/tools.js', root).href);
  state = await import(new URL('./backend/lib/copilot/bookingState.js', root).href);
} catch {
  throw new Error('copilot tools: build the backend first (pnpm --dir backend run build)');
}
process.env.COPILOT_BOOKING_URL = 'https://cal.example/pujan';

const run = async (set, name, input = {}) => set[name].execute(input, { toolCallId: 't', messages: [] });
const make = (extra = {}) => {
  const actions = [];
  let flow = null;
  const tool = tools.makeTools((a) => actions.push(a), { canNavigate: true, voice: true, booking: { get: () => flow, set: (f) => { flow = f; } }, ...extra });
  return { tool, actions, flow: () => flow };
};

// 1. Booking: one tool per step; the code reads back before moving on and offers only the current step's tool.
{
  const { tool, actions, flow } = make();
  assert.deepEqual(state.bookingTools(null), ['booking_start']);
  assert.equal(tool.booking_finish, undefined, 'the button is not a tool the model can call');
  assert.equal((await run(tool, 'booking_start')).next, 'ask_name');
  assert.ok(actions.some((a) => a.kind === 'navigate' && a.path === '/contact' && a.go), 'starting the booking moves the page to Contact');
  assert.equal((await run(tool, 'booking_repeat')).next, 'ask_name', 'a line that is not an answer re-asks and stores nothing');
  assert.deepEqual(state.bookingTools(flow()), ['booking_give_name', 'booking_repeat', 'booking_cancel']);
  let r = await run(tool, 'booking_give_name', { name: 'Pujan' });
  assert.equal(r.next, 'confirm_name');
  assert.ok(r.say.includes('P, U, J, A, N'), 'the name is read back letter by letter');
  assert.deepEqual(state.bookingTools(flow()), ['booking_confirm_name', 'booking_repeat', 'booking_cancel']);
  r = await run(tool, 'booking_confirm_name', { correct: false, name: 'Pujon' });
  assert.equal(r.next, 'confirm_name', 'a corrected name is read back again');
  r = await run(tool, 'booking_confirm_name', { correct: true });
  assert.equal(r.next, 'ask_pronunciation');
  r = await run(tool, 'booking_give_pronunciation', { say: 'Poo-jun' });
  assert.equal(r.next, 'ask_email');
  r = await run(tool, 'booking_give_email', { email: 'Pujan3645@Gmail.com' });
  assert.equal(r.next, 'confirm_email');
  assert.ok(r.say.includes('P, U, J, A, N') && r.say.includes('gmail dot com'), r.say);
  assert.equal(actions.filter((a) => a.kind === 'book').length, 0, 'no button while the email is unconfirmed');
  r = await run(tool, 'booking_confirm_email', { correct: false, email: 'pujan@gmail.com' });
  assert.equal(r.next, 'confirm_email');
  r = await run(tool, 'booking_confirm_email', { correct: true });
  assert.equal(r.next, 'ask_area');
  assert.equal(actions.filter((a) => a.kind === 'book').length, 0, 'no button before the last step');
  r = await run(tool, 'booking_give_area', { area: 'Marketing' });
  assert.equal(r.ok, true, 'the last step shows the button');
  const book = actions.find((a) => a.kind === 'book');
  assert.ok(book && book.url.includes('name=Pujon') && book.url.includes('email=pujan%40gmail.com'), JSON.stringify(book));
  assert.equal(flow(), null, 'the flow ends after the button');
}

// 2. Cancel clears.
{
  const { tool, flow } = make();
  await run(tool, 'booking_start');
  await run(tool, 'booking_give_name', { name: 'Pujan' });
  await run(tool, 'booking_cancel');
  assert.equal(flow(), null);
}

// 3. Stepping through a list follows the page.
{
  const { tool, actions } = make({ page: { path: '/research/papers/db-r-2026-001' } });
  const r = await run(tool, 'step_list', { direction: 'next' });
  assert.equal(r.ok, true);
  assert.equal(actions.at(-1).path, '/research/papers/db-r-2026-002');
  const back = make({ page: { path: '/research/papers/db-r-2026-002' } });
  await run(back.tool, 'step_list', { direction: 'previous' });
  assert.equal(back.actions.at(-1).path, '/research/papers/db-r-2026-001');
  const none = make({ page: { path: '/contact' } });
  assert.equal((await run(none.tool, 'step_list', { direction: 'next' })).ok, false, 'a page in no list has no next');
}

// 3b. A summary is one step: the page's passages come back and the page follows them by itself.
{
  const { tool, actions } = make({ page: { path: '/research/papers/db-r-2026-010' } });
  const r = await run(tool, 'summarize_page');
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.ok(r.about.length > 40 && r.passages.length >= 1, 'it returns what the page is about and its passages');
  assert.equal(actions.filter((a) => a.kind === 'cite').length, r.passages.length, 'one pointer per passage, in order');
  assert.equal((await run(make({ page: { path: '/research' } }).tool, 'summarize_page')).ok, false, 'a list page is not summarised');
}

// 4. The tour skips what was already said.
{
  const first = make({ said: '' });
  const r1 = await run(first.tool, 'tour_next');
  assert.equal(r1.ok, true);
  const second = make({ said: `Let's start with ${r1.title}.` });
  const r2 = await run(second.tool, 'tour_next');
  assert.notEqual(r2.title, r1.title, 'the tour does not repeat a stop');
}

// 5. A line for someone else is reported to the route.
{
  let ignored = false;
  const { tool } = make({ notForMe: () => { ignored = true; } });
  await run(tool, 'not_for_me', { who: 'Campos' });
  assert.equal(ignored, true);
}

// 6. A chat reply's buttons: follow-up questions, and pages offered as buttons that move nothing until pressed (#221 lost them).
{
  const { tool, actions } = make({ voice: false });
  const r = await run(tool, 'suggest_followups', {
    questions: ['What is it built with?', 'Is there a demo?'],
    pages: [{ path: '/#work', label: 'See the work' }, { path: '/no-such-page', label: 'Nowhere' }],
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.left_out, ['/no-such-page'], 'a page that is not on the site is left out, and the model is told');
  assert.deepEqual(actions.filter((a) => a.kind === 'ask').map((a) => a.text), ['What is it built with?', 'Is there a demo?']);
  const pages = actions.filter((a) => a.kind === 'navigate');
  assert.deepEqual(pages.map((a) => a.path), ['/#work'], 'only the real page becomes a button');
  assert.equal(pages[0].go, undefined, 'a page button does not move the page');
  const again = await run(tool, 'suggest_followups', { questions: ['Anything else?'] });
  assert.equal(again.ok, false, 'one set of buttons per reply');
  assert.equal(actions.filter((a) => a.kind === 'ask').length, 2, 'a second call adds no buttons');
}

// 7. A message to Pujan: posted to the Apps Script with the token, through its redirect; unset or failing, a mailto link instead.
{
  const { createServer } = await import('node:http');
  const got = [];
  const server = createServer((req, res) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        got.push(JSON.parse(body));
        // Apps Script answers a POST with a 302 to where the result is read.
        res.writeHead(302, { location: '/result' }).end();
      });
    } else res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: got.at(-1)?.token === 'test-token' }));
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const msg = { name: 'Ada', email: 'ada@example.com', message: 'Hi Pujan, can we talk about voice agents?' };

  delete process.env.CONTACT_MAIL_URL;
  let { tool, actions } = make({ voice: false });
  let r = await run(tool, 'send_message', msg);
  assert.equal(r.ok, false, 'not set up: nothing is claimed as sent');
  assert.ok(actions.some((a) => a.kind === 'link' && a.url.startsWith('mailto:')), 'not set up: an email link instead');

  process.env.CONTACT_MAIL_URL = `http://127.0.0.1:${server.address().port}/exec`;
  process.env.CONTACT_MAIL_TOKEN = 'test-token';
  // No read-back in my last reply (or it named something else): nothing is sent, whatever the model says.
  ({ tool } = make({ voice: false }));
  r = await run(tool, 'send_message', msg);
  assert.equal(r.ok, false, 'no read-back: not sent');
  ({ tool } = make({ voice: false, lastReply: 'From Ada at ada@example.com: "Hi Pujan, can we talk about agents?" Send it?' }));
  assert.equal((await run(tool, 'send_message', msg)).ok, false, 'a different message was read back: not sent');
  assert.equal(got.length, 0);

  const readBack = 'Here it is, from Ada at ADA@example.com: \u201cHi Pujan, can we\n talk about voice agents?\u201d Shall I send it?';
  ({ tool } = make({ voice: false, page: { path: '/contact' }, lastReply: readBack }));
  r = await run(tool, 'send_message', msg);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.deepEqual(got.at(-1), { token: 'test-token', ...msg, page: '/contact' });
  assert.equal((await run(tool, 'send_message', msg)).ok, false, 'one message per reply');
  assert.equal(got.length, 1);

  process.env.CONTACT_MAIL_TOKEN = 'wrong';
  ({ tool, actions } = make({ voice: false, lastReply: readBack }));
  r = await run(tool, 'send_message', msg);
  assert.equal(r.ok, false, 'a refused token is a failure, not a sent message');
  assert.ok(actions.some((a) => a.kind === 'link'));
  server.close();
}

assert.equal(state.sayEmail('a.b_c@gmail.com'), 'A, dot, B, underscore, C, at gmail dot com');

// 9. Songs (TASK-DB-0160): asked first, the same ask is the same song, and nothing starts without the song maker.
{
  const songs = await import(new URL('./backend/lib/copilot/songs.js', root).href);
  assert.equal(tools.askedForStyle('What kind of song do you want, jazz or synth-pop?'), true);
  assert.equal(tools.askedForStyle('Here is a joke about transformers.'), false, 'no question about a song, so no song yet');
  assert.equal(tools.askedForStyle('Want to hear more about Precedent?'), false);
  const a = { style: 'Lo-fi Jazz', about: 'a moon that answers questions' };
  assert.equal(songs.songKey(a), songs.songKey({ style: 'lo-fi   jazz', about: 'A moon that answers questions!' }), 'spacing and case do not make a new song');
  assert.notEqual(songs.songKey(a), songs.songKey({ ...a, instrumental: true }));
  assert.match(songs.songPrompt(a), /No real people's names/);
  delete process.env.MUSIC_URL;
  let { tool, actions } = make({ voice: false, lastReply: 'What kind of song, and what about?', songs: { session: 's', exempt: false } });
  let r = await run(tool, 'make_song', a);
  assert.equal(r.ok, false, 'no song maker configured, no song');
  assert.equal(actions.length, 0);
  process.env.MUSIC_URL = 'http://127.0.0.1:9';
  process.env.OCTO_WORKSPACE_ID ||= 'w';
  process.env.OCTO_API_KEY ||= 'k';
  ({ tool, actions } = make({ voice: false, lastReply: 'Sure, here is a riddle.', songs: { session: 's', exempt: false } }));
  r = await run(tool, 'make_song', a);
  assert.equal(r.ok, false, 'the style was not asked yet');
  assert.match(r.note, /Ask them first/);
  assert.equal(actions.length, 0);
  delete process.env.MUSIC_URL;
}
console.log('copilot tools: booking steps, list stepping, tour, not_for_me, chat buttons, send_message, songs');

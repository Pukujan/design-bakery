/**
 * The copilot's instant answers (backend/src/copilot/answers.ts).
 *
 * These guard the trade the traces forced: the nine questions visitors actually open
 * with are answered without a model call, so they must be short, must point at real
 * pages, and must never hijack a follow-up that depends on the conversation.
 *
 * Runs against the compiled backend (pnpm --dir backend run build), because the source
 * imports its siblings with `.js` specifiers that Node's type stripping cannot resolve.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);

let cachedAnswer;
try {
  ({ cachedAnswer } = await import(new URL('./backend/lib/copilot/answers.js', root).href));
} catch {
  throw new Error('copilot instant answers: build the backend first (pnpm --dir backend run build)');
}

const pages = await readFile(new URL('./backend/src/copilot/knowledge.ts', root), 'utf8');

/** Every path an answer may navigate to: the site pages, or a real project/post/paper. */
const sitePaths = new Set(
  [...pages.matchAll(/\{ path: '([^']+)', label: '/g)].map((match) => match[1]),
);
const projects = JSON.parse(await readFile(new URL('./frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json', root), 'utf8'));
const projectPaths = new Set(projects.map((project) => `/work/${project.slug}`));

const firstTurn = [
  ['hi', 'greeting'],
  ['hello there', 'greeting'],
  ['what kind of AI do you build?', 'identity'],
  ['who is pujan', 'identity'],
  ['how do i contact pujan', 'contact'],
  ['give me a tour', 'tour'],
  ['show me around', 'tour'],
  ['what are some of his interesting blogs', 'blog'],
  ['show me your research', 'research'],
  ['what are his experiences', 'experience'],
  ['what has he built', 'projects'],
  ['book a free consultation', 'book'],
  ['thanks', 'thanks'],
];

for (const [question, expected] of firstTurn) {
  const answer = await cachedAnswer(question, true);
  assert.ok(answer, `"${question}" should be answered without a model call`);
  assert.equal(answer.intent, expected, `"${question}" should match ${expected}, got ${answer.intent}`);
  assert.ok(answer.text.length <= 240, `"${question}" answer is ${answer.text.length} chars; keep instant answers under 240`);
  assert.ok(answer.text.trim().length > 0, `"${question}" produced no text`);
  // A navigate action moves the page as soon as it arrives, so two of them make the
  // visitor watch the page jump twice. One move per answer, the rest as chips.
  const moves = answer.actions.filter((action) => action.kind === 'navigate');
  assert.ok(moves.length <= 1, `"${question}" emits ${moves.length} navigations; an instant answer may move the page once`);
  const links = new Set();
  for (const action of answer.actions) {
    if (action.kind === 'link') {
      assert.ok(!links.has(action.url), `"${question}" shows the same link twice (${action.url})`);
      links.add(action.url);
    }
    if (action.kind === 'navigate') {
      const path = action.path.split('#')[0] || '/';
      assert.ok(
        sitePaths.has(path) || projectPaths.has(path) || /^\/(blogs|research)(\/|$)/.test(path),
        `"${question}" navigates to ${action.path}, which is not a page on this site`,
      );
    }
  }
}

// A follow-up depends on the conversation, so only a near-exact match may be answered
// from the cache; these all have to reach the model.
const followUps = ['open', 'summarize that', 'the third one', 'what about the second', 'why?', 'more', 'hello??', 'hi'];
for (const followUp of followUps) {
  assert.equal(await cachedAnswer(followUp, false), null, `"${followUp}" must reach the model, not the cache`);
}

// The same questions on a later turn are still the same question.
assert.ok(await cachedAnswer('how do i contact pujan', false), 'an exact contact question should still be answered later in a conversation');

// Nothing invented: the contact answer carries the real address, and the tour points at
// the work section rather than a page that does not exist.
const contact = await cachedAnswer('contact', true);
assert.ok(contact.text.includes('pujan3645@gmail.com'), 'the contact answer should carry the real email');
const tour = await cachedAnswer('give me a tour', true);
assert.ok(tour.actions.some((action) => action.kind === 'navigate' && action.path === '/#work'), 'the tour should start at the work section');

console.log(`copilot instant answers: ${firstTurn.length} intents, ${followUps.length} follow-ups routed to the model`);

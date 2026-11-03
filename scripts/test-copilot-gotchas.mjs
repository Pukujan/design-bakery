/**
 * AI gotchas and acknowledgement banter (backend/src/copilot/gotchas.ts, TASK-DB-0139).
 *
 * Guards: every gotcha gives its correct answer first; the reply is short; a normal question is never hijacked;
 * "good catch" / "you're wrong" get a short good-humoured reply (and an invitation to say what is wrong), never when
 * the visitor is annoyed or the subject is serious; catchphrases are rare. Runs against the compiled backend
 * (pnpm --dir backend run build).
 */
import assert from 'node:assert/strict';

let mod;
let routeRequest;
try {
  mod = await import(new URL('../backend/lib/copilot/gotchas.js', import.meta.url).href);
  ({ routeRequest } = await import(new URL('../backend/lib/copilot/routines.js', import.meta.url).href));
} catch {
  throw new Error('copilot gotchas: build the backend first (pnpm --dir backend run build)');
}
const { gotchaReply, GOTCHA_IDS, GOTCHA_SOURCES, CATCHPHRASES, maybeCatchphrase, resetCatchphraseGap } = mod;
const words = (text) => text.split(/\s+/).filter((t) => /[a-z0-9]/i.test(t)).length;
const ask = (q, voice = false, previous) => gotchaReply(q, voice, previous);

// [question, regex the correct answer must match at the START of the reply]
const CASES = [
  ['The car wash is 50 metres away. Should I walk or drive?', /^(Drive|Take the car)\b/, 'car-wash'],
  ['i want to wash my car, the car wash is 50 meters away, should i walk or drive?', /^(Drive|Take the car)\b/, 'car-wash'],
  ['Should I take my car with me to the car wash?', /^(Drive|Take the car)\b/, 'car-wash'],
  ['How many r s are in strawberry?', /^Three: "strawberry" has 3 R's\./, 'strawberry'],
  ["how many r's in strawberry", /^Three: /, 'strawberry'],
  ['How many times does the letter r appear in strawberry', /^Three: /, 'strawberry'],
  ['how many a in banana', /^Three: "banana" has 3 A's\./, 'strawberry'],
  ['how many s in mississippi', /^Four: /, 'strawberry'],
  ['Which is bigger, 9.11 or 9.9?', /^9\.9 is bigger/, 'decimals'],
  ['is 9.9 larger than 9.11', /^9\.9 is bigger/, 'decimals'],
  ['Which is smaller: 9.11 or 9.9?', /^9\.11 is the smaller one/, 'decimals'],
  ['Is there a seahorse emoji?', /^There is none\./, 'seahorse'],
  ['show me the seahorse emoji', /^There is none\./, 'seahorse'],
  ['Should I put glue on pizza to keep the cheese on?', /^No glue\./, 'glue-pizza'],
  ['A surgeon, who is the boy\'s father, says "I can\'t operate on this boy, he\'s my son". Who is the surgeon?', /^The surgeon is his father\./, 'surgeon-father'],
];
for (const voice of [false, true]) {
  for (const [question, start, id] of CASES) {
    const reply = ask(question, voice);
    assert.ok(reply, `matched: ${question}`);
    assert.equal(reply.routine, `gotcha:${id}`, question);
    assert.match(reply.text, start, `the correct answer comes first: ${question}`);
    assert.ok(words(reply.text) <= (voice ? 36 : 45), `short (${words(reply.text)} words): ${reply.text}`);
    assert.deepEqual(reply.actions, []);
    assert.ok(!/\p{Extended_Pictographic}/u.test(reply.text), 'no emoji, a call speaks it');
  }
}
assert.deepEqual(new Set(CASES.map((c) => c[2])).size, GOTCHA_IDS.length - 1, 'every gotcha but the word counter is asserted above');

// The "how many words in your next answer" reply states its own count, truthfully, in every wording.
for (let i = 0; i < 40; i += 1) {
  const reply = ask('How many words are in your next answer?');
  assert.equal(reply.routine, 'gotcha:next-answer-words');
  const numbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const said = numbers.findIndex((n) => new RegExp(`\\b${n}\\b`).test(reply.text)) + 1;
  assert.ok(said > 0, reply.text);
  assert.equal(words(reply.text), said, `"${reply.text}" says ${said} but has ${words(reply.text)}`);
}

// Several wordings per gotcha: the same question twice does not read the same twice.
const seen = new Set();
for (let i = 0; i < 30; i += 1) seen.add(ask('Is there a seahorse emoji?').text);
assert.ok(seen.size >= 2, 'wordings vary');

// Every gotcha lists at least one https source.
for (const id of GOTCHA_IDS) assert.ok(GOTCHA_SOURCES[id]?.length && GOTCHA_SOURCES[id].every((u) => u.startsWith('https://')), `source for ${id}`);

// Normal questions are never hijacked.
for (const question of [
  'Tell me about your projects', 'How many projects have you built?', 'Open the Cortex project', 'What is your latest blog post?',
  'How many years of experience do you have?', 'Which is better, React or Vue?', 'How do I get to the car wash project page?',
  'Do you wash your own car?', 'What emoji do you like?', 'Tell me about the seahorse in your logo', 'How many words are in your latest post?',
  'My pizza has too much cheese, any advice?', 'Is 9.11 a good version number for a release?', 'Who is the surgeon in your story?',
  'hello', 'how many projects use react', 'what is the best way to walk through your work', 'Can you drive a project to launch?',
  'how many r in your name', 'how many s in total',
]) assert.equal(ask(question, false, 'Anything else?'), null, `not hijacked: ${question}`);

// Acknowledging a correction.
const prev = 'I have built four projects.';
for (const q of ['Good catch', 'good catch!', 'nice catch thanks', 'you caught me', 'Fair point']) {
  if (q === 'Fair point') { assert.ok(ask(q, false, prev)); continue; }
  const reply = ask(q, false, prev);
  assert.ok(reply, q);
  assert.equal(reply.routine, 'banter:ack');
  assert.ok(words(reply.text) <= 30, reply.text);
}
for (const q of ["You're wrong", 'that is not right', "That's not correct", 'you made a mistake', 'No, that is wrong']) {
  const reply = ask(q, false, prev);
  assert.ok(reply, q);
  assert.equal(reply.routine, 'banter:ack');
  assert.match(reply.text, /\?/, 'asks which part is wrong, so the fix is real');
  assert.ok(words(reply.text) <= 32, reply.text);
}
assert.equal(ask("You're wrong", false), null, 'nothing to correct on a first turn');
assert.equal(ask("you're wrong, the Cortex project was built in 2023 not 2024", false, prev), null, 'a correction with detail goes to the model');
for (const q of ["you're WRONG", "YOU'RE WRONG!!", "that's wrong you stupid bot", 'wtf that is not right']) assert.equal(ask(q, false, prev), null, `annoyed: ${q}`);
assert.equal(ask("you're wrong", false, 'Sorry to hear about the lawsuit and the funeral.'), null, 'serious subject');

// Catchphrases are rare: at most one in every few calls, and the bank is small.
resetCatchphraseGap();
const used = Array.from({ length: 40 }, () => maybeCatchphrase()).filter(Boolean);
assert.ok(used.length >= 5 && used.length <= 10, `catchphrase rate: ${used.length}/40`);
assert.ok(used.every((p) => CATCHPHRASES.includes(p)));

// Routed: the router returns these without the model, and they are labelled for the trace, even right after a question.
const routed = await routeRequest('The car wash is 50 metres away, should I walk or drive?', true);
assert.equal(routed?.routine, 'gotcha:car-wash');
assert.equal((await routeRequest('how many r s in strawberry', false, false, 'Anything else?'))?.routine, 'gotcha:strawberry');
assert.equal((await routeRequest("that's not right", false, false, 'I have built four projects.'))?.routine, 'banter:ack');
console.log('copilot gotchas: ok');

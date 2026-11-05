/**
 * The voice booking flow (backend/src/copilot/bookingFlow.ts): explicit state, a reader per answer. The reader is a stub here, so the
 * steps, the state and what is said are tested without a model; scripts/sim/scenarios/booking-*.json test the real model reading.
 * Built from the call of 2026-11-05 (04:49 to 04:57 UTC), where the first, regex-and-history version lost its place.
 */
import assert from 'node:assert/strict';

const { parseEmail, parseName, parseSpelled, parseSay, sayEmail } = await import(new URL('../backend/lib/copilot/booking.js', import.meta.url).href);
const { bookingFlow, fastReading, readerWith } = await import(new URL('../backend/lib/copilot/bookingFlow.js', import.meta.url).href);
const BASE = 'https://cal.example/book';

// ---- the regex parsers, now the fallback reader's words
assert.equal(parseName('Poojan.'), 'Poojan');
assert.equal(parseName('my name is poojan bajracharya'), 'Poojan Bajracharya');
assert.equal(parseSpelled('P U J A N'), 'Pujan');
assert.equal(parseSpelled('P, U, J, A, N.'), 'Pujan');
assert.equal(parseSpelled('Pujan'), null);
assert.equal(parseEmail('Poojan three six four five at gmail dot com'), 'poojan3645@gmail.com');
assert.equal(parseEmail("It's Teresa, T E R E S A G U A J A R D O one five oh four at gmail.com"), 'teresaguajardo1504@gmail.com', '"oh" next to digits is a zero');
assert.equal(parseEmail('pujan3645@gmail.com'), 'pujan3645@gmail.com');
assert.equal(parseEmail('no email here'), null);
assert.equal(parseSay('poo jun', 'Pujan'), 'Poo-jun');
assert.equal(parseSay("it's fine as spelled", 'Pujan'), 'Pujan');
assert.equal(sayEmail('pujan3645@gmail.com'), 'P, U, J, A, N, 3, 6, 4, 5, at gmail dot com');

// ---- the fast path: a bare yes or no and a one-word name need no model
assert.deepEqual(fastReading('confirm_name', 'Yes.'), { verdict: 'yes' });
assert.deepEqual(fastReading('confirm_email', 'No'), { verdict: 'no' });
assert.equal(fastReading('confirm_name', "That's P-U-J-A-N."), null, 'a spelling is not a yes: the reader decides');
assert.deepEqual(fastReading('name', 'Poojan.'), { verdict: 'answer', name: 'Poojan' });
assert.equal(fastReading('name', 'I just told you the name'), null);
assert.deepEqual(fastReading('email', 'never mind'), { verdict: 'cancel' });

// ---- a scripted reader: each entry is what the model would say for the next line
function scripted(readings) {
  const queue = [...readings];
  return async () => queue.shift() ?? { verdict: 'other' };
}
async function play(lines, reader) {
  let flow = null;
  const turns = [];
  for (const line of lines) {
    const t = await bookingFlow(flow, line, { interpret: reader, bookingBase: BASE });
    turns.push(t);
    flow = t.flow;
  }
  return turns;
}

// not booking, or no booking page: nothing starts
assert.equal((await bookingFlow(null, 'what is cortex', { interpret: scripted([]), bookingBase: BASE })).answer, null);
assert.equal((await bookingFlow(null, 'book the call', { interpret: scripted([]), bookingBase: undefined })).answer, null);
assert.equal((await bookingFlow(null, 'tell me about the book you wrote', { interpret: scripted([]), bookingBase: BASE })).answer, null);

// the happy path, with the state explicit at every step
const happy = await play(['Okay, book the call.', 'Poojan', 'yes', 'poo jun', 'poojan3645 at gmail dot com', 'yes, marketing'], scripted([
  { verdict: 'answer', name: 'Poojan' }, { verdict: 'yes' }, { verdict: 'answer', say: 'Poo-jun' }, { verdict: 'answer', email: 'poojan3645@gmail.com' }, { verdict: 'yes', area: 'Marketing' },
]));
assert.equal(happy[0].answer.go, true); assert.equal(happy[0].answer.actions[0].path, '/contact');
assert.deepEqual(happy.map((t) => t.flow?.step ?? null), ['name', 'confirm_name', 'say', 'email', 'confirm_email', null]);
assert.match(happy[1].answer.text, /I heard Poojan, spelled P, O, O, J, A, N\. Is that right\?/);
assert.match(happy[2].answer.text, /How do you say your name\?/);
assert.match(happy[3].answer.text, /Thanks, Poo-jun\. What's your email/);
assert.match(happy[4].answer.text, /P, O, O, J, A, N, 3, 6, 4, 5, at gmail dot com\. Is that right\?/);
for (const early of happy.slice(0, 5)) assert.equal(early.answer.actions.some((a) => a.kind === 'book'), false, 'no booking before the details are confirmed');
const book = happy[5].answer.actions[0];
assert.deepEqual([book.kind, book.name, book.email, book.topic], ['book', 'Poojan', 'poojan3645@gmail.com', 'Marketing']);
assert.match(book.url, /name=Poojan&email=poojan3645%40gmail\.com&notes=Marketing/);
assert.match(happy[5].answer.text, /with Poo-jun and your email/);

// a spelling given instead of a yes corrects the name and it is read back (the call: "That's P-U-J-A-N" had counted as a yes)
const fixName = await play(['book the call', 'Poojan', "That's P-U-J-A-N"], scripted([{ verdict: 'answer', name: 'Poojan' }, { verdict: 'correction', name: 'Pujan' }]));
assert.equal(fixName[2].flow.data.name, 'Pujan'); assert.equal(fixName[2].flow.step, 'confirm_name');
assert.match(fixName[2].answer.text, /I heard Pujan, spelled P, U, J, A, N\. Is that right\?/);

// a whole corrected email given instead of a no is taken (the call: it answered "yes or no?" and lost the place)
const fixMail = await play(['book the call', 'Pujan', 'yes', 'fine as spelled', 'teresagohardo at gmail.com', "it's teresaguajardo1504 at gmail.com"], scripted([
  { verdict: 'answer', name: 'Pujan' }, { verdict: 'yes' }, { verdict: 'yes' }, { verdict: 'answer', email: 'teresagohardo@gmail.com' }, { verdict: 'correction', email: 'teresaguajardo1504@gmail.com' },
]));
assert.equal(fixMail[5].flow.data.email, 'teresaguajardo1504@gmail.com'); assert.equal(fixMail[5].flow.step, 'confirm_email');

// a no asks again, in the same step: the place is kept, "Book the call." mid-flow does not start over
const no = await play(['book the call', 'Pujan', 'yes', 'ok', 'a@b.co', 'no', 'Book the call.'], scripted([
  { verdict: 'answer', name: 'Pujan' }, { verdict: 'yes' }, { verdict: 'yes' }, { verdict: 'answer', email: 'a@b.co' }, { verdict: 'no' }, { verdict: 'other' },
]));
assert.equal(no[5].flow.step, 'email'); assert.match(no[5].answer.text, /Say the whole address again/);
assert.equal(no[6].flow.step, 'email', 'the flow stays where it was'); assert.match(no[6].answer.text, /Sorry, I didn't catch that\. Thanks, Pujan\. What's your email/);
assert.equal(no[6].flow.data.name, 'Pujan', 'and nothing already given is asked again');

// a line that is not an answer twice leaves the flow: the router and the model take it
const leaves = await play(['book the call', 'what does cortex do', 'what does cortex do'], scripted([{ verdict: 'other' }, { verdict: 'other' }]));
assert.equal(leaves[1].flow.step, 'name'); assert.equal(leaves[1].flow.data.tries, 1);
assert.equal(leaves[2].answer, null); assert.equal(leaves[2].flow, null);

// a sentence is not a name ("I just told you the name")
const sentence = await play(['book the call', 'I just told you the name'], scripted([{ verdict: 'answer', name: 'Just Told You Already' }]));
assert.equal(sentence[1].flow.step, 'name', 'four words are not a name'); assert.match(sentence[1].answer.text, /didn't catch/);

// cancel at any step ends it
const cancel = await play(['book the call', 'Pujan', 'never mind'], scripted([{ verdict: 'answer', name: 'Pujan' }, { verdict: 'cancel' }]));
assert.equal(cancel[2].flow, null); assert.match(cancel[2].answer.text, /No problem/);

// the model is down: the regex reader carries the same flow
const fallback = readerWith(async () => { throw new Error('down'); });
const offline = await play(['book the call', 'Pujan', "That's P-U-J-A-N", 'yes', 'fine as spelled', 'pujan three six four five at gmail dot com', 'yes marketing'], fallback);
assert.equal(offline[6].answer.actions[0].email, 'pujan3645@gmail.com');
assert.equal(offline[6].answer.actions[0].name, 'Pujan', 'the spelling was taken as a correction, not a yes');

console.log('copilot booking: parsers, fast path, flow state, corrections, leaving, cancel and the offline reader ok');

/**
 * On a call, a line that calls someone by another name is asked about; every other line is answered without asking
 * (backend/src/copilot/addressee.ts). Runs against the compiled backend (pnpm --dir backend run build).
 */
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url);
const { otherName, saidToMe } = await import(new URL('./backend/lib/copilot/addressee.js', root).href);

const named = {
  'Hey Campos, can you grab me a coffee?': 'Campos',
  'Hey Campos!': 'Campos',
  'hey Campos can you grab the door': 'Campos',
  'Campos, the oven is on.': 'Campos',
  'Can you pass me the remote, Maria?': 'Maria',
  'Hey Siri, set a timer.': 'Siri',
  'Okay Alexa, stop.': 'Alexa',
};
const unnamed = [
  // 2026-11-05: lines the recogniser capitalises read as a call to someone named Next, Research, Poojan; they were silently dropped.
  'Next.', 'Previous.', 'Research.', 'Marketing.', 'Poojan.', 'Yes.', 'Go on.', 'Next one.', 'Next, show me the blog', 'Research is interesting.',
  'Hey Pujan, what are you working on?',
  'Hi Pooja, how are you?',
  'Thanks, Pujan.',
  'Hey AI, tell me a joke.',
  'Hey there!',
  'Hi, what are you working on these days?',
  'Okay, tell me more.',
  'Sorry, my roommate is chatty. Where were we?',
  'What do you think of Elon Musk?',
  'I met Campos at a conference, he was great.',
  'Hey, can you show me your projects?',
  'hey you',
  'Yes.',
  'Really, man?',
  'So what is RAG, exactly?',
];
for (const [line, name] of Object.entries(named)) assert.equal(otherName(line), name, line);
for (const line of unnamed) assert.equal(otherName(line), null, line);

// Only a named line reaches the model, and any doubt answers the line.
let asked = 0;
const no = async () => { asked += 1; return 'No.'; };
assert.deepEqual(await saidToMe('What kind of music do you like?', undefined, no), { toMe: true, name: null, asked: false });
assert.equal(asked, 0);
assert.equal((await saidToMe('Hey Campos, grab me a coffee?', 'Mostly voice agents.', no)).toMe, false);
assert.equal((await saidToMe('Hey Campos, grab me a coffee?', undefined, async () => 'Yes')).toMe, true);
assert.equal((await saidToMe('Hey Campos, grab me a coffee?', undefined, async () => { throw new Error('down'); })).toMe, true);
assert.equal((await saidToMe('Hey Campos, grab me a coffee?', undefined, (_p, signal) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('slow')))), 50)).toMe, true);
assert.equal((await saidToMe('Hey Campos, grab me a coffee?', undefined, async () => 'Not sure')).toMe, true);

console.log(`copilot addressee: ${Object.keys(named).length} named lines, ${unnamed.length} unnamed, 5 answers`);

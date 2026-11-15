/**
 * The chat's replies read aloud (TASK-DB-0165): what is read (no markdown, links or emoji), what is left unspoken, the WAV
 * the API serves, and that a registered reply is synthesised once by the speech gateway and then served from memory.
 * Runs against the compiled backend (pnpm --dir backend run build) and a fake speech gateway on a local port.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

const root = new URL('..', import.meta.url);

// A fake gateway: one second of silence per /tts, counting the calls and the project header.
const seen = [];
const gateway = createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    seen.push({ path: req.url, project: req.headers['x-speech-project'], body: JSON.parse(body || '{}') });
    res.writeHead(200, { 'content-type': 'audio/L16' });
    res.end(Buffer.alloc(48_000));
  });
});
await new Promise((resolve) => gateway.listen(0, '127.0.0.1', resolve));
process.env.SPEECH_GATEWAY_URL = `http://127.0.0.1:${gateway.address().port}/`;
delete process.env.OCTO_WORKSPACE_ID;
delete process.env.OCTO_API_KEY;

const speech = await import(new URL('./backend/lib/copilot/speech.js', root).href);

// What is read aloud.
assert.equal(speech.spokenText('**Riley** calls [nurses](/work/riley) back.\n\n- Fast\n- Kind 🙂'), 'Riley calls nurses back. Fast Kind');
assert.equal(speech.spokenText('See https://example.com/x for more.'), 'See for more.');
assert.ok(speech.spokenText('a'.repeat(5000)).length <= 1200, 'capped');
assert.equal(speech.speakable('Hello there.'), true);
assert.equal(speech.speakable('こんにちは、元気ですか'), false, 'the English voice does not read another script');
assert.equal(speech.speakable('🙂'), false);

// Same words, same clip; other words, another.
assert.equal(speech.speechId('Hi.'), speech.speechId('Hi.'));
assert.notEqual(speech.speechId('Hi.'), speech.speechId('Hi!'));
assert.match(speech.speechId('Hi.'), /^[0-9a-f]{32}$/);

// The WAV header: 24 kHz, mono, 16-bit, sizes right.
const wav = speech.wav(Buffer.alloc(480));
assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
assert.equal(wav.readUInt32LE(24), 24_000);
assert.equal(wav.readUInt16LE(22), 1);
assert.equal(wav.readUInt32LE(40), 480);
assert.equal(wav.byteLength, 524);

// A registered reply is made once, at registration, and served from memory after.
const reply = 'Riley calls nurse applicants and makes sure each one hears back.';
const first = await speech.registerReply(reply);
assert.ok(first && first.id === speech.speechId(speech.spokenText(reply)));
const [a, b] = await Promise.all([speech.clipFor(first.id), speech.clipFor(first.id)]);
assert.ok(a && b && a.byteLength === 48_044, 'one second of audio in a WAV');
assert.equal(seen.length, 1, 'synthesised once for two requests');
assert.equal(seen[0].path, '/tts');
assert.equal(seen[0].project, 'design-bakery');
assert.deepEqual(seen[0].body, { text: reply, stack: 'english-fast', lang: 'en' });
const again = await speech.registerReply(reply);
assert.deepEqual(again, { id: first.id, ready: true }, 'ready the second time');
assert.equal(seen.length, 1, 'not made again');

// A new reply of several sentences is a clip a sentence or two, made in order; the whole-reply id still works for a page
// from before the change, and is only made when asked for.
assert.deepEqual(speech.sentenceParts('Hi.'), ['Hi.']);
const long = 'Riley is a phone screener for nurse applicants, and it calls every one of them back. A recruiter reads the result and decides what happens next. Riley never rejects anyone. Ok.';
const cut = speech.sentenceParts(long);
assert.equal(cut.length, 3, 'a short sentence rides with its neighbour');
assert.equal(cut.join(' '), long, 'nothing lost in the cutting');
assert.ok(cut.every((part) => part.length >= 25));
assert.deepEqual(speech.sentenceParts('It costs 2.5 dollars at 9.11 a.m. today, which is fine by me and by everyone else here.'), ['It costs 2.5 dollars at 9.11 a.m. today, which is fine by me and by everyone else here.'], 'a dot inside a number is not an end');
const before = seen.length;
const parted = await speech.registerReply(long);
assert.ok(parted && parted.ready === false && parted.parts?.length === 3);
assert.equal(parted.id, speech.speechId(speech.spokenText(long)));
assert.deepEqual(parted.parts.map((part) => part.id), cut.map(speech.speechId));
const clips = await Promise.all(parted.parts.map((part) => speech.clipFor(part.id)));
assert.ok(clips.every((clip) => clip && clip.byteLength === 48_044));
assert.equal(seen.length, before + 3, 'one synthesis a part, none for the whole');
assert.deepEqual(seen.slice(before).map((call) => call.body.text), cut, 'made in order, first sentence first');
assert.ok(await speech.clipFor(parted.id), 'the whole reply is made for a page that asks by its id');
assert.equal(seen.length, before + 4);
const partedAgain = await speech.registerReply(long);
assert.ok(partedAgain.ready && !partedAgain.parts, 'once the whole is kept, it is one ready clip');

assert.deepEqual(
  speech.sentenceParts('In short: I take a product from the first question to running in production — research, design, front end, back end and AI, on servers I run.'),
  ['In short: I take a product from the first question to running in production —', 'research, design, front end, back end and AI, on servers I run.'],
  'a long opening sentence starts speaking at its first pause',
);

// Only ids /chat handed out (or clips kept) are served: no "say anything".
assert.equal(await speech.clipFor('0'.repeat(32)), null);
assert.equal(await speech.clipFor('../etc'), null);
assert.equal(await speech.registerReply('🙂'), null, 'nothing to say, no id');

// The summary cache is off without Octo, and never fails the turn.
assert.equal(await speech.keptSummary('/work/riley'), null);
await speech.keepSummary('/work/riley', { text: 'x', actions: [] });

gateway.close();
console.log('copilot speech: ok');

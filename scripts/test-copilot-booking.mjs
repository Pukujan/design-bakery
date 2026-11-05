/**
 * The voice booking dialogue's parsers and state machine (backend/src/copilot/booking.ts, TASK-DB-0137).
 * Built from the call of 2026-11-05, where "Fo John" became the name John unchecked and "Poojan three six four five at gmail dot
 * com" was never read back. Runs against the compiled backend (pnpm --dir backend exec tsc).
 */
import assert from 'node:assert/strict';

const { parseName, parseSpelled, parseEmail, parseSay, sayEmail, bookingTurn } = await import(new URL('../backend/lib/copilot/booking.js', import.meta.url).href);
const BASE = 'https://cal.example/book';

// Names: the filler words go, a few words stay, a sentence is not a name.
assert.equal(parseName('Poojan.'), 'Poojan');
assert.equal(parseName('my name is poojan bajracharya'), 'Poojan Bajracharya');
assert.equal(parseName("it's Fo John"), 'Fo John');
assert.equal(parseName('call me Pujan please'), 'Pujan');
assert.equal(parseName('I would like to talk about my AI project tomorrow'), null, 'a sentence is not a name');
assert.equal(parseName('three six four five'), null, 'digits are not a name');

// How a name is said: the syllables the caller gives, hyphenated for the voice; "as spelled" keeps the name.
assert.equal(parseSay('poo jun', 'Pujan'), 'Poo-jun');
assert.equal(parseSay('Poo-jun', 'Pujan'), 'Poo-jun');
assert.equal(parseSay("it's pronounced poo jahn", 'Pujan'), 'Poo-jahn');
assert.equal(parseSay("it's fine as spelled", 'Pujan'), 'Pujan');
assert.equal(parseSay('just say it normally', 'Pujan'), 'Pujan');
assert.equal(parseSay('well it is a long story about my family and where it comes from', 'Pujan'), null, 'a story is not syllables');
assert.equal(parseSay('', 'Pujan'), null);

// Spelled letters.
assert.equal(parseSpelled('P U J A N'), 'Pujan');
assert.equal(parseSpelled('p-u-j-a-n'), 'Pujan');
assert.equal(parseSpelled('P, U, J, A, N.'), 'Pujan');
assert.equal(parseSpelled('Pujan'), null, 'a whole word is not spelled');

// Emails, as the speech recogniser writes them.
assert.equal(parseEmail('Poojan three six four five at gmail dot com'), 'poojan3645@gmail.com');
assert.equal(parseEmail('my email is pujan 3645 at gmail dot com thanks'), 'pujan3645@gmail.com');
assert.equal(parseEmail('P U J A N three six four five at gmail dot com'), 'pujan3645@gmail.com');
assert.equal(parseEmail('first dot last at my company dot io'), 'first.last@mycompany.io');
assert.equal(parseEmail('pujan underscore b at outlook dot com'), 'pujan_b@outlook.com');
assert.equal(parseEmail('pujan3645@gmail.com'), 'pujan3645@gmail.com');
assert.equal(parseEmail('no email here'), null);
assert.equal(parseEmail('poojan at gmail'), null, 'no top-level domain');

// Read back letter by letter, well-known domains as words.
assert.equal(sayEmail('pujan3645@gmail.com'), 'P, U, J, A, N, 3, 6, 4, 5, at gmail dot com');
assert.equal(sayEmail('a.b@acme.io'), 'A, dot, B, at A, C, M, E, dot, I, O');

// The dialogue. `play` runs the caller's lines and returns each turn's answer.
function play(lines) {
  const messages = [];
  const answers = [];
  for (const say of lines) {
    messages.push({ role: 'user', content: say });
    const a = bookingTurn(messages, BASE);
    answers.push(a);
    messages.push({ role: 'assistant', content: a ? a.text : '(model)' });
  }
  return answers;
}

// Not booking, or no booking page: the dialogue stays out of it.
assert.equal(bookingTurn([{ role: 'user', content: 'what is cortex' }], BASE), null);
assert.equal(bookingTurn([{ role: 'user', content: 'book the call' }], undefined), null, 'nothing to book into');
assert.equal(bookingTurn([{ role: 'user', content: 'tell me about the book you wrote' }], BASE), null);

const happy = play(['Okay, book the call.', 'Poojan.', 'Yes.', 'poo jun', 'Poojan three six four five at gmail dot com.', 'Yes that is right. Marketing.']);
assert.equal(happy[0].go, true, 'the first turn moves to the contact page');
assert.equal(happy[0].actions[0].path, '/contact');
assert.match(happy[0].text, /What name should I put it under/);
assert.match(happy[1].text, /I heard Poojan, spelled P, O, O, J, A, N\. Is that right\?/);
assert.match(happy[2].text, /How do you say your name\?/);
assert.match(happy[3].text, /Thanks, Poo-jun\. What's your email/, 'the name is said the way the caller said it');
assert.match(happy[4].text, /P, O, O, J, A, N, 3, 6, 4, 5, at gmail dot com\. Is that right\?/);
for (const early of happy.slice(0, 5)) assert.equal(early.actions.some((a) => a.kind === 'book'), false, 'no booking before the details are confirmed');
const book = happy[5].actions[0];
assert.equal(book.kind, 'book');
assert.equal(book.name, 'Poojan');
assert.equal(book.email, 'poojan3645@gmail.com');
assert.equal(book.topic, 'Marketing');
assert.match(book.url, /name=Poojan&email=poojan3645%40gmail\.com&notes=Marketing/);
assert.match(happy[5].text, /with Poo-jun and your email/, 'the closing line says the name the way it was given');
assert.equal(book.name, 'Poojan', 'the booking itself keeps the written name');

// A no spells it again: "Fo John" is corrected by the letters, and a wrong address by saying it again.
const fixed = play(['I want to book a consultation', 'Fo John.', 'No.', 'P U J A N.', 'Yes it is.', "it's fine as spelled", 'poojan three six four five at gmail dot com', "No, that's wrong", 'P U J A N three six four five at gmail dot com', 'Yes, product design']);
assert.match(fixed[1].text, /spelled F, O, J, O, H, N/);
assert.match(fixed[2].text, /Spell your name for me/);
assert.match(fixed[3].text, /I heard Pujan, spelled P, U, J, A, N/);
assert.match(fixed[4].text, /How do you say your name\?/);
assert.match(fixed[5].text, /Thanks, Pujan\./, 'as spelled keeps the name');
assert.match(fixed[7].text, /Say the whole address again/);
assert.match(fixed[8].text, /P, U, J, A, N, 3, 6, 4, 5/);
assert.equal(fixed[9].actions[0].email, 'pujan3645@gmail.com');
assert.equal(fixed[9].actions[0].name, 'Pujan');

// The area can come later, and an unclear line is asked again, not guessed.
const later = play(['book the call', 'Pujan', 'yes', 'poo jun', 'pujan3645 at gmail dot com', 'yes']);
assert.match(later[5].text, /Which area should the call cover/);
assert.equal(later[5].actions.length, 0);
assert.equal(bookingTurn([...[
  ['user', 'book the call'], ['assistant', happy[0].text], ['user', 'Pujan'], ['assistant', later[1].text], ['user', 'yes'], ['assistant', later[2].text],
  ['user', 'poo jun'], ['assistant', later[3].text], ['user', 'pujan3645 at gmail dot com'], ['assistant', later[4].text], ['user', 'yes'], ['assistant', later[5].text], ['user', 'marketing'],
].map(([role, content]) => ({ role, content }))], BASE).actions[0].topic, 'Marketing');
const lost = play(['book the call', 'um']);
assert.match(lost[1].text, /did not catch that/i, 'an empty answer is asked again');

// An unclear answer to "how do you say it" is asked once more, then the name is used as written and the dialogue goes on.
const unclear = play(['book the call', 'Pujan', 'yes', 'um', 'hmm']);
assert.match(unclear[3].text, /did not catch that\. How do you say your name\?/);
assert.match(unclear[4].text, /Thanks, Pujan\./);

// Cancelling stops it.
const cancel = play(['book the call', 'never mind']);
assert.match(cancel[1].text, /No problem/);

console.log('copilot booking: names, spelling, emails and the dialogue ok');

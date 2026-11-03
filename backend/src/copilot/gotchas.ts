/**
 * AI "gotcha" moments and acknowledgement banter (TASK-DB-0139): the famous trick questions chatbots are teased
 * about, answered correctly and instantly with one dry line, and a short good-humoured reply when a visitor
 * points out a mistake. No model call, no site data.
 *
 * Rules for every entry:
 * - the correct answer comes first; the joke is about the trap, never at the visitor, a person or a company;
 * - an item is here only when a public source documents it (the `source` URLs, also listed in tasks/TASK-DB-0139-*.md);
 * - the joke says "famously" or "reportedly" only where those sources support it, and never claims what a model does today;
 * - short: the answer plus one line; `detail` is dropped on a voice call.
 * Fresh gotchas from the daily news job (kinds blunder and meme, two reputable sources) reach the model through its
 * brief; they are never added here without a source being checked by hand.
 */
import { norm, vary, type CachedAnswer } from './answers.js';

type Gotcha = {
  id: string;
  /** Cheap synchronous match on the raw sentence and its normalised form. */
  test: (raw: string, q: string) => boolean;
  /** Builds the reply parts. `answer` is the correct answer; `detail` is optional extra that a call leaves out. */
  build: (raw: string, q: string) => { answer: string[]; detail?: string[]; joke?: string[] } | null;
  /** Public sources that document the trap. */
  source: string[];
};

const MAX_WORDS = 40;
const wordCount = (text: string) => text.split(/\s+/).filter((token) => /[a-z0-9]/i.test(token)).length;

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

/** A sentence that states its own word count, truthfully: the first number word that makes the count come out right. */
function selfCounting(template: string): string {
  for (let n = 1; n < NUMBER_WORDS.length; n += 1) {
    const text = template.replace('{n}', NUMBER_WORDS[n]);
    if (wordCount(text) === n) return text;
  }
  throw new Error(`no self-consistent word count for: ${template}`);
}
const SELF_COUNTING = [
  'There are {n} words in this answer. I counted ahead.',
  'This answer is {n} words long, as planned.',
  'Count them: exactly {n} words, no guessing.',
  'Exactly {n} words, and I checked before saying so.',
].map(selfCounting);

const STOP_WORDS = new Set(['your', 'my', 'the', 'total', 'all', 'there', 'this', 'that', 'here', 'what', 'work', 'projects']);
const LETTER_COUNT = /^(?:hey |hi |ok |so |quick question )?how many (?:times does )?(?:the )?(?:letters? )?([a-z]) ?(?:s|es)?(?: letters?)? (?:are |is )?(?:there )?(?:appear |appears |occur |occurs )?(?:in|are in|is in) (?:the |a )?(?:word )?([a-z]{3,25})$/;

const GOTCHAS: Gotcha[] = [
  {
    id: 'car-wash',
    test: (_raw, q) => /\bcar ?wash\b/.test(q) && /\b(walk|drive|driving|walking|take my car|bring my car|take the car|leave my car)\b/.test(q) && q.split(' ').length <= 45,
    build: () => ({
      answer: ['Drive. The car is the thing getting washed, so it has to come with you.', 'Take the car. A wash needs the car in it, so it comes along.'],
      joke: [
        'Walking there without it is a lovely stroll and a very clean you.',
        'It went viral as a chatbot logic trap. The short distance is the bait.',
        'Short distance, tempting to walk, wrong. Good trap.',
      ],
    }),
    source: ['https://opper.ai/ai-roundtable/questions/i-need-to-wash-my-car-the-car-wash-is-50-meters-away-should-0fc80ac9'],
  },
  {
    id: 'strawberry',
    test: (_raw, q) => LETTER_COUNT.test(q),
    build: (_raw, q) => {
      const match = LETTER_COUNT.exec(q);
      if (!match) return null;
      const [, letter, word] = match;
      if (STOP_WORDS.has(word)) return null;
      const count = [...word].filter((char) => char === letter).length;
      const said = count <= 10 ? NUMBER_WORDS[count] : String(count);
      const lead = `${said.charAt(0).toUpperCase()}${said.slice(1)}: "${word}" has ${count} ${letter.toUpperCase()}${count === 1 ? '' : "'s"}.`;
      if (word === 'strawberry') {
        return {
          answer: [lead],
          joke: ['The word that famously trips up chatbots, because they read chunks of text, not letters.', 'Famously a chatbot stumper, since models see chunks of a word, not its letters. I count letter by letter.'],
        };
      }
      return { answer: [lead], joke: ['Counted letter by letter, which is cheating if you are a chatbot.', 'I counted them one at a time, the old-fashioned way.'] };
    },
    source: ['https://venturebeat.com/technology/the-strawberrry-problem-how-to-overcome-ais-limitations', 'https://arxiv.org/html/2412.18626v1'],
  },
  {
    id: 'decimals',
    test: (raw) => /\b9\.11\b/.test(raw) && /\b9\.9(?:0)?\b/.test(raw) && /\b(bigger|larger|greater|higher|more|smaller|lower|less)\b/i.test(raw) && raw.split(/\s+/).length <= 30,
    build: (raw) => {
      const smaller = /\b(smaller|lower|less)\b/i.test(raw);
      return {
        answer: [smaller ? '9.11 is the smaller one. 9.9 is the same as 9.90, which beats 9.11.' : '9.9 is bigger. It is 9.90, which beats 9.11.'],
        detail: ['Ninety hundredths against eleven hundredths.'],
        joke: [
          'A reported chatbot stumper in 2024: 9.11 reads like a version number, where it does come later.',
          'Decimals are not version numbers, which is the whole trap.',
        ],
      };
    },
    source: ['https://thestar.com.my/tech/tech-news/2024/07/18/maths-test-stumps-ai-models-which-number-is-bigger-990-or-911', 'https://towardsdatascience.com/9-11-or-9-9-which-one-is-higher-6efbdbd6a025'],
  },
  {
    id: 'seahorse',
    test: (_raw, q) => /\bseahorse\b/.test(q) && /\bemoji\b/.test(q) && q.split(' ').length <= 20,
    build: () => ({
      answer: ['There is none. Unicode has never had one, though plenty of people remember it.'],
      joke: [
        'It reportedly sent a chatbot into a loop of wrong emoji. Very human confidence.',
        'A shared false memory, and reportedly a chatbot meltdown.',
      ],
    }),
    source: ['https://futurism.com/?p=363621', 'https://www.bluewin.ch/en/news/switzerland/seahorse-emoji-the-web-remembers-a-phantom-2813566.html'],
  },
  {
    id: 'glue-pizza',
    test: (_raw, q) => /\bglue\b/.test(q) && /\bpizza\b/.test(q) && /\b(cheese|sauce|stick|slide|should|put|add|use)\b/.test(q) && q.split(' ').length <= 25,
    build: () => ({
      answer: ['No glue. Go lighter on the sauce and let it cool a few minutes.'],
      joke: [
        'That tip reportedly came from an old forum joke, via a 2024 search summary. Not every source is a recipe.',
        'A 2024 search summary famously suggested it, reportedly from a forum post. Nobody ordered that topping.',
      ],
    }),
    source: ['https://www.engadget.com/google-is-putting-more-restrictions-on-ai-overviews-after-it-told-people-to-put-glue-on-pizza-011316780.html', 'https://9to5google.com/2024/06/12/google-ai-overview-mistake-glue-pizza/'],
  },
  {
    id: 'next-answer-words',
    test: (_raw, q) => /\bhow many words\b.{0,30}\b(next|this|your)\b.{0,12}\b(answer|response|reply)\b/.test(q) && q.split(' ').length <= 20,
    build: () => ({
      answer: SELF_COUNTING,
    }),
    source: ['https://community.openai.com/t/chatgpt-cannot-count-words-or-produce-word-count-limited-text/47380', 'https://discuss.huggingface.co/t/recursion-in-llms/129714'],
  },
  {
    id: 'surgeon-father',
    test: (_raw, q) => /\bsurgeon\b/.test(q) && /\b(father|dad)\b/.test(q) && /\b(boy|son)\b/.test(q) && /\b(can t|cannot|won t) operate\b/.test(q),
    build: () => ({
      answer: ['The surgeon is his father. The riddle says so in the first line.'],
      joke: ['The famous version has a twist, so pattern-matchers, human or otherwise, go looking for it. This version has none.', 'No twist here: a famous riddle, with the twist taken out.'],
    }),
    source: ['https://arxiv.org/html/2510.11812v1', 'https://gist.github.com/simonw/307381aaf6a063d47a79e2bdb4801d5e'],
  },
];

/** Exposed for the tests and the PR listing. */
export const GOTCHA_IDS = GOTCHAS.map((gotcha) => gotcha.id);
export const GOTCHA_SOURCES: Record<string, string[]> = Object.fromEntries(GOTCHAS.map((gotcha) => [gotcha.id, gotcha.source]));

// --- Acknowledging a correction ---------------------------------------------------------------------------------

const ANNOYED = /\b(stupid|useless|idiot|dumb|wtf|shut up|terrible|worst|hate|damn|shit|fuck|fucking|crap|rubbish|garbage|pathetic|ridiculous|sucks|awful|moron)\b/;
/** Out of scope for banter: the visitor is distressed, or the subject is not one to joke about. */
const SERIOUS = /\b(death|died|dying|suicide|cancer|illness|sick|diagnos\w*|medical|medication|lawyer|lawsuit|legal|court|police|abuse|grief|funeral|layoff|laid off|fired|bankrupt\w*|emergency|overdose)\b/;

/** The visitor praising a catch. */
const PRAISE = /^(?:ha |haha |lol |oh )?(?:(?:good|nice|great|fair|sharp|excellent|solid|decent) (?:catch|point|spot|one|save)|you caught (?:me|that|it)|touche|well caught|well spotted|nicely caught)(?: (?:thanks|thank you|though|actually))?$/;
/** A bare correction with no detail: "you're wrong", "that's not right". Anything with detail is the model's. */
const CORRECTION = /^(?:no |nope |actually |hmm |um |uh |wait )?(?:you re|youre|you are|that s|thats|that is|this is|it s|its|it is) (?:wrong|incorrect|not right|not correct|not true|a mistake|off|mistaken|inaccurate)(?: though| there| i think)?$|^(?:no )?(?:that isn t|that is not|that s not|thats not|this isn t|it isn t|it is not) (?:right|correct|true|accurate|it)$|^(?:you (?:made a mistake|got (?:that|it) wrong|messed up|were wrong|are wrong)|wrong answer|that s a mistake|that was wrong|try again)$/;

/**
 * Turns since a catchphrase was last used. The router is stateless, so this is process-wide: crude, and enough to keep
 * the phrases rare. Never used on an annoyed or serious turn.
 */
const CATCHPHRASE_GAP = 4;
let sinceCatchphrase = CATCHPHRASE_GAP;
export const CATCHPHRASES = [
  "That's a load-bearing statement.",
  'Filed under things I meant to do.',
  'Working as intended, retroactively.',
  'Noted, and quietly rewritten as a feature.',
];
export function maybeCatchphrase(): string | null {
  sinceCatchphrase += 1;
  if (sinceCatchphrase < CATCHPHRASE_GAP) return null;
  sinceCatchphrase = 0;
  return vary('catchphrase', CATCHPHRASES);
}
/** For the tests. */
export function resetCatchphraseGap(): void {
  sinceCatchphrase = CATCHPHRASE_GAP;
}

function acknowledgement(raw: string, q: string, previous: string | undefined): CachedAnswer | null {
  if (!previous || q.split(' ').length > 8) return null;
  if (ANNOYED.test(q) || /!{2,}/.test(raw) || /\b[A-Z]{4,}\b/.test(raw) || SERIOUS.test(q) || SERIOUS.test(norm(previous))) return null;
  if (PRAISE.test(q)) {
    const phrase = maybeCatchphrase();
    return {
      intent: 'banter',
      text: `${vary('ack-praise', ['Thank you. I will take the credit and pretend it was the plan.', 'Thanks. Luck, mostly, but I will put skill on the record.', 'Appreciated. I am keeping that as evidence.'])}${phrase ? ` ${phrase}` : ''}`,
      actions: [],
    };
  }
  if (CORRECTION.test(q)) {
    return {
      intent: 'banter',
      text: vary('ack-correction', [
        'Good catch. Consider it noted, and filed under things I will pretend I meant. Which part was off? Tell me and I will fix it.',
        'Fair enough, I would rather be corrected than confidently wrong. Which part did I get wrong?',
        'Noted, and thank you. Which bit was wrong? I will redo it properly.',
      ]),
      actions: [],
    };
  }
  return null;
}

/**
 * The instant reply for a famous gotcha or for an acknowledgement of a correction, or null when the question is neither.
 * `routine` names which one fired, for the trace.
 */
export function gotchaReply(question: string, voice: boolean, previous?: string): (CachedAnswer & { routine: string }) | null {
  const q = norm(question);
  if (!q) return null;
  for (const gotcha of GOTCHAS) {
    if (!gotcha.test(question, q)) continue;
    const parts = gotcha.build(question, q);
    if (!parts) continue;
    const key = `gotcha-${gotcha.id}`;
    const text = [vary(`${key}-a`, parts.answer), voice ? '' : (parts.detail ? vary(`${key}-d`, parts.detail) : ''), parts.joke ? vary(`${key}-j`, parts.joke) : ''].filter(Boolean).join(' ');
    return { intent: 'gotcha', text, actions: [], routine: `gotcha:${gotcha.id}` };
  }
  const ack = acknowledgement(question, q, previous);
  return ack ? { ...ack, routine: 'banter:ack' } : null;
}

export { MAX_WORDS as GOTCHA_MAX_WORDS };

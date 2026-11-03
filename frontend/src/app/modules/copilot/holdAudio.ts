/**
 * Saved voice lines for a call, played from the page (no model, no server): the lines while a call
 * connects, and the reminders when a connected call goes quiet. The agent can take several seconds to join
 * (its speech models may need loading) and silence there reads as a broken button; a quiet call needs a
 * nudge so the visitor knows I am still there. The clips are rendered with the agent's own voice and speak
 * in the first person, as AI Pujan (see frontend/public/voice/README.md). They stop the moment the agent
 * arrives, or the moment anyone starts talking.
 */

type Line = { src: string; text: string };

const CONNECTING: Line[] = [
  { src: '/voice/connecting-1.m4a', text: "Hold on, I'm getting set up. I'll be right with you." },
  { src: '/voice/connecting-2.m4a', text: "I'm warming up. One more second." },
  { src: '/voice/connecting-3.m4a', text: 'Almost there. Thanks for waiting.' },
];
/** Said once, if the call is still not up after the others. */
const SLOW: Line = {
  src: '/voice/connecting-slow.m4a',
  text: "This is taking a little longer than usual. Thanks for your patience, I'm nearly there.",
};

/** Reminders for a quiet call, in a random order each time. */
const NUDGES: Line[] = [
  { src: '/voice/nudge-1.m4a', text: "I'm still here if you want to ask anything." },
  { src: '/voice/nudge-2.m4a', text: 'Want me to walk you through my projects?' },
  { src: '/voice/nudge-3.m4a', text: 'I can also help you book a free consultation.' },
  { src: '/voice/nudge-4.m4a', text: 'Ask me about my research, my work history, or anything on the site.' },
];
/** Is this one of the quiet-call reminders (not the muted notice)? */
export const isNudge = (text: string) => NUDGES.some((line) => line.text === text);
const MUTED: Line = { src: '/voice/nudge-muted.m4a', text: "I can't hear you right now. It looks like your mic is muted." };

/**
 * Said while the answer is being worked out, in a random order each time, so a slow model never means silence. Each
 * clip is one flowing utterance of a few beats ("Hmmm... let me see..."), recorded to follow the one before it: an
 * opener, then continuations that start mid-thought, so a chain sounds like one person thinking aloud and not a list
 * of separate phrases.
 */
const OPENERS: Line[] = [
  { src: '/voice/think-open-1.m4a', text: 'Hmmmmmm... I... see... Lemme think here, for a sec.' },
  { src: '/voice/think-open-2.m4a', text: 'Mmmm. Okay... Lemme see here...' },
  { src: '/voice/think-open-3.m4a', text: 'Hmmmmm... Right. Let me think about that...' },
  { src: '/voice/think-open-4.m4a', text: 'Ahhh. Okay... Let me have a look...' },
];
const MIDDLES: Line[] = [
  { src: '/voice/think-mid-1.m4a', text: 'Hmmm... Let me find the right part...' },
  { src: '/voice/think-mid-2.m4a', text: 'Mmmmm. Give me just a sec...' },
  { src: '/voice/think-mid-3.m4a', text: 'Okay... One moment... Pulling that up...' },
];
const LONG_WAIT: Line = { src: '/voice/think-long.m4a', text: "Sorry... This is taking a little while. I'm really getting into it..." };
/** Played when the answer arrives after fillers, so they flow into it. */
const CLOSERS: Line[] = [
  { src: '/voice/think-close-1.m4a', text: 'Ahhh... here it is.' },
  { src: '/voice/think-close-2.m4a', text: 'Okay... got it.' },
  { src: '/voice/think-close-3.m4a', text: 'Right... here we go.' },
];

const GAP_MS = 2200;
/** Fillers start only if the answer is not back by then, so an instant answer is never preceded by one. */
const THINK_DELAY_MS = 700;
/** Barely a breath between clips: they are recorded to run on from one another. */
const THINK_GAP_MS = 700;
const THINK_LONG_AFTER_MS = 9000;
const SLOW_AFTER_MS = 12_000;
const FADE_MS = 200;
/** A quiet call is nudged every 10 to 20 seconds, up to this many times until someone speaks again. */
const NUDGE_MIN_MS = 10_000;
const NUDGE_MAX_MS = 20_000;
const MAX_NUDGES = 4;

const cache = new Map<string, HTMLAudioElement>();

function clip(src: string): HTMLAudioElement {
  let audio = cache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = 'auto';
    cache.set(src, audio);
  }
  return audio;
}

/** Fade a clip out and stop it. */
function fadeOut(audio: HTMLAudioElement | null) {
  if (!audio || audio.paused) return;
  audio.onended = null;
  const start = audio.volume;
  const steps = 8;
  let step = 0;
  const fade = setInterval(() => {
    step += 1;
    audio.volume = Math.max(0, start * (1 - step / steps));
    if (step >= steps) {
      clearInterval(fade);
      audio.pause();
      audio.volume = 1;
    }
  }, FADE_MS / steps);
}

/** Fetch the clips ahead of the click, so the first one starts with no wait. */
export function preloadHold() {
  for (const line of [...CONNECTING, SLOW, ...NUDGES, MUTED, ...OPENERS, ...MIDDLES, LONG_WAIT, ...CLOSERS]) clip(line.src);
  for (const src of Object.values(SPOKEN_REPLIES)) clip(src);
}

/* ---------- Connecting ---------- */

let holdToken = 0;
let holdTimer: ReturnType<typeof setTimeout> | undefined;
let holdCurrent: HTMLAudioElement | null = null;

/**
 * Start the connecting lines. Call it inside the click that starts the call, so the browser lets the audio play.
 * `onLine` gets the text of the clip being spoken, and an empty string when none is.
 */
export function startHold(onLine: (text: string) => void) {
  stopHold(onLine);
  const mine = ++holdToken;
  const startedAt = Date.now();
  let slowSaid = false;

  const play = (line: Line, then: () => void) => {
    const audio = clip(line.src);
    audio.currentTime = 0;
    audio.volume = 1;
    holdCurrent = audio;
    audio.onended = () => {
      if (holdToken !== mine) return;
      holdCurrent = null;
      onLine('');
      then();
    };
    onLine(line.text);
    audio.play().catch(() => {
      // Blocked or missing: stay silent for this call rather than retry.
      if (holdToken === mine) {
        holdCurrent = null;
        onLine('');
      }
    });
  };

  const next = (index: number) => {
    if (holdToken !== mine) return;
    if (index < CONNECTING.length) {
      holdTimer = setTimeout(() => holdToken === mine && play(CONNECTING[index], () => next(index + 1)), GAP_MS);
      return;
    }
    // The set is spent: one apology if the call is still not up, once enough time has passed.
    if (slowSaid) return;
    const wait = Math.max(GAP_MS, SLOW_AFTER_MS - (Date.now() - startedAt));
    holdTimer = setTimeout(() => {
      if (holdToken !== mine) return;
      slowSaid = true;
      play(SLOW, () => undefined);
    }, wait);
  };

  // The first clip starts synchronously, inside the click.
  play(CONNECTING[0], () => next(1));
}

/** Stop the connecting lines now: the agent has joined, the call failed, or the visitor hung up. */
export function stopHold(onLine?: (text: string) => void) {
  holdToken += 1;
  clearTimeout(holdTimer);
  const audio = holdCurrent;
  holdCurrent = null;
  onLine?.('');
  fadeOut(audio);
}

/* ---------- Quiet reminders ---------- */

let nudgeToken = 0;
let nudgeTimer: ReturnType<typeof setTimeout> | undefined;
let nudgeCurrent: HTMLAudioElement | null = null;
let nudgeCount = 0;
let nudgeOrder: Line[] = [];
let nudgeHooks: { onLine: (text: string) => void; muted: () => boolean } | null = null;
let nudgesPaused = false;

const shuffled = (lines: Line[]) => [...lines].sort(() => Math.random() - 0.5);

function scheduleNudge() {
  clearTimeout(nudgeTimer);
  if (!nudgeHooks || nudgesPaused || nudgeCount >= MAX_NUDGES) return;
  const mine = nudgeToken;
  const wait = NUDGE_MIN_MS + Math.random() * (NUDGE_MAX_MS - NUDGE_MIN_MS);
  nudgeTimer = setTimeout(() => {
    if (nudgeToken !== mine || !nudgeHooks) return;
    const hooks = nudgeHooks;
    if (!nudgeOrder.length) nudgeOrder = shuffled(NUDGES);
    // A muted visitor is told so, instead of being asked a question they cannot answer.
    const line = hooks.muted() ? MUTED : (nudgeOrder.pop() as Line);
    nudgeCount += 1;
    const audio = clip(line.src);
    audio.currentTime = 0;
    audio.volume = 1;
    nudgeCurrent = audio;
    audio.onended = () => {
      if (nudgeToken !== mine) return;
      nudgeCurrent = null;
      hooks.onLine('');
      scheduleNudge();
    };
    hooks.onLine(line.text);
    audio.play().catch(() => {
      if (nudgeToken === mine) {
        nudgeCurrent = null;
        hooks.onLine('');
      }
    });
  }, wait);
}

/**
 * A connected call that goes quiet is nudged every 10 to 20 seconds (a saved line, said in my voice), up to
 * four times, and starts over whenever anyone speaks. `muted` says whether the visitor's mic is off.
 */
export function startNudges(onLine: (text: string) => void, muted: () => boolean) {
  stopNudges();
  nudgeToken += 1;
  nudgeHooks = { onLine, muted };
  nudgeCount = 0;
  nudgeOrder = shuffled(NUDGES);
  scheduleNudge();
}

/** Someone spoke: cut off a reminder that is playing and start the quiet timer again. */
export function noteActivity() {
  if (!nudgeHooks) return;
  nudgeToken += 1;
  clearTimeout(nudgeTimer);
  const audio = nudgeCurrent;
  nudgeCurrent = null;
  if (audio) {
    nudgeHooks.onLine('');
    fadeOut(audio);
  }
  nudgeCount = 0;
  scheduleNudge();
}

/**
 * Reminders belong to a quiet call. While an answer is being worked out, or is being spoken, nothing is quiet, so they
 * hold off; resuming starts a fresh 10 to 20 second wait.
 */
export function pauseNudges() {
  nudgesPaused = true;
  nudgeToken += 1;
  clearTimeout(nudgeTimer);
  const audio = nudgeCurrent;
  nudgeCurrent = null;
  if (audio) {
    nudgeHooks?.onLine('');
    fadeOut(audio);
  }
}

export function resumeNudges() {
  if (!nudgesPaused) return;
  nudgesPaused = false;
  nudgeToken += 1;
  scheduleNudge();
}

export function stopNudges() {
  nudgesPaused = false;
  nudgeToken += 1;
  clearTimeout(nudgeTimer);
  const audio = nudgeCurrent;
  nudgeCurrent = null;
  nudgeHooks?.onLine('');
  nudgeHooks = null;
  fadeOut(audio);
}

/* ---------- Thinking fillers ---------- */

export type Thinking = {
  /** The answer is ready: let the clip in progress end, say a closer if fillers were used, then resolve. */
  finish: () => Promise<void>;
  /** Someone started speaking: stop at once. */
  cancel: () => void;
};

const pickOne = <T,>(items: readonly T[], not?: T): T => {
  const pool = not === undefined ? items : items.filter((item) => item !== not);
  return pool[Math.floor(Math.random() * pool.length)];
};

/**
 * Fillers while an answer is worked out: after a short delay, an opener ("Hmm", "Let me see"), then up to two more
 * ("Now let me look at that", "One second"), each finishing before the next begins, and one "taking a while" line
 * if it is still not ready. Then silence. When the answer arrives, `finish()` lets the current clip end and adds a
 * closer ("Ahh, here it is"), so the real answer is never cut across mid-sentence.
 */
export function startThinking(onLine: (text: string) => void): Thinking {
  let live = true;
  let played = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let current: { audio: HTMLAudioElement; done: Promise<void>; end: () => void } | null = null;
  const startedAt = Date.now();

  const play = (line: Line): Promise<void> => {
    const audio = clip(line.src);
    audio.currentTime = 0;
    audio.volume = 1;
    let end = () => undefined;
    const done = new Promise<void>((resolve) => {
      end = () => {
        audio.onended = null;
        if (current?.audio === audio) current = null;
        onLine('');
        resolve();
      };
      audio.onended = end;
    });
    current = { audio, done, end };
    onLine(line.text);
    played += 1;
    audio.play().catch(end);
    return done;
  };

  const sequence = [pickOne(OPENERS), pickOne(MIDDLES)];
  sequence.push(pickOne(MIDDLES, sequence[1]));

  const next = (index: number) => {
    if (!live) return;
    if (index < sequence.length) {
      void play(sequence[index]).then(() => {
        if (live) timer = setTimeout(() => next(index + 1), THINK_GAP_MS);
      });
      return;
    }
    // The set is spent and the answer is still not here: one line, once.
    const wait = Math.max(THINK_GAP_MS, THINK_LONG_AFTER_MS - (Date.now() - startedAt));
    timer = setTimeout(() => {
      if (live) void play(LONG_WAIT);
    }, wait);
  };
  timer = setTimeout(() => next(0), THINK_DELAY_MS);

  return {
    async finish() {
      live = false;
      clearTimeout(timer);
      if (current) await current.done;
      if (played > 0) await play(pickOne(CLOSERS));
    },
    cancel() {
      live = false;
      clearTimeout(timer);
      const playing = current;
      current = null;
      onLine('');
      if (playing) {
        playing.audio.onended = null;
        fadeOut(playing.audio);
      }
    },
  };
}

/** Pre-recorded replies to small talk, by exact text (the same wordings as backend/src/copilot/answers.ts). Typed greetings are spoken on a call. */
const SPOKEN_REPLIES: Record<string, string> = {
  "Hey, it's AI Pujan. I can take you through my work, my research or my writing, or point you at whatever is closest to what you're building.": '/voice/hello-1.m4a',
  "Hi, I'm AI Pujan. Want a tour of my work, or is there something you're building I can help with?": '/voice/hello-2.m4a',
  "Hello! I'm AI Pujan. Ask me about my projects, my writing, or my research.": '/voice/hello-3.m4a',
  'Hey there. AI Pujan here. What would you like to see first?': '/voice/hello-4.m4a',
  'Hi again! What would you like to look at?': '/voice/hello-again-1.m4a',
  'Hey, still here. Ask me about a project, a paper, or my work history.': '/voice/hello-again-2.m4a',
  'Hello again. Where should we go next?': '/voice/hello-again-3.m4a',
};

/** Plays the recording for a reply, if there is one. Resolves true when it played to the end, false when there was none. */
export function playSpokenReply(text: string): Promise<boolean> | null {
  const src = SPOKEN_REPLIES[text];
  if (!src) return null;
  const audio = clip(src);
  audio.currentTime = 0;
  audio.volume = 1;
  return new Promise((resolve) => {
    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
    audio.play().catch(() => resolve(false));
  });
}

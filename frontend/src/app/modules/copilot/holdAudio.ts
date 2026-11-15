/**
 * Saved voice lines for a call, played from the page (no model, no server): the lines while a call
 * connects, and the reminders when a connected call goes quiet. The agent can take several seconds to join
 * (its speech models may need loading) and silence there reads as a broken button; a quiet call needs a
 * nudge so the visitor knows I am still there. The clips are rendered with the agent's own voice and speak
 * in the first person, as AI Pujan (see frontend/public/voice/README.md). They stop the moment the agent
 * arrives, or the moment anyone starts talking.
 */

/** `pauses`: where the clip goes quiet between beats, in seconds (measured from the files), so a filler stops on a pause and never mid-word. */
type Line = { src: string; text: string; pauses?: number[] };

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
  { src: '/voice/think-open-1.m4a', text: 'Hmmmmmm... I... see... Lemme think here, for a sec.', pauses: [1.55, 3.16, 4.57] },
  { src: '/voice/think-open-2.m4a', text: 'Mmmm. Okay... Lemme see here...', pauses: [1.45, 3.03] },
  { src: '/voice/think-open-3.m4a', text: 'Hmmmmm... Right. Let me think about that...', pauses: [1.65, 3.47] },
  { src: '/voice/think-open-4.m4a', text: 'Ahhh. Okay... Let me have a look...', pauses: [1.4, 3.26] },
];
const MIDDLES: Line[] = [
  { src: '/voice/think-mid-1.m4a', text: 'Hmmm... Let me find the right part...', pauses: [1.54] },
  { src: '/voice/think-mid-2.m4a', text: 'Mmmmm. Give me just a sec...', pauses: [1.44] },
  { src: '/voice/think-mid-3.m4a', text: 'Okay... One moment... Pulling that up...', pauses: [1.26, 3.52] },
];
const LONG_WAIT: Line = { src: '/voice/think-long.m4a', text: "Sorry... This is taking a little while. I'm really getting into it...", pauses: [1.33, 3.88] };
/** Played when the answer arrives after fillers, so they flow into it. */
const CLOSERS: Line[] = [
  { src: '/voice/think-close-1.m4a', text: 'Ahhh... here it is.' },
  { src: '/voice/think-close-2.m4a', text: 'Okay... got it.' },
  { src: '/voice/think-close-3.m4a', text: 'Right... here we go.' },
];

const GAP_MS = 2200;
/** Fillers start only if the answer is not back by then, so an instant or quick answer is never preceded by one. */
const THINK_DELAY_MS = 1500;
/** A breath between clips, so the chain sounds like one person thinking and not a playlist changing tracks. */
const THINK_GAP_MS = 1200;
/** When the answer lands mid-filler, the filler runs on to its next pause if that is this close; further off, it fades. */
const FINISH_BEAT_MS = 1800;
const THINK_LONG_AFTER_MS = 9000;
const SLOW_AFTER_MS = 12_000;
const FADE_MS = 200;
/** A quiet call is nudged every 40 to 60 seconds, up to this many times until someone speaks again. */
const NUDGE_MIN_MS = 40_000;
const NUDGE_MAX_MS = 60_000;
const MAX_NUDGES = 3;

const cache = new Map<string, HTMLAudioElement>();

/**
 * What the page said aloud lately, and until when. The clips play from the page, outside the call's echo cancellation, so
 * the mic can hear them: a question that reached the agent as "Who is There it is." was a visitor plus my own closer.
 */
let spoken: Array<{ text: string; until: number }> = [];
const ECHO_MS = 6000;
function noteSpoken(text: string, audio: HTMLAudioElement) {
  const left = Number.isFinite(audio.duration) ? (audio.duration - audio.currentTime) * 1000 : 6000;
  spoken = [...spoken.filter((line) => line.until > Date.now() - ECHO_MS), { text, until: Date.now() + left }];
}
const ECHO_FILLER = new Set(['hmm', 'hm', 'mm', 'mmm', 'ah', 'ahh', 'ahhh', 'oh', 'okay', 'ok', 'right', 'so', 'uh', 'um']);
const words = (text: string) => text.toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(Boolean)
  .map((word) => (/^(h?m+|a+h+|o+h)$/.test(word) ? word.replace(/(.)\1+/g, '$1$1') : word));
/** The recogniser hears "here" as "there", "lemme" as "let me": close enough counts. */
const near = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 3 && (a.endsWith(b) || b.endsWith(a)));

/**
 * The visitor's words with my own recent clips taken out where the mic picked them up: a run of two or more of a clip's
 * words, in order, at the start or end of what was heard (or a lone "hmm", "okay"). Returns '' when nothing else is left.
 */
export function withoutEcho(heard: string): string {
  const recent = spoken.filter((line) => line.until > Date.now() - ECHO_MS).map((line) => words(line.text));
  if (!recent.length) return heard;
  let said = heard.trim().split(/\s+/);
  const plain = (word: string) => words(word)[0] ?? '';
  // How many of `run` (in order) match somewhere inside a clip.
  const inClip = (run: string[]) => recent.some((clip) => clip.some((_, at) => run.every((word, i) => clip[at + i] !== undefined && near(word, clip[at + i]))));
  const strip = (fromEnd: boolean) => {
    for (let take = said.length; take >= 1; take -= 1) {
      const run = (fromEnd ? said.slice(-take) : said.slice(0, take)).map(plain);
      if (run.some((word) => !word)) continue;
      if ((take >= 2 && run.some((word) => word.length >= 3) && inClip(run)) || (take === 1 && ECHO_FILLER.has(run[0]))) {
        said = fromEnd ? said.slice(0, -take) : said.slice(take);
        return true;
      }
    }
    return false;
  };
  while (said.length && strip(false));
  while (said.length && strip(true));
  return said.join(' ').replace(/^[\s,.…-]+/, '').trim();
}

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
    audio.play().then(() => noteSpoken(line.text, audio), () => {
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
  /** The answer is ready: fade out the clip in progress, say a closer if a whole filler was heard, then resolve. */
  finish: () => Promise<void>;
  /** Someone started speaking: stop at once. */
  cancel: () => void;
};

/** The last turn's opener, so two turns in a row never start the same way. */
let lastOpener: Line | undefined;

const pickOne = <T,>(items: readonly T[], not?: T): T => {
  const pool = not === undefined ? items : items.filter((item) => item !== not);
  return pool[Math.floor(Math.random() * pool.length)];
};

/**
 * Fillers while an answer is worked out: after a short delay, an opener ("Hmm", "Let me see"), then one more
 * ("One second"), each finishing before the next begins, and one "taking a while" line if it is still not ready. Then
 * silence. When the answer arrives, `finish()` lets the clip in progress reach its next pause (or fades it if that is
 * far off), and adds a closer ("Ahh, here it is") only after a filler that was heard in full, so a long wait still
 * flows into the answer.
 */
export function startThinking(onLine: (text: string) => void): Thinking {
  let live = true;
  /** Fillers heard to the end. A closer only follows those; one cut short goes straight to the answer. */
  let heard = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let current: { audio: HTMLAudioElement; done: Promise<void>; end: () => void; line: Line } | null = null;
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
      audio.onended = () => {
        heard += 1;
        end();
      };
    });
    current = { audio, done, end, line };
    onLine(line.text);
    audio.play().then(() => noteSpoken(line.text, audio), end);
    return done;
  };

  // One opener and one follow-on, then quiet until the "taking a while" line: a steady thinker, not a stream of phrases.
  const opener = pickOne(OPENERS, lastOpener);
  lastOpener = opener;
  const sequence = [opener, pickOne(MIDDLES)];

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
      // The answer is ready, so it is not held behind a 5 to 6 second filler, but the filler is not cut mid-word either:
      // it runs on to its next pause when that is close. Stopped on a pause, it goes straight into the answer, with no closer.
      const playing = current;
      if (playing) {
        const at = playing.audio.currentTime;
        const pause = playing.line.pauses?.find((time) => time > at + 0.05);
        const wait = pause === undefined ? Infinity : (pause - at) * 1000;
        if (wait <= FINISH_BEAT_MS) {
          await Promise.race([playing.done, new Promise((resolve) => setTimeout(resolve, wait))]);
        }
        if (current === playing) {
          current = null;
          onLine('');
          fadeOut(playing.audio);
          await new Promise((resolve) => setTimeout(resolve, FADE_MS));
        }
      }
      if (heard > 0) await play(pickOne(CLOSERS));
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
    audio.play().then(() => noteSpoken(text, audio), () => resolve(false));
  });
}

/* ---------- The moon's walk ---------- */

/**
 * Said aloud when the moon walks a text-chat visitor to a page (a chip, or a yes to an offer): as it sets off, while it
 * scrolls, and when it finds the card. The bubble shows the same words. Not on a call, where the call's own voice and
 * fillers are already talking.
 */
const WALK = {
  start: [
    { src: '/voice/walk-start-1.m4a', text: 'Let me find that one...' },
    { src: '/voice/walk-start-2.m4a', text: 'One sec... finding it...' },
    { src: '/voice/walk-start-3.m4a', text: 'Okay... heading over there...' },
  ],
  scroll: [
    { src: '/voice/walk-scroll-1.m4a', text: 'Hmm... somewhere in here...' },
    { src: '/voice/walk-scroll-2.m4a', text: 'Scrolling down a bit...' },
    { src: '/voice/walk-scroll-3.m4a', text: "Hold on... it's a little further down..." },
  ],
  found: [
    { src: '/voice/walk-found-1.m4a', text: 'Ahh, there it is.' },
    { src: '/voice/walk-found-2.m4a', text: 'Found it!' },
    { src: '/voice/walk-found-3.m4a', text: 'That one, right there.' },
  ],
} satisfies Record<string, Line[]>;
export type WalkStep = keyof typeof WALK;

let callOn = false;
/** voice.ts says when a call is connecting or up, so the walk keeps quiet then. */
export function setCallOn(on: boolean) {
  callOn = on;
  if (on) {
    stopWalkLine();
    stopReply();
  }
}

let walkCurrent: HTMLAudioElement | null = null;
const lastWalk: Partial<Record<WalkStep, number>> = {};
const WALK_STOPS = ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const;

/** The visitor took over (a click, a scroll, a key): the line fades out. */
export function stopWalkLine() {
  for (const type of WALK_STOPS) window.removeEventListener(type, stopWalkLine, true);
  fadeOut(walkCurrent);
  walkCurrent = null;
}

/** Resolves when the line being said has ended (or after `maxMs`), so "found it" follows "let me find that one" instead of being dropped. */
export function walkIdle(maxMs = 2500): Promise<void> {
  const audio = walkCurrent;
  if (!audio || audio.paused) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => { clearInterval(poll); resolve(); };
    const started = Date.now();
    const poll = setInterval(() => {
      if (walkCurrent !== audio || audio.paused || audio.ended || Date.now() - started > maxMs) done();
    }, 80);
  });
}

let walking = 0;
/** The store says when the moon is walking the visitor somewhere (a page button): the reply waits for it to arrive. */
export function setWalking(on: boolean) {
  walking = Math.max(0, walking + (on ? 1 : -1));
}
/**
 * Resolves when the walk is over and its last line has been said (or after `maxMs`). A kept summary comes back in a fifth
 * of a second, while the moon is still on its way: the reply started and "Ahh, there it is." was said over it.
 */
export async function walkQuiet(maxMs = 8000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < maxMs && (walking > 0 || (walkCurrent && !walkCurrent.paused))) await new Promise((resolve) => setTimeout(resolve, 80));
}

export function preloadWalk() {
  for (const line of Object.values(WALK).flat()) clip(line.src);
}

/**
 * A line for a step of the walk, never the same one twice in a row; `aloud` also plays it. Returns null while an earlier
 * line is still being said, so it is never cut off mid-word and the bubble never shows words that are not being heard.
 */
export function walkLine(step: WalkStep, aloud: boolean): string | null {
  if (walkCurrent && !walkCurrent.paused) return null;
  const lines = WALK[step];
  let index = Math.floor(Math.random() * lines.length);
  if (index === lastWalk[step]) index = (index + 1) % lines.length;
  lastWalk[step] = index;
  const line = lines[index];
  if (!aloud || callOn || voiceOff) return line.text;
  const audio = clip(line.src);
  audio.currentTime = 0;
  audio.volume = 1;
  walkCurrent = audio;
  audio.onended = () => {
    if (walkCurrent !== audio) return;
    walkCurrent = null;
    for (const type of WALK_STOPS) window.removeEventListener(type, stopWalkLine, true);
  };
  for (const type of WALK_STOPS) window.addEventListener(type, stopWalkLine, { capture: true, passive: true });
  audio.play().catch(() => {
    if (walkCurrent === audio) walkCurrent = null;
  });
  return line.text;
}

/* ---------- Replies read aloud (no call) ---------- */

/**
 * Outside a call every typed reply is read aloud in my voice (TASK-DB-0165): a summary that was answered before plays a
 * saved clip at once; a new answer is synthesised by the API as soon as it is finished (backend/src/copilot/speech.ts).
 * One audio element is reused, unlocked inside the visitor's click or Enter (primeReplyVoice), so the browser lets it play
 * when the answer arrives seconds later (Safari only lets an element play after it has played once inside a gesture). Any
 * click or key stops it, a call stops it, and the visitor can switch it off; that choice is remembered on this browser.
 */
const VOICE_OFF_KEY = 'db-copilot-voice-off';
let voiceOff = (() => {
  try {
    return window.localStorage.getItem(VOICE_OFF_KEY) === '1';
  } catch {
    return false;
  }
})();
const voiceListeners = new Set<() => void>();
let replySpeaking = false;

export const replyVoiceOff = () => voiceOff;
export const replyVoiceSpeaking = () => replySpeaking;
export function onReplyVoice(listener: () => void) {
  voiceListeners.add(listener);
  return () => {
    voiceListeners.delete(listener);
  };
}
const tell = () => voiceListeners.forEach((listener) => listener());

export function setReplyVoiceOff(off: boolean) {
  voiceOff = off;
  try {
    if (off) window.localStorage.setItem(VOICE_OFF_KEY, '1');
    else window.localStorage.removeItem(VOICE_OFF_KEY);
  } catch {
    /* private window: the choice lasts this visit */
  }
  if (off) {
    stopReply();
    stopWalkLine();
  }
  tell();
}

/** 0.05 s of silence: played once inside a gesture to unlock the shared element. */
const SILENCE = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
let replyAudio: HTMLAudioElement | null = null;
let replyUnlocked = false;
let replyToken = 0;
let replyAbort: AbortController | null = null;
const REPLY_STOPS = ['pointerdown', 'keydown'] as const;
/** A fresh clip that takes longer than this (a cold Pro) is dropped: the reply has been read by then. */
const REPLY_FETCH_MS = 30_000;

/** Call inside the click or Enter that asks for a reply: stops what is being said and unlocks the voice for the answer. */
export function primeReplyVoice() {
  stopReply();
  if (voiceOff || callOn) return;
  if (!replyAudio) {
    replyAudio = new Audio();
    replyAudio.preload = 'auto';
  }
  if (replyUnlocked) return;
  const audio = replyAudio;
  audio.src = SILENCE;
  audio.play().then(() => {
    replyUnlocked = true;
  }, () => undefined);
}

function dropReplyListeners() {
  for (const type of REPLY_STOPS) window.removeEventListener(type, stopReply, true);
}

/** Stop the reply being read (a click, a key, a call, the switch). */
export function stopReply() {
  replyToken += 1;
  replyAbort?.abort();
  replyAbort = null;
  dropReplyListeners();
  if (replyAudio && !replyAudio.paused) fadeOut(replyAudio);
  if (replySpeaking) {
    replySpeaking = false;
    tell();
  }
}

/**
 * Read a finished reply aloud. `urls` are the clips the API made for it, in order: one for a kept reply, one a sentence or
 * two for a new one, so the voice starts after the first sentence is made and not after the whole reply (TASK-DB-0166).
 * Null: speech is not set up, nothing is said. A saved greeting (SPOKEN_REPLIES) plays from the page instead. Waits for the
 * moon's walk to end, so they never talk over each other.
 */
export async function speakReply(text: string, urls: string[] | null): Promise<void> {
  if (voiceOff || callOn) return;
  const mine = ++replyToken;
  const saved = SPOKEN_REPLIES[text];
  const abort = new AbortController();
  replyAbort = abort;
  const timer = setTimeout(() => abort.abort(), REPLY_FETCH_MS);
  // All asked for at once (the API makes them in order); each is played when the one before it has ended.
  const clips: Promise<string | null>[] = saved
    ? [Promise.resolve(saved)]
    : (urls ?? []).map((url) =>
        fetch(url, { signal: abort.signal })
          .then((response) => (response.ok ? response.blob() : null))
          .then((blob) => (blob ? URL.createObjectURL(blob) : null))
          .catch(() => null));
  const made: string[] = [];
  const finish = () => {
    clearTimeout(timer);
    if (replyAbort === abort) replyAbort = null;
    // The clips of the reply before this one are let go once this one has its own.
    void Promise.all(clips).then(() => {
      for (const url of made) if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
  };
  if (!clips.length) return finish();
  const first = await clips[0];
  if (first) made.push(first);
  if (!first || mine !== replyToken) return finish();
  await walkQuiet(8000);
  if (mine !== replyToken || voiceOff || callOn) return finish();
  if (!replyAudio) replyAudio = new Audio();
  const audio = replyAudio;
  const end = () => {
    audio.onended = null;
    finish();
    if (mine !== replyToken) return;
    dropReplyListeners();
    replySpeaking = false;
    tell();
  };
  const play = async (src: string, index: number): Promise<void> => {
    audio.onended = () => {
      if (mine !== replyToken) return end();
      const next = clips[index + 1];
      if (!next) return end();
      void next.then((url) => {
        if (url) made.push(url);
        // A sentence that could not be made ends the reading there: skipping it would garble the reply.
        if (!url || mine !== replyToken) return end();
        void play(url, index + 1).catch(end);
      });
    };
    audio.src = src;
    audio.currentTime = 0;
    audio.volume = 1;
    await audio.play();
  };
  try {
    await play(first, 0);
  } catch {
    return end(); // Blocked by the browser: the reply stays on screen, unspoken.
  }
  if (mine !== replyToken) {
    audio.pause();
    return end();
  }
  noteSpoken(text, audio);
  replySpeaking = true;
  tell();
  // Only now, so the click that asked for this reply does not stop it.
  for (const type of REPLY_STOPS) window.addEventListener(type, stopReply, { capture: true, passive: true });
}

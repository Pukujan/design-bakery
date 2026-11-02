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
const MUTED: Line = { src: '/voice/nudge-muted.m4a', text: "I can't hear you right now. It looks like your mic is muted." };

const GAP_MS = 2200;
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
  for (const line of [...CONNECTING, SLOW, ...NUDGES, MUTED]) clip(line.src);
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

const shuffled = (lines: Line[]) => [...lines].sort(() => Math.random() - 0.5);

function scheduleNudge() {
  clearTimeout(nudgeTimer);
  if (!nudgeHooks || nudgeCount >= MAX_NUDGES) return;
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

export function stopNudges() {
  nudgeToken += 1;
  clearTimeout(nudgeTimer);
  const audio = nudgeCurrent;
  nudgeCurrent = null;
  nudgeHooks?.onLine('');
  nudgeHooks = null;
  fadeOut(audio);
}

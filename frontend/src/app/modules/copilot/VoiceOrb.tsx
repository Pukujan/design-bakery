import { themeColor } from '../../theme/spaceTheme';
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { audioLevel, useVoice, voice } from './voice';
import { pickOrigin } from './skyOrigin';
import './voice-orb.css';

type Mode = 'connecting' | 'listening' | 'speaking';
type Offset = { x: number; y: number };

/** Warm-up lines typed while the call connects. They are not the agent's speech. */
const WARM_UP_LINES = [
  'Connecting now. Want to ask about my experience?',
  'Curious about my projects? I can walk you through them.',
  'Would you like to book a free consultation?',
  'Did you know I offer managed AI copilots for individual websites?',
  'Want to talk through a service?',
];

/** How long the orb waits after the visitor lets go before it drifts back to its edge. */
const RETURN_AFTER_MS = 4000;
const EDGE_MARGIN = 8;
const STAR_COUNT = 90;
const starColors = () => [themeColor('--lab-accent', '#c6f432'), themeColor('--lab-cool', '#3aa7ff'), '#ffffff', themeColor('--lab-violet', '#8f7bff')];
const GATHER_MS = 2600;

/**
 * DEV-only preview. ?voiceDemo=connecting|listening|speaking renders the orb in that state
 * with a simulated level and no network call. Production builds never read the URL.
 */
function readDemo(): Mode | null {
  if (!import.meta.env.DEV) return null;
  const value = new URLSearchParams(window.location.search).get('voiceDemo');
  return value === 'connecting' || value === 'listening' || value === 'speaking' ? value : null;
}

/** Simulated level for the preview, so each state looks like a live call. */
function demoLevel(mode: Mode, t: number): number {
  if (mode === 'connecting') return 0.06 + 0.03 * Math.sin(t * 2);
  if (mode === 'listening') return 0.28 + 0.24 * Math.abs(Math.sin(t * 4.1) * Math.sin(t * 1.7 + 1));
  return 0.42 + 0.45 * Math.abs(Math.sin(t * 5.3) * Math.cos(t * 2.1));
}

/** The level the rings follow: the visitor's mic while listening, the agent's audio while speaking. */
function liveLevel(mode: Mode, t: number, muted: boolean): number {
  if (mode === 'connecting') return 0.06 + 0.03 * Math.sin(t * 2);
  if (mode === 'listening') return muted ? 0 : audioLevel('user');
  return audioLevel('agent');
}

/** Lines typed one character at a time, then erased, looping through the cached set. Reduced motion swaps them without typing. */
function WarmUpLine({ reduceMotion }: { reduceMotion: boolean }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (reduceMotion) {
      let index = 0;
      setText(WARM_UP_LINES[0]);
      const id = window.setInterval(() => {
        index = (index + 1) % WARM_UP_LINES.length;
        setText(WARM_UP_LINES[index]);
      }, 4000);
      return () => window.clearInterval(id);
    }
    let line = 0;
    let chars = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const full = WARM_UP_LINES[line];
      if (!deleting) {
        chars += 1;
        setText(full.slice(0, chars));
        if (chars === full.length) {
          deleting = true;
          timer = window.setTimeout(tick, 2200);
          return;
        }
        timer = window.setTimeout(tick, 34);
        return;
      }
      chars -= 1;
      setText(full.slice(0, chars));
      if (chars === 0) {
        deleting = false;
        line = (line + 1) % WARM_UP_LINES.length;
        timer = window.setTimeout(tick, 350);
        return;
      }
      timer = window.setTimeout(tick, 14);
    };
    timer = window.setTimeout(tick, 200);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <span className="vo-warm" aria-hidden="true">
      {text}
      {!reduceMotion && <i className="vo-caret" />}
    </span>
  );
}

/** Stars leave the black hole and gather into the orb at the bottom edge. Runs once per call. */
function GatherStars({ anchor, onDone }: { anchor: RefObject<HTMLElement | null>; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const orb = anchor.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !orb || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doneRef.current();
      return;
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const box = orb.getBoundingClientRect();
    const tx = box.left + box.width / 2;
    const ty = box.top + box.height / 2;
    const backdrop = document.querySelector('.lab-backdrop')?.getBoundingClientRect();
    const sx = backdrop ? backdrop.left + backdrop.width / 2 : width / 2;
    const sy = backdrop ? backdrop.top + backdrop.height / 2 : height * 0.4;
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    const distance = Math.max(1, Math.hypot(tx - sx, ty - sy));
    const nx = -(ty - sy) / distance;
    const ny = (tx - sx) / distance;

    const palette = starColors();
    const stars = Array.from({ length: STAR_COUNT }, () => {
      const bow = (Math.random() - 0.5) * distance * 0.6;
      return {
        delay: Math.random() * 0.7,
        duration: 1.1 + Math.random() * 0.7,
        cx: mx + nx * bow,
        cy: my + ny * bow,
        radius: 0.8 + Math.random() * 1.8,
        color: palette[Math.floor(Math.random() * palette.length)],
      };
    });

    const started = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const t = (now - started) / 1000;
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        const p = Math.min(1, Math.max(0, (t - star.delay) / star.duration));
        if (p <= 0) continue;
        const e = p * p * (3 - 2 * p);
        const k = 1 - e;
        const x = k * k * sx + 2 * k * e * star.cx + e * e * tx;
        const y = k * k * sy + 2 * k * e * star.cy + e * e * ty;
        ctx.globalAlpha = Math.min(1, p * 4) * (p > 0.85 ? (1 - p) / 0.15 : 1);
        ctx.fillStyle = star.color;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, star.radius * (1 - 0.5 * e), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (t < GATHER_MS / 1000) frame = requestAnimationFrame(draw);
      else doneRef.current();
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [anchor]);

  return <canvas ref={canvasRef} className="vo-stars" aria-hidden="true" />;
}

/**
 * The voice call as a Siri-style orb docked to the bottom edge. Star particles gather into it
 * when a call starts. Its rings and glow follow the real audio level: the visitor's mic while
 * listening, the agent's voice while speaking. Drag it aside and it drifts back to its edge.
 * Mute and End call sit on it, with visible text, so no tooltip is needed.
 */
export default function VoiceOrb() {
  const live = useVoice();
  const reduceMotion = useReducedMotion() ?? false;
  const [demo] = useState<Mode | null>(readDemo);
  const [demoOrigin] = useState(pickOrigin);
  const origin = live.origin ?? demoOrigin;
  const mode: Mode | null = demo ?? (live.status === 'idle' ? null : live.status === 'connecting' ? 'connecting' : live.speaking === 'agent' ? 'speaking' : 'listening');
  const muted = !demo && live.muted;

  const orbRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const [gathering, setGathering] = useState(false);
  const previousMode = useRef<Mode | null>(null);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [nudge, setNudge] = useState(0);
  const drag = useRef<{ id: number; x: number; y: number; origin: Offset; rect: DOMRect } | null>(null);

  // Stars gather each time a call starts, not on every redraw.
  useEffect(() => {
    const from = previousMode.current;
    previousMode.current = mode;
    if (!mode) setGathering(false);
    else if (mode === 'connecting' && from !== 'connecting') setGathering(true);
  }, [mode]);

  // The rings and glow follow the level through a CSS variable, set per frame without re-rendering React.
  useEffect(() => {
    if (!mode) return;
    let frame = 0;
    let level = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = (now - started) / 1000;
      const raw = demo ? demoLevel(mode, t) : liveLevel(mode, t, muted);
      level += (raw - level) * (raw > level ? 0.4 : 0.14);
      orbRef.current?.style.setProperty('--lvl', level.toFixed(3));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mode, demo, muted]);

  // After the visitor lets go, drift back to the resting edge once they stop interacting.
  useEffect(() => {
    if (dragging || (offset.x === 0 && offset.y === 0)) return;
    const id = window.setTimeout(() => setOffset({ x: 0, y: 0 }), RETURN_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [dragging, offset.x, offset.y, nudge]);

  if (!mode) return null;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setNudge((n) => n + 1);
    if ((event.target as HTMLElement).closest('button')) return;
    const pill = pillRef.current;
    if (!pill) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: offset, rect: pill.getBoundingClientRect() };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const { rect } = current;
    const dx = Math.min(
      Math.max(event.clientX - current.x, EDGE_MARGIN - rect.left),
      window.innerWidth - EDGE_MARGIN - rect.right,
    );
    const dy = Math.min(
      Math.max(event.clientY - current.y, EDGE_MARGIN - rect.top),
      window.innerHeight - EDGE_MARGIN - rect.bottom,
    );
    setOffset({ x: current.origin.x + dx, y: current.origin.y + dy });
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    setNudge((n) => n + 1);
  };

  const label = muted
    ? 'Muted'
    : mode === 'connecting'
      ? 'Connecting'
      : mode === 'listening'
        ? origin.listening
        : origin.speaking;

  return (
    <>
      {gathering && <GatherStars anchor={orbRef} onDone={() => setGathering(false)} />}
      <div
        ref={pillRef}
        className={`vo vo-${mode}${muted ? ' vo-muted' : ''}${dragging ? ' vo-dragging' : ''}`}
        role="region"
        aria-label="Voice call"
        style={{ transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div ref={orbRef} className="vo-orb" aria-hidden="true">
          <span className="vo-ring vo-ring-1" />
          <span className="vo-ring vo-ring-2" />
          <span className="vo-ring vo-ring-3" />
          <span className="vo-core" />
        </div>
        <div className="vo-meta">
          <span className="vo-label" aria-live="polite">
            {label}
          </span>
          {mode === 'connecting' ? (
            live.hold ? <span className="vo-warm">{live.hold}</span> : <WarmUpLine reduceMotion={reduceMotion} />
          ) : live.hold ? (
            <span className="vo-sub">{live.hold}</span>
          ) : muted ? (
            <span className="vo-sub">Mic is off. I cannot hear you</span>
          ) : null}
        </div>
        <button
          type="button"
          className="vo-btn vo-mute"
          aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
          onClick={demo ? undefined : () => void voice.toggleMute()}
        >
          {muted ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
          <span>{muted ? 'Open channel' : 'Go silent'}</span>
        </button>
        <button
          type="button"
          className="vo-btn vo-end"
          aria-label="End call"
          onClick={demo ? undefined : () => voice.stop()}
        >
          <PhoneOff size={16} aria-hidden="true" />
          <span>End transmission</span>
        </button>
      </div>
    </>
  );
}

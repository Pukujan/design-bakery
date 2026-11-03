import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAgentCursor } from './agentCursor';
import { useVoice } from './voice';
import './moon-cursor.css';

type Mood = 'happy' | 'scared' | 'whee' | 'sleepy';

const SIZE = 46;
const MARGIN = 10;
/** How close the visitor's pointer may come before the moon bolts. */
const FLEE_RADIUS = 150;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * The agent's mascot, a small moon, for as long as a voice call is on. It wanders on its own, likes to sit on top of
 * the "Continue chat" button (and nod off there), runs from the visitor's pointer, and tumbles when the page is
 * scrolled or swiped. When the agent acts it rolls over to the link, presses it, and holds up a little scroll wheel
 * while the page glides.
 */
export default function MoonCursor() {
  const voice = useVoice();
  const agent = useAgentCursor();
  const reduceMotion = useReducedMotion() ?? false;
  const active = voice.status !== 'idle' || agent.visible;
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const agentRef = useRef(agent);
  agentRef.current = agent;
  const [mood, setMood] = useState<Mood>('happy');
  const [spinning, setSpinning] = useState(0);

  useEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;

    const pos = { x: window.innerWidth * 0.82, y: window.innerHeight * 0.7 };
    const vel = { x: 0, y: 0 };
    let target = { ...pos };
    const pointer = { x: -999, y: -999, at: -Infinity };
    let phase: 'perch' | 'wander' = 'wander';
    let phaseUntil = performance.now() + rand(4000, 7000);
    let fleeUntil = 0;
    let moodNow: Mood = 'happy';
    let moodUntil = 0;
    let lean = 0;
    let tilt = 0;
    let scrollY = window.scrollY;
    let lastTick = performance.now();
    let nextSpin = performance.now() + rand(25000, 40000);
    let raf = 0;

    const say = (next: Mood, forMs: number) => {
      moodUntil = performance.now() + forMs;
      if (moodNow !== next) {
        moodNow = next;
        setMood(next);
      }
    };

    const onPointer = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.at = performance.now();
    };
    const onScroll = () => {
      const dy = window.scrollY - scrollY;
      scrollY = window.scrollY;
      if (Math.abs(dy) < 2) return;
      tilt = clamp(tilt + Math.sign(dy) * 14, -40, 40);
      say('whee', 700);
    };
    let lastTouch: { x: number; y: number } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) lastTouch = { x: touch.clientX, y: touch.clientY };
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      pointer.x = touch.clientX;
      pointer.y = touch.clientY;
      pointer.at = performance.now();
      if (lastTouch) {
        // A swipe: the moon leans into it.
        lean = clamp(lean + (touch.clientX - lastTouch.x) * 0.5, -45, 45);
        tilt = clamp(tilt + (touch.clientY - lastTouch.y) * 0.25, -40, 40);
        say('whee', 600);
      }
      lastTouch = { x: touch.clientX, y: touch.clientY };
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    const place = (point: { x: number; y: number }) => ({
      x: clamp(point.x, MARGIN, window.innerWidth - SIZE - MARGIN),
      y: clamp(point.y, MARGIN + 56, window.innerHeight - SIZE - MARGIN),
    });

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;
      const a = agentRef.current;
      let stiffness = 28;

      if (a.visible) {
        // The agent is working: roll to where it points.
        target = place({ x: a.x - SIZE / 2 + 6, y: a.y - SIZE / 2 + 6 });
        stiffness = 46;
      } else {
        const cx = pos.x + SIZE / 2;
        const cy = pos.y + SIZE / 2;
        const dist = Math.hypot(cx - pointer.x, cy - pointer.y);
        if (!reduceMotion && now - pointer.at < 5000 && dist < FLEE_RADIUS) {
          // The visitor's pointer is too close: run the other way.
          const ux = dist > 1 ? (cx - pointer.x) / dist : 1;
          const uy = dist > 1 ? (cy - pointer.y) / dist : 0;
          target = place({ x: pos.x + ux * 260, y: pos.y + uy * 260 });
          fleeUntil = now + 900;
          stiffness = 90;
          say('scared', 900);
        } else if (now < fleeUntil) {
          stiffness = 60;
        } else {
          if (now > phaseUntil) {
            phase = phase === 'perch' ? 'wander' : 'perch';
            phaseUntil = now + (phase === 'perch' ? rand(12000, 22000) : rand(6000, 11000));
            if (phase === 'wander') target = place({ x: rand(0, window.innerWidth), y: rand(0, window.innerHeight) });
          }
          const pill = document.querySelector<HTMLElement>('.cp-pill');
          if (phase === 'perch' && pill) {
            // Sit on top of the Continue chat button.
            const rect = pill.getBoundingClientRect();
            target = place({ x: rect.left + rect.width * 0.7 - SIZE / 2, y: rect.top - SIZE + 12 });
            if (Math.hypot(pos.x - target.x, pos.y - target.y) < 6 && moodNow === 'happy') say('sleepy', 9000);
          } else if (phase === 'perch') {
            phase = 'wander';
            phaseUntil = now + rand(4000, 7000);
          } else if (Math.hypot(pos.x - target.x, pos.y - target.y) < 12) {
            // Drift to a new spot now and then.
            if (now > phaseUntil - 3000 && !reduceMotion) target = place({ x: rand(0, window.innerWidth), y: rand(0, window.innerHeight) });
          }
        }
      }

      if (reduceMotion) {
        pos.x = target.x;
        pos.y = target.y;
      } else {
        // A damped spring toward the target.
        const damping = 2 * Math.sqrt(stiffness) * 0.8;
        vel.x += ((target.x - pos.x) * stiffness - vel.x * damping) * dt;
        vel.y += ((target.y - pos.y) * stiffness - vel.y * damping) * dt;
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
      }

      lean *= 0.92;
      tilt *= 0.92;
      const roll = clamp(vel.x * 0.05, -28, 28) + lean + tilt * 0.4;
      root.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
      body.style.transform = `rotate(${roll.toFixed(1)}deg) scale(${1 + Math.min(0.18, Math.abs(vel.y) * 0.0006)}, ${1 - Math.min(0.12, Math.abs(vel.y) * 0.0004)})`;
      // The eyes follow the pointer.
      const eyes = eyesRef.current;
      if (eyes) {
        const ex = pointer.x - (pos.x + SIZE / 2);
        const ey = pointer.y - (pos.y + SIZE / 2);
        const len = Math.hypot(ex, ey) || 1;
        eyes.style.setProperty('--look-x', `${((ex / len) * 1.7).toFixed(2)}px`);
        eyes.style.setProperty('--look-y', `${((ey / len) * 1.3).toFixed(2)}px`);
      }
      if (moodNow !== 'happy' && now > moodUntil) {
        moodNow = 'happy';
        setMood('happy');
      }
      if (now > nextSpin) {
        nextSpin = now + rand(25000, 40000);
        setSpinning((n) => n + 1);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [active, reduceMotion]);

  if (!active) return null;
  const scroll = agent.scroll;
  const sign = scroll === 'up' ? -1 : 1;
  return (
    <div ref={rootRef} className={`moon${spinning ? ' moon-spin' : ''}`} key={spinning % 2} data-mood={mood} aria-hidden="true">
      <div ref={bodyRef} className="moon-body">
        <svg viewBox="0 0 48 48" width={SIZE} height={SIZE}>
          <defs>
            <radialGradient id="moon-fill" cx="35%" cy="30%" r="80%">
              <stop offset="0" stopColor="#fffdf3" />
              <stop offset="0.65" stopColor="#efe6c6" />
              <stop offset="1" stopColor="#d6c993" />
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="21" fill="url(#moon-fill)" stroke="rgb(11 11 10 / 0.65)" strokeWidth="1.4" />
          <circle cx="13.5" cy="15.5" r="3.2" fill="#d2c58f" opacity="0.75" />
          <circle cx="34" cy="34.5" r="4" fill="#d2c58f" opacity="0.7" />
          <circle cx="36" cy="14" r="2" fill="#d2c58f" opacity="0.7" />
          <ellipse cx="13.5" cy="29" rx="3.2" ry="2" fill="#ff9fb0" opacity="0.65" />
          <ellipse cx="34.5" cy="29" rx="3.2" ry="2" fill="#ff9fb0" opacity="0.65" />
          <g ref={eyesRef} className="moon-eyes">
            <ellipse className="moon-eye" cx="18.5" cy="23.5" rx="2.1" ry="2.8" fill="#2a2418" />
            <ellipse className="moon-eye" cx="29.5" cy="23.5" rx="2.1" ry="2.8" fill="#2a2418" />
            <path className="moon-eye-happy" d="M16 25 Q18.5 21 21 25 M27 25 Q29.5 21 32 25" fill="none" stroke="#2a2418" strokeWidth="1.8" strokeLinecap="round" />
            <path className="moon-eye-closed" d="M16.5 24.5 h4 M27.5 24.5 h4" fill="none" stroke="#2a2418" strokeWidth="1.8" strokeLinecap="round" />
          </g>
          <path className="moon-mouth-happy" d="M20.5 30 Q24 33.5 27.5 30" fill="none" stroke="#2a2418" strokeWidth="1.7" strokeLinecap="round" />
          <circle className="moon-mouth-scared" cx="24" cy="31.5" r="2.4" fill="#2a2418" />
          <path className="moon-mouth-whee" d="M19.5 29.5 Q24 36 28.5 29.5 Z" fill="#2a2418" />
        </svg>
        <span className="moon-zzz">z z</span>
        <AnimatePresence>
          {scroll && (
            <motion.div
              key="wheel"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              style={{ position: 'absolute', left: -26, top: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
            >
              <span style={{ position: 'relative', display: 'block', width: 14, height: 22, borderRadius: 8, border: '2px solid var(--lab-accent, #c6f432)', background: 'rgb(11 11 10 / 0.55)' }}>
                <motion.span
                  animate={reduceMotion ? undefined : { y: scroll === 'down' ? [0, 9, 0] : [9, 0, 9] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ position: 'absolute', left: 3, top: 3, width: 4, height: 4, borderRadius: 4, background: 'var(--lab-accent, #c6f432)' }}
                />
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.8 }}>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={reduceMotion ? undefined : { opacity: [0.2, 1, 0.2], y: [0, 3 * sign, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: (scroll === 'down' ? i : 2 - i) * 0.15 }}
                    style={{ color: 'var(--lab-accent, #c6f432)', font: '700 10px/1 var(--lab-mono, monospace)' }}
                  >
                    {scroll === 'down' ? '▼' : '▲'}
                  </motion.span>
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {agent.visible && <span className="moon-label">AI Pujan</span>}
        <AnimatePresence>
          {agent.presses > 0 && agent.visible && (
            <motion.span
              key={agent.presses}
              initial={{ scale: 0.3, opacity: 0.9 }}
              animate={{ scale: 2.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              style={{ position: 'absolute', left: 8, top: 8, width: 22, height: 22, borderRadius: 999, border: '2px solid var(--lab-accent, #c6f432)' }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

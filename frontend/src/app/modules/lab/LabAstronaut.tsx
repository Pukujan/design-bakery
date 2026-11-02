import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useCopilot } from '../copilot/store';
import './astronaut.css';

/** How far along the pill the astronaut walks, and how fast. */
const WALK_SPAN = 150;
const WALK_SPEED = 36;
/** Where it sits on the pill, and where it stands beside the open chat panel. */
const SIT_RIGHT = 46;
const CHAT_RIGHT = 470;

const deg = (angle: number) => `rotate(${angle.toFixed(2)}deg)`;

/**
 * A small astronaut in the foreground (TASK-DB-0098), above the copilot pill. It sits, then walks
 * along the pill with a steady gait, and turns at each end. Press it to hop and wave. When the chat
 * opens it walks to the panel's edge and waves at it. One frame loop drives everything, so each change
 * eases in and out instead of jumping.
 */
export function LabAstronaut() {
  const { open } = useCopilot();
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const legLRef = useRef<SVGRectElement>(null);
  const legRRef = useRef<SVGRectElement>(null);
  const armLRef = useRef<SVGRectElement>(null);
  const armRRef = useRef<SVGRectElement>(null);
  const openRef = useRef(open);
  const reduceRef = useRef(reduceMotion);
  const pokeRef = useRef(0);
  openRef.current = open;
  reduceRef.current = reduceMotion;

  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    const legL = legLRef.current;
    const legR = legRRef.current;
    const armL = armLRef.current;
    const armR = armRRef.current;
    if (!root || !body || !legL || !legR || !armL || !armR) return;

    const s = { x: 60, dir: 1, speed: 0, walking: false, timer: 2.5, phase: 0, right: SIT_RIGHT, wave: 0, facing: 1 };
    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const isOpen = openRef.current;
      const still = reduceRef.current;

      // While the chat is closed it alternates between sitting and walking, on its own timer.
      if (!isOpen && !still) {
        s.timer -= dt;
        if (s.timer <= 0) {
          s.walking = !s.walking;
          s.timer = s.walking ? 4 + Math.random() * 2 : 2.5 + Math.random() * 2;
        }
      }

      // The speed eases toward its target, and slows as it nears an end before turning round.
      const edge = Math.min(1, s.x / 14, (WALK_SPAN - s.x) / 14);
      const targetSpeed = !isOpen && s.walking && !still ? WALK_SPEED * Math.max(0.25, edge) : 0;
      s.speed += (targetSpeed - s.speed) * Math.min(1, dt * 3);

      if (isOpen) {
        s.x += (0 - s.x) * Math.min(1, dt * 4);
      } else {
        s.x += s.dir * s.speed * dt;
        if (s.x >= WALK_SPAN) {
          s.x = WALK_SPAN;
          s.dir = -1;
        }
        if (s.x <= 0) {
          s.x = 0;
          s.dir = 1;
        }
      }

      const walkAmount = Math.min(1, s.speed / WALK_SPEED);
      s.phase += dt * s.speed * 0.24;
      s.right += ((isOpen ? CHAT_RIGHT : SIT_RIGHT) - s.right) * Math.min(1, dt * 4);
      s.facing = isOpen ? 1 : s.dir;

      // A poke: a short hop, and the right arm waves for its length.
      pokeRef.current = Math.max(0, pokeRef.current - dt);
      const pokeProgress = pokeRef.current > 0 ? 1 - pokeRef.current : 0;
      const hop = pokeRef.current > 0 ? -16 * Math.sin(Math.PI * pokeProgress) : 0;
      const bob = -Math.abs(Math.sin(s.phase)) * 1.6 * walkAmount;

      // The wave eases in while the chat is open or while poked, and out again after.
      const waveTarget = isOpen || pokeRef.current > 0 ? 1 : 0;
      s.wave += (waveTarget - s.wave) * Math.min(1, dt * 6);
      const waving = -150 + Math.sin((now / 1000) * 6) * 12;

      // Legs swing with the gait while walking, and sway a little while sitting.
      const swing = Math.sin(s.phase) * 22 * walkAmount;
      const sway = Math.sin((now / 1000) * 1.6) * 3 * (1 - walkAmount);
      legL.style.transform = deg(swing + sway);
      legR.style.transform = deg(-swing + sway);
      armL.style.transform = deg(-swing * 0.7);
      armR.style.transform = deg((1 - s.wave) * swing * 0.7 + s.wave * waving);

      body.style.transform = `translateY(${(hop + bob).toFixed(2)}px)`;
      root.style.right = `${s.right.toFixed(2)}px`;
      root.style.transform = `translate3d(${(-s.x).toFixed(2)}px, 0, 0) scaleX(${s.facing})`;
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <button
      ref={rootRef}
      type="button"
      className="lab-astro"
      aria-label="Astronaut. Press to say hi."
      onClick={() => {
        pokeRef.current = 1;
      }}
    >
      <svg viewBox="0 0 80 96" aria-hidden="true" focusable="false">
        <g ref={bodyRef}>
          <rect className="lab-astro-pack" x="18" y="36" width="24" height="30" rx="7" />
          <rect ref={armLRef} className="lab-astro-arm" x="15" y="44" width="10" height="26" rx="5" />
          <rect ref={legLRef} className="lab-astro-leg" x="28" y="62" width="11" height="24" rx="5.5" />
          <rect ref={legRRef} className="lab-astro-leg" x="41" y="62" width="11" height="24" rx="5.5" />
          <rect className="lab-astro-body" x="23" y="38" width="34" height="34" rx="13" />
          <circle className="lab-astro-chest" cx="40" cy="52" r="2.6" />
          <rect ref={armRRef} className="lab-astro-arm" x="54" y="44" width="10" height="26" rx="5" />
          <circle className="lab-astro-helmet" cx="40" cy="24" r="17" />
          <path className="lab-astro-visor" d="M29 23 Q40 13 51 23 Q49 33 40 33 Q31 33 29 23Z" />
          <path className="lab-astro-shine" d="M33 20 Q36 17 40 17" />
        </g>
      </svg>
    </button>
  );
}

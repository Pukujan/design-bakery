import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { flowField } from '../lab/flow';
import { useAgentCursor } from './agentCursor';
import { nearestEdge } from './citeRoute';
import { useCopilot } from './store';
import { audioLevel, useVoice } from './voice';
import { agentCursor } from './agentCursor';
import './moon-cursor.css';

type Mood = 'happy' | 'scared' | 'whee' | 'sleepy' | 'wink' | 'love' | 'wow';

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
  const { messages, open: chatOpen } = useCopilot();
  const reduceMotion = useReducedMotion() ?? false;
  const active = voice.status !== 'idle' || agent.visible || agent.moonReturning;
  useEffect(() => agentCursor.setOnCall(voice.status !== 'idle'), [voice.status]);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const agentRef = useRef(agent);
  const talkingRef = useRef(false);
  const chatOpenRef = useRef(false);
  chatOpenRef.current = chatOpen;
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const [quip, setQuip] = useState('');
  // When the call ends the moon flies back into the call card, which stays up until it is in.
  const lastStatus = useRef(voice.status);
  useEffect(() => {
    const was = lastStatus.current;
    lastStatus.current = voice.status;
    if (voice.status !== 'idle') {
      if (agentRef.current.moonReturning) agentCursor.setMoon({ returning: false });
    } else if (was !== 'idle' && agentRef.current.moonOut) agentCursor.setMoon({ returning: true });
  }, [voice.status]);
  agentRef.current = agent;
  const [mood, setMood] = useState<Mood>('happy');
  const [spinning, setSpinning] = useState(0);

  useEffect(() => {
    if (!active) return;
    // The element is remounted now and then (to restart the spin), so the loop re-reads it every frame.
    let root = rootRef.current;
    let body = bodyRef.current;
    if (!root || !body) return;

    // The call card's orb is the moon's home: it starts there and leaves when the call connects.
    const orbCentre = () => {
      const rect = document.querySelector('.vo-core')?.getBoundingClientRect();
      return rect && rect.width > 0 ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
    };
    const pos = { x: window.innerWidth * 0.82, y: window.innerHeight * 0.7 };
    let launched = false;
    let swiping = false;
    let swipeStart = 0;
    let returnStart = 0;
    let leaveStart = 0;
    let leaveTo = { x: 0, y: 0 };
    let level = 0;
    const vel = { x: 0, y: 0 };
    let target = { ...pos };
    const pointer = { x: -999, y: -999, at: -Infinity };
    // The pointer's drift from the middle of the screen, which nudges the moon the way the sky parallaxes.
    const parallax = { x: 0, y: 0 };
    const centre = () => ({ x: pos.x + SIZE / 2, y: pos.y + SIZE / 2 });
    // Swirl: the pointer, the wheel, scrolling and swipes stir it up, and a stirred moon loops around its spot in wide,
    // smooth circles that slow down and settle as it calms.
    let swirl = 0;
    let swirlAngle = 0;
    let swirlDir = 1;
    const stir = (amount: number, direction?: number) => {
      swirl = clamp(swirl + amount, 0, 1);
      if (direction) swirlDir = Math.sign(direction) || swirlDir;
    };
    let anchor = { ...pos };
    let perched = false;
    let floatOffset = { x: 0, y: 0 };
    let floatAt = 0;
    let phaseUntil = performance.now() + rand(4000, 12000);
    let fleeUntil = 0;
    let moodNow: Mood = 'happy';
    let moodUntil = 0;
    let nextFace = performance.now() + rand(5000, 9000);
    let lean = 0;
    let tilt = 0;
    let scrollY = window.scrollY;
    let lastTick = performance.now();
    let nextSpin = performance.now() + rand(25000, 40000);
    let raf = 0;
    // A rare silly event: the body in the sky pulls the moon in, it spirals down, is swallowed, and pops out somewhere else.
    let fall: 'none' | 'pulled' | 'gone' = 'none';
    let fallStart = 0;
    let fallFrom = { d: 0, angle: 0 };
    let goneUntil = 0;
    let popAt = 0;
    let spinRoll = 0;
    let bubbleSide: 'left' | 'right' = 'right';
    let pullAt = performance.now() + rand(60000, 150000);
    if (import.meta.env.DEV) (window as unknown as { __moonPull?: () => void }).__moonPull = () => { pullAt = 0; };

    const say = (next: Mood, forMs: number) => {
      moodUntil = performance.now() + forMs;
      if (moodNow !== next) {
        moodNow = next;
        setMood(next);
        maybeQuip(next);
      }
    };

    // Little reactions: mostly a word in the bubble, now and then aloud. Never while it speaks, while the chat is open (it is
    // paying attention then), or while someone is talking.
    let nextQuip = performance.now() + 30_000;
    let quipTimer: ReturnType<typeof setTimeout> | undefined;
    const QUIPS: Partial<Record<Mood, Array<[string, string?]>>> = {
      whee: [['wheee!', 'whee'], ['hehe', 'hehe'], ['haha!', 'haha']],
      scared: [['eek!', 'eek'], ['whoa!', 'eek']],
      wink: [['hehe', 'hehe'], ['psst...']],
      love: [['aww', undefined], ['hehe', 'hehe']],
      wow: [['ooh!', 'ooh'], ['haha!', 'haha']],
    };
    const maybeQuip = (next: Mood) => {
      const now = performance.now();
      const options = QUIPS[next];
      const v = voiceRef.current;
      if (!options || agentRef.current.guest || now < nextQuip || talkingRef.current || chatOpenRef.current || v.thinking || v.speaking !== 'none') return;
      nextQuip = now + rand(40_000, 60_000);
      const [text, clipName] = options[Math.floor(Math.random() * options.length)];
      setQuip(text);
      clearTimeout(quipTimer);
      quipTimer = setTimeout(() => setQuip(''), 1600);
      // Aloud only rarely, and only when the call is quiet.
      if (clipName && Math.random() < 0.12 && v.status === 'connected') {
        const audio = new Audio(`/voice/quip-${clipName}.m4a`);
        audio.volume = 0.8;
        void audio.play().catch(() => undefined);
      }
    };

    const onPointer = (event: PointerEvent) => {
      const now = performance.now();
      const gap = now - pointer.at;
      if (!reduceMotion && !agentRef.current.visible && gap > 0 && gap < 200) {
        // A gust: moving the pointer near the moon pushes it the way the pointer is going, harder the closer it is.
        const c = centre();
        const near = clamp(1 - Math.hypot(c.x - event.clientX, c.y - event.clientY) / 380, 0, 1);
        vel.x += ((event.clientX - pointer.x) / gap) * 1000 * 0.008 * near;
        vel.y += ((event.clientY - pointer.y) / gap) * 1000 * 0.008 * near;
        if (near > 0.5) lean = clamp(lean + (event.clientX - pointer.x) * 0.3, -35, 35);
      }
      if (!reduceMotion && !agentRef.current.visible && gap > 0 && gap < 200) {
        // Any pointer movement, near or far, stirs the moon up, spinning the way the pointer sweeps.
        const speed = Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) / gap * 1000;
        stir(clamp(speed / 22000, 0, 0.05), event.clientX - pointer.x);
      }
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.at = now;
    };
    // A tap or click anywhere: a hop; right beside the moon, a startled jump away from it.
    const onTap = (event: PointerEvent) => {
      if (reduceMotion || agentRef.current.visible) return;
      const c = centre();
      const dist = Math.hypot(c.x - event.clientX, c.y - event.clientY);
      if (dist < 120) {
        const ux = dist > 1 ? (c.x - event.clientX) / dist : 1;
        const uy = dist > 1 ? (c.y - event.clientY) / dist : -1;
        vel.x += ux * 420;
        vel.y += uy * 420 - 120;
        say('scared', 900);
      } else {
        vel.y -= 170;
        say('whee', 600);
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (reduceMotion || agentRef.current.visible) return;
      // Scrolling the page blows the moon along like everything else on the page.
      vel.y -= clamp(event.deltaY, -120, 120) * 1.0;
      tilt = clamp(tilt + Math.sign(event.deltaY) * 8, -40, 40);
      stir(Math.min(0.3, Math.abs(event.deltaY) / 500), event.deltaY);
    };
    const onScroll = () => {
      const dy = window.scrollY - scrollY;
      scrollY = window.scrollY;
      if (Math.abs(dy) < 2) return;
      if (!reduceMotion && !agentRef.current.visible) {
        vel.y -= clamp(dy, -80, 80) * 1.6;
        stir(Math.min(0.3, Math.abs(dy) / 180), dy);
      }
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
        if (!reduceMotion && !agentRef.current.visible) {
          // The swipe carries the moon with it.
          vel.x = clamp(vel.x + (touch.clientX - lastTouch.x) * 9, -700, 700);
          vel.y = clamp(vel.y + (touch.clientY - lastTouch.y) * 9, -700, 700);
          stir(Math.min(0.35, (Math.abs(touch.clientX - lastTouch.x) + Math.abs(touch.clientY - lastTouch.y)) / 120), touch.clientX - lastTouch.x);
        }
        say('whee', 600);
      }
      lastTouch = { x: touch.clientX, y: touch.clientY };
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onTap, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    const place = (point: { x: number; y: number }) => ({
      x: clamp(point.x, MARGIN, window.innerWidth - SIZE - MARGIN),
      y: clamp(point.y, MARGIN + 56, window.innerHeight - SIZE - MARGIN),
    });

    const frame = (now: number) => {
      // Placed at once, so a frame that is late (a hidden tab) never leaves it in the corner.
    root.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
    raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;
      root = rootRef.current ?? root;
      body = bodyRef.current ?? body;
      const a = agentRef.current;
      if (!a.scroll && swiping) {
        swiping = false;
        root.dataset.grab = '';
      }
      if (!a.leaving) leaveStart = 0;
      if (!launched && !a.moonReturning) {
        const home = orbCentre();
        if (voiceRef.current.status === 'connecting' && home) {
          // Waiting in the card while the call connects.
          pos.x = home.x - SIZE / 2;
          pos.y = home.y - SIZE / 2;
          vel.x = 0;
          vel.y = 0;
          target = { ...pos };
          root.style.opacity = '0';
          root.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
          return;
        }
        // Connected: out it comes, up and away from the card.
        launched = true;
        if (home && !reduceMotion) {
          pos.x = home.x - SIZE / 2;
          pos.y = home.y - SIZE / 2;
          vel.x = rand(-260, 260);
          vel.y = -620;
          popAt = now;
          say('whee', 1400);
        }
        else if (a.guest && a.entry && !reduceMotion) {
          // A guest on a text chat's errand: in from just past the nearest edge, already heading for the link.
          pos.x = a.entry.x;
          pos.y = a.entry.y;
          vel.x = a.entry.x < 0 ? 320 : a.entry.x > window.innerWidth ? -320 : 0;
          vel.y = a.entry.y < 0 ? 320 : a.entry.y > window.innerHeight ? -320 : 0;
        }
        target = place({ x: rand(0, window.innerWidth), y: rand(0, window.innerHeight * 0.7) });
        anchor = { ...target };
        root.style.opacity = '1';
        agentCursor.setMoon({ out: true });
      }
      // The rings around the moon follow the call's level: the visitor's voice while listening, the agent's while it speaks.
      const raw = Math.max(voiceRef.current.muted ? 0 : audioLevel('user'), audioLevel('agent'));
      level += (raw - level) * (raw > level ? 0.4 : 0.14);
      root.style.setProperty('--lvl', level.toFixed(3));
      // Lazy and unhurried by default; quicker only to run from the pointer, and when the agent is going somewhere.
      let stiffness = 7;
      const hole = reduceMotion ? undefined : flowField.obstacles.find((o) => o.kind === 'disc' && o.r > 14 && Number.isFinite(o.x) && Number.isFinite(o.y) && Number.isFinite(o.r));
      if (!Number.isFinite(pos.x + pos.y + vel.x + vel.y + target.x + target.y)) {
        // A bad number must never strand the moon (the browser drops a NaN transform and leaves it in the corner): start over.
        pos.x = window.innerWidth * 0.5;
        pos.y = window.innerHeight * 0.6;
        vel.x = 0;
        vel.y = 0;
        target = { ...pos };
        anchor = { ...pos };
        spinRoll = 0;
        swirl = 0;
        fall = 'none';
        root.style.opacity = '1';
      }

      if (fall === 'gone') {
        if (now < goneUntil) return;
        // Out it comes, somewhere else, tiny and then growing.
        fall = 'none';
        pos.x = rand(MARGIN, window.innerWidth - SIZE - MARGIN);
        pos.y = rand(MARGIN + 56, window.innerHeight - SIZE - MARGIN);
        vel.x = 0;
        vel.y = 0;
        target = { ...pos };
        anchor = { ...pos };
        popAt = now;
        root.style.opacity = '1';
        say('whee', 1400);
      }
      if (fall === 'none' && hole && hole.kind === 'disc' && !a.visible && !talkingRef.current && !chatOpenRef.current && now > pullAt) {
        const c = centre();
        fall = 'pulled';
        fallStart = now;
        fallFrom = { d: Math.max(80, Math.hypot(c.x - hole.x, c.y - hole.y)), angle: Math.atan2(c.y - hole.y, c.x - hole.x) };
        swirl = 0;
        say('scared', 9000);
      }

      if (a.moonReturning) {
        // The call has ended: back into the card, shrinking as it goes in.
        const home = orbCentre();
        if (!returnStart) returnStart = now;
        target = home ? { x: home.x - SIZE / 2, y: home.y - SIZE / 2 } : { ...pos };
        stiffness = 24;
        const close = home ? Math.hypot(pos.x - target.x, pos.y - target.y) < 12 : true;
        if (now - returnStart > 1600 || (close && now - returnStart > 500)) {
          root.style.opacity = '0';
          agentCursor.setMoon({ out: false, returning: false });
          return;
        }
      } else if (fall === 'pulled') {
        if (!hole || hole.kind !== 'disc' || a.visible) {
          fall = 'none';
          pullAt = now + rand(90000, 200000);
        } else {
          // A slow drift at first, then faster and tighter: a spiral down to the middle.
          const t = (now - fallStart) / 1000;
          const p = clamp(t / 5.5, 0, 1);
          const e = p * p;
          const angle = fallFrom.angle + e * Math.PI * 3;
          const radius = fallFrom.d * (1 - e);
          target = { x: hole.x + Math.cos(angle) * radius - SIZE / 2, y: hole.y + Math.sin(angle) * radius - SIZE / 2 };
          stiffness = 4 + 50 * p;
          spinRoll += (160 + 1100 * p) * dt;
          if (p >= 1) {
            // Swallowed.
            fall = 'gone';
            goneUntil = now + rand(1800, 3200);
            pullAt = now + rand(90000, 200000);
            root.style.opacity = '0';
            spinRoll = 0;
            return;
          }
        }
      } else if (a.leaving) {
        // A guest's errand is done: out through the nearest edge.
        if (!leaveStart) {
          leaveStart = now;
          leaveTo = nearestEdge({ x: pos.x + SIZE / 2, y: pos.y + SIZE / 2 }, { width: window.innerWidth, height: window.innerHeight }, SIZE);
        }
        target = { x: leaveTo.x, y: leaveTo.y };
        stiffness = 14;
        const out = pos.x < -SIZE * 0.6 || pos.y < -SIZE * 0.6 || pos.x > window.innerWidth - SIZE * 0.4 || pos.y > window.innerHeight - SIZE * 0.4;
        if (out || now - leaveStart > 2400) {
          root.style.opacity = '0';
          agentCursor.finishGuest();
          return;
        }
      } else if (a.visible && a.scroll) {
        // The agent swipes the page: the moon presses on it and pulls it along (up to scroll down, down to scroll up), lifts,
        // and goes back for another stroke while the page glides.
        if (!swiping) {
          swiping = true;
          swipeStart = now;
        }
        const cycle = ((now - swipeStart) % 1200) / 1200;
        const pressing = cycle < 0.72;
        const along = pressing ? 1 - Math.pow(1 - cycle / 0.72, 3) : 1 - (cycle - 0.72) / 0.28;
        const dir = a.scroll === 'down' ? -1 : 1;
        const stroke = Math.min(220, window.innerHeight * 0.28);
        target = place({ x: window.innerWidth * (window.innerWidth < 700 ? 0.6 : 0.62), y: window.innerHeight * 0.5 - dir * stroke * 0.5 + dir * stroke * along - SIZE / 2 });
        stiffness = pressing ? 70 : 90;
        root.dataset.grab = pressing ? '1' : '';
      } else if (a.visible) {
        // The agent is working: roll to where it points.
        target = place({ x: a.x - SIZE / 2 + 6, y: a.y - SIZE / 2 + 6 });
        stiffness = 40;
      } else {
        const cx = pos.x + SIZE / 2;
        const cy = pos.y + SIZE / 2;
        const dist = Math.hypot(cx - pointer.x, cy - pointer.y);
        const talking = talkingRef.current;
        const watching = chatOpenRef.current;
        if (!talking && !watching && !reduceMotion && now - pointer.at < 5000 && dist < FLEE_RADIUS) {
          // The visitor's pointer is too close: run the other way.
          const ux = dist > 1 ? (cx - pointer.x) / dist : 1;
          const uy = dist > 1 ? (cy - pointer.y) / dist : 0;
          target = place({ x: pos.x + ux * 260, y: pos.y + uy * 260 });
          fleeUntil = now + 900;
          stiffness = 26;
          say('scared', 900);
        } else if (now < fleeUntil) {
          stiffness = 18;
        } else {
          const pill = document.querySelector<HTMLElement>('.cp-pill');
          const panel = watching ? document.querySelector<HTMLElement>('.cp-panel') : null;
          if (panel) {
            // The chat is open: sit beside the composer (or on the sheet's edge on a phone) and pay attention.
            const rect = panel.getBoundingClientRect();
            anchor = rect.left > SIZE + 24
              ? place({ x: rect.left - SIZE - 12, y: rect.bottom - 150 })
              : place({ x: rect.right - SIZE - 16, y: rect.top - SIZE - 6 });
            perched = true;
            phaseUntil = now + 2000;
          } else if (now > phaseUntil && !talking) {
            // A long trip now and then, 4 to 28 seconds apart; the Continue chat button is one of the places.
            phaseUntil = now + rand(4000, 28000);
            if (pill && Math.random() < 0.35) {
              const rect = pill.getBoundingClientRect();
              anchor = place({ x: rect.left + rect.width * 0.7 - SIZE / 2, y: rect.top - SIZE + 12 });
              perched = true;
            } else {
              anchor = place({ x: rand(0, window.innerWidth), y: rand(0, window.innerHeight) });
              perched = false;
            }
          }
          if (now > floatAt) {
            // Short floats, often: a small drift around where it is. While it speaks it stays near one place, so the words can be read.
            const reach = talking ? 16 : perched ? 8 : 46;
            floatAt = now + (talking ? rand(2500, 4500) : rand(1200, 3200));
            floatOffset = { x: rand(-reach, reach), y: rand(-reach, reach) };
          }
          target = place({ x: anchor.x + floatOffset.x, y: anchor.y + floatOffset.y });
          if (talking) stiffness = 4;
          else if (perched && Math.hypot(pos.x - target.x, pos.y - target.y) < 10 && moodNow === 'happy') say('sleepy', 9000);
        }
      }

      if (!a.visible && !reduceMotion && !talkingRef.current && now - pointer.at < 8000) {
        // The moon floats a little against the pointer, the way the sky behind the page does.
        parallax.x += ((pointer.x - window.innerWidth / 2) * -0.05 - parallax.x) * 0.04;
        parallax.y += ((pointer.y - window.innerHeight / 2) * -0.05 - parallax.y) * 0.04;
      } else {
        parallax.x *= 0.96;
        parallax.y *= 0.96;
      }
      // Stirred up, it loops around its spot: faster and wider the more it is stirred, settling as it calms.
      if (talkingRef.current) swirl *= 0.1;
      swirl *= Math.pow(0.55, dt);
      swirlAngle += (0.9 + 2.6 * swirl) * swirlDir * dt;
      const loopX = a.visible || reduceMotion ? 0 : Math.cos(swirlAngle) * 190 * swirl;
      const loopY = a.visible || reduceMotion ? 0 : Math.sin(swirlAngle) * 120 * swirl;
      // The spot it heads for, with the pointer's parallax and the swirl laid over the plan (the plan itself is untouched).
      const goal = fall === 'pulled' || a.moonReturning || a.leaving ? target : place({ x: target.x + (a.visible ? 0 : parallax.x) + loopX, y: target.y + (a.visible ? 0 : parallax.y) + loopY });
      if (reduceMotion) {
        pos.x = target.x;
        pos.y = target.y;
      } else {
        stiffness += 16 * swirl;
        // A damped spring toward the target.
        const damping = 2 * Math.sqrt(stiffness) * 0.8;
        vel.x += ((goal.x - pos.x) * stiffness - vel.x * damping) * dt;
        vel.y += ((goal.y - pos.y) * stiffness - vel.y * damping) * dt;
        pos.x += vel.x * dt;
        pos.y += vel.y * dt;
      }

      if (fall !== 'pulled') spinRoll *= 0.9;
      // The bubble opens toward the side with room, and swings over gracefully (the CSS eases it) when the moon nears an edge.
      const bubbleW = Math.min(240, window.innerWidth * 0.6) + 12;
      const roomRight = window.innerWidth - pos.x;
      const flipLeft = bubbleSide === 'right' ? roomRight < bubbleW && pos.x + SIZE > roomRight : !(roomRight > bubbleW + 90);
      const side = flipLeft ? 'left' : 'right';
      if (side !== bubbleSide) {
        bubbleSide = side;
        root.dataset.side = side;
      }
      lean *= 0.92;
      tilt *= 0.92;
      const roll = clamp(vel.x * 0.05, -28, 28) + lean + tilt * 0.4 + spinRoll;
      const shrink = a.moonReturning ? 1 - clamp((now - returnStart) / 1400, 0, 1) * 0.9 : fall === 'pulled' ? 1 - Math.pow(clamp((now - fallStart) / 5500, 0, 1), 1.6) * 0.9 : popAt ? 0.1 + 0.9 * clamp((now - popAt) / 700, 0, 1) : 1;
      root.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
      body.style.transform = `rotate(${roll.toFixed(1)}deg) scale(${(1 + Math.min(0.18, Math.abs(vel.y) * 0.0006)) * shrink}, ${(1 - Math.min(0.12, Math.abs(vel.y) * 0.0004)) * shrink})`;
      // The eyes follow the pointer.
      const eyes = eyesRef.current;
      if (eyes) {
        const watched = chatOpenRef.current ? document.querySelector('.cp-panel')?.getBoundingClientRect() : null;
        const ex = (watched ? watched.left + watched.width / 2 : pointer.x) - (pos.x + SIZE / 2);
        const ey = (watched ? watched.bottom - 100 : pointer.y) - (pos.y + SIZE / 2);
        const len = Math.hypot(ex, ey) || 1;
        eyes.style.setProperty('--look-x', `${((ex / len) * 1.7).toFixed(2)}px`);
        eyes.style.setProperty('--look-y', `${((ey / len) * 1.3).toFixed(2)}px`);
      }
      if (moodNow !== 'happy' && now > moodUntil) {
        moodNow = 'happy';
        setMood('happy');
      }
      if (now > nextFace && moodNow === 'happy' && !chatOpenRef.current) {
        // An odd little face now and then, so it is never just smiling.
        nextFace = now + rand(6000, 14000);
        const faces: Mood[] = ['wink', 'love', 'wow'];
        say(faces[Math.floor(Math.random() * faces.length)], 1500);
      }
      if (now > nextSpin) {
        nextSpin = now + rand(25000, 40000);
        setSpinning((n) => n + 1);
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      clearTimeout(quipTimer);
      agentCursor.setMoon({ out: false });
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onTap);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [active, reduceMotion]);

  // What the moon says: the line being spoken while it connects or reminds, dots while it thinks, and the start of the
  // answer while it speaks.
  const lastReply = [...messages].reverse().find((m) => m.role === 'assistant' && m.text)?.text ?? '';
  const excerpt = lastReply.length > 120 ? `${lastReply.slice(0, 117).trimEnd()}...` : lastReply;
  const bubble: { kind: 'text' | 'dots'; text: string } | null = voice.hold
    ? { kind: 'text', text: voice.hold }
    : agent.caption
      ? { kind: 'text', text: agent.caption }
      : voice.thinking
      ? { kind: 'dots', text: '' }
      : voice.speaking === 'agent' && excerpt
        ? { kind: 'text', text: excerpt }
        : quip
          ? { kind: 'text', text: quip }
          : null;
  talkingRef.current = bubble !== null;
  if (!active) return null;
  return (
    <div ref={rootRef} className={`moon${spinning ? ' moon-spin' : ''}`} key={spinning % 2} data-mood={mood} data-act={voice.thinking ? 'thinking' : voice.speaking === 'agent' || voice.hold || quip ? 'talking' : undefined} aria-hidden="true">
      <span className="moon-ring moon-ring-1" />
      <span className="moon-ring moon-ring-2" />
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
          <ellipse className="moon-mouth-talk" cx="24" cy="31.5" rx="3.1" ry="2.6" fill="#2a2418" />
          <path className="moon-mouth-think" d="M20.5 31.5 q1.75 -2 3.5 0 t3.5 0" fill="none" stroke="#2a2418" strokeWidth="1.6" strokeLinecap="round" />
          <path className="moon-eye-wink" d="M27 24.5 h5" fill="none" stroke="#2a2418" strokeWidth="1.8" strokeLinecap="round" />
          <path className="moon-eye-love" d="M18.5 27 c-4 -2.6 -3.4 -6.2 -0.9 -5.8 c0.7 0.1 0.9 0.6 0.9 0.9 c0 -0.3 0.2 -0.8 0.9 -0.9 c2.5 -0.4 3.1 3.2 -0.9 5.8 Z M29.5 27 c-4 -2.6 -3.4 -6.2 -0.9 -5.8 c0.7 0.1 0.9 0.6 0.9 0.9 c0 -0.3 0.2 -0.8 0.9 -0.9 c2.5 -0.4 3.1 3.2 -0.9 5.8 Z" fill="#ff5f7e" />
        </svg>
        <span className="moon-zzz">z z</span>
        <span className="moon-grab" />
        <div className="moon-bubble-anchor">
        <AnimatePresence>
          {bubble && (
            <motion.div
              key={bubble.kind === 'dots' ? 'dots' : bubble.text}
              className="moon-bubble"
              initial={{ opacity: 0, scale: 0.6, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {bubble.kind === 'dots' ? (
                <span className="moon-dots">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                bubble.text
              )}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
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

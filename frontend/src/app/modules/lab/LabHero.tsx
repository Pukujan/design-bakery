import { useCallback, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { LabCopilot } from './LabCopilot';

const EASE = [0.2, 0.7, 0.1, 1] as const;
const TITLE = 'Design Baker';
const ACCENT_INDEX = 8; // the "a" in Baker

/** Letters touched by the pointer flip to the serif italic for a moment. */
function useFlippedLetters() {
  const [flipped, setFlipped] = useState<ReadonlySet<number>>(new Set());
  const timers = useRef(new Map<number, number>());

  const flip = useCallback((index: number) => {
    setFlipped((prev) => new Set(prev).add(index));
    window.clearTimeout(timers.current.get(index));
    timers.current.set(
      index,
      window.setTimeout(() => {
        setFlipped((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }, 900),
    );
  }, []);

  return { flipped, flip };
}

export function LabHero() {
  const reduceMotion = useReducedMotion();
  const { flipped, flip } = useFlippedLetters();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '-35%']);

  return (
    <section ref={sectionRef} className="lab-hero" aria-labelledby="lab-hero-title">
      <div className="lab-hero-glow" aria-hidden="true" />
      <div className="lab-hero-grid" aria-hidden="true" />

      <motion.h1
        id="lab-hero-title"
        className="lab-hero-title"
        aria-label={TITLE}
        style={reduceMotion ? undefined : { y: titleY }}
      >
        <span className="lab-hero-line" aria-hidden="true">
          {TITLE.split('').map((char, index) => {
            if (char === ' ') return <span key={index} className="lab-letter-gap" />;
            const isAccent = index === ACCENT_INDEX || flipped.has(index);
            return (
              <motion.span
                key={index}
                className={`lab-letter${isAccent ? ' lab-letter--accent' : ''}`}
                initial={reduceMotion ? false : { y: '110%', rotate: 8 }}
                animate={{ y: '0%', rotate: 0 }}
                transition={{ duration: 1.1, delay: 0.1 + index * 0.045, ease: EASE }}
                onPointerEnter={() => flip(index)}
              >
                {char}
              </motion.span>
            );
          })}
        </span>
      </motion.h1>

      <p className="lab-hero-roles lab-mono">AI Product Engineer · A one-person studio, from research to production</p>

      <div className="lab-hero-body">
        <motion.div
          className="lab-hero-chat"
          initial={reduceMotion ? false : { opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.85, ease: EASE }}
        >
          <LabCopilot />
        </motion.div>
      </div>

      <a href="#work" className="lab-scroll-hint lab-mono" data-cursor="Work">
        Scroll for selected work <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}

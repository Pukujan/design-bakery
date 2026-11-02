import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { PageSeo } from '@/seo/PageSeo';
import { LabHero } from './LabHero';
import { LabWork } from './LabWork';
import { LabMarquee } from './LabMarquee';
import { LabCursor } from './LabCursor';
import './lab.css';

const LOGO_FONTS = ['var(--lab-display)', 'var(--lab-serif)', 'var(--lab-mono)'] as const;

/** The logo's last letter cycles through the three type families. */
function LabLogo() {
  const reduceMotion = useReducedMotion();
  const [fontIndex, setFontIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setFontIndex((i) => (i + 1) % LOGO_FONTS.length), 1100);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <a href="/lab" className="lab-logo" aria-label="Design Baker, lab home">
      D
      <motion.span
        key={fontIndex}
        className="lab-logo-glyph"
        style={{ fontFamily: LOGO_FONTS[fontIndex], fontStyle: fontIndex === 1 ? 'italic' : 'normal' }}
        initial={reduceMotion ? false : { y: '-40%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        B
      </motion.span>
    </a>
  );
}

/** Smooth wheel scrolling; skipped when the visitor asks for reduced motion. */
function useLenis() {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    const lenis = new Lenis({ autoRaf: true, anchors: true });
    return () => lenis.destroy();
  }, [reduceMotion]);
}

/** Redesign prototype for the homepage (TASK-DB-0098). Not linked, not indexed. */
export function LabHome() {
  useLenis();
  const [cursorActive, setCursorActive] = useState(false);
  const handleCursorActive = useCallback((active: boolean) => setCursorActive(active), []);

  return (
    <div className={`lab-root${cursorActive ? ' lab-has-cursor' : ''}`}>
      <PageSeo
        title="Lab | Design Baker"
        description="Homepage redesign prototype."
        canonicalPath="/lab"
        robots="noindex, nofollow"
      />
      <LabCursor onActiveChange={handleCursorActive} />

      <header className="lab-bar">
        <LabLogo />
        <nav className="lab-nav lab-mono" aria-label="Lab">
          <a href="#work">Work</a>
          <a href="/blogs">Writing</a>
          <a href="/#contact">Contact</a>
        </nav>
      </header>

      <main>
        <LabHero />
        <LabMarquee>
          Software you can <em>trust</em> — built end to end —
        </LabMarquee>
        <LabWork />
      </main>

      <footer className="lab-footer lab-mono">
        <span>Design Baker · {new Date().getFullYear()}</span>
        <a href="/" data-cursor="Back">
          Current homepage →
        </a>
      </footer>
    </div>
  );
}

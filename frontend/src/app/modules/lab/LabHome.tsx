import { useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { PageSeo } from '@/seo/PageSeo';
import { LabHero } from './LabHero';
import { LabWork } from './LabWork';
import { LabMarquee } from './LabMarquee';
import { LabCursor } from './LabCursor';
import { LabAbout, LabExperience } from './LabStory';
import './lab.css';

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


      <main>
        <LabHero />
        <LabMarquee>
          Software you can <em>trust</em> — built end to end —
        </LabMarquee>
        <LabAbout />
        <LabWork />
        <LabExperience />
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

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocation, useOutlet } from 'react-router-dom';
import { LabBackdrop } from './LabBackdrop';
import { LabBar } from './LabHeader';
import { PortfolioProvider } from '../../portfolios/PortfolioContext';
import './lab.css';

const EASE = [0.2, 0.7, 0.1, 1] as const;

/**
 * The shared frame for the lab pages (/lab, /work/:slug, /contact). The black-hole backdrop and
 * the header stay mounted while the page changes, so moving between them only fades the content.
 */
export function LabStage() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion();

  // The stage is always dark, so the dark variants of the paper figures and styles apply here.
  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) return;
    root.classList.add('dark');
    return () => root.classList.remove('dark');
  }, []);

  return (
    <PortfolioProvider portfolioId="endtoend-engineer">
    <div className="lab-stage">
      <LabBackdrop />
      <LabBar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className="lab-stage-page"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          {outlet}
        </motion.div>
      </AnimatePresence>
    </div>
    </PortfolioProvider>
  );
}

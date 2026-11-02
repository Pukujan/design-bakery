import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';

const LOGO_FONTS = ['var(--lab-display)', 'var(--lab-serif)', 'var(--lab-mono)'] as const;

/** The logo's last letter cycles through the three type families. */
export function LabLogo() {
  const reduceMotion = useReducedMotion();
  const [fontIndex, setFontIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setFontIndex((i) => (i + 1) % LOGO_FONTS.length), 1100);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <Link to="/lab" className="lab-logo" aria-label="Design Baker, home">
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
    </Link>
  );
}

/** The top bar on every lab-styled page: the logo, then the four places a visitor goes. */
export function LabBar() {
  return (
    <header className="lab-bar">
      <LabLogo />
      <nav className="lab-nav lab-mono" aria-label="Site">
        <Link to="/lab#work">Work</Link>
        <Link to="/blogs">Writing</Link>
        <Link to="/research">Research</Link>
        <Link to="/contact">Contact</Link>
      </nav>
    </header>
  );
}

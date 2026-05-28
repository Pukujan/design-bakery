import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

const SHOW_AFTER_PX = 420;

export function BlogScrollToTopFab() {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <motion.button
      type="button"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={reduceMotion ? undefined : { scale: 1.08, y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-5 sm:right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border-4 border-black bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-gray-900 dark:text-white dark:border-gray-600"
      aria-label="Back to top"
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </motion.button>
  );
}

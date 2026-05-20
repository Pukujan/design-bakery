import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Mail, X } from 'lucide-react';
import { useSocialLinksContent } from '@/lib/contentHooks';
import { resolveIcon } from '@/lib/iconResolver';

/**
 * Blog detail only — floating contact speed-dial (Phase 0).
 * Data: social-links.json / Firestore via useSocialLinksContent.
 */
export function BlogContactFab() {
  const links = useSocialLinksContent();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!links.length) return null;

  const menuWidth = 'w-[13rem] sm:w-[14rem]';

  return (
    <div
      ref={rootRef}
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 grid justify-items-end gap-3 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className={`${menuWidth} pointer-events-auto grid gap-2.5`}
            role="menu"
            aria-label="Contact links"
          >
            {links.map((link, index) => {
              const Icon = resolveIcon(link.icon);
              return (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  role="menuitem"
                  initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: 8 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.04 }}
                  whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  className="grid w-full grid-cols-[1fr_2.75rem] items-center gap-x-3 rounded-full border-3 border-black bg-white py-2 pl-4 pr-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-gray-900"
                  onClick={() => setOpen(false)}
                >
                  <span className="truncate text-right text-sm font-black text-gray-900 dark:text-gray-100">
                    {link.name}
                  </span>
                  <span
                    className="flex h-11 w-11 items-center justify-center justify-self-end rounded-full border-3 border-black"
                    style={{ backgroundColor: link.color }}
                  >
                    <Icon className="h-5 w-5 text-gray-900" aria-hidden />
                  </span>
                </motion.a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close contact menu' : 'Open contact menu'}
        aria-expanded={open}
        aria-haspopup="menu"
        animate={
          reduceMotion || open
            ? undefined
            : { y: [0, -6, 0] }
        }
        transition={
          reduceMotion || open
            ? undefined
            : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
        }
        whileHover={reduceMotion ? undefined : { scale: 1.08, rotate: -3 }}
        whileTap={reduceMotion ? undefined : { scale: 0.92 }}
        className="pointer-events-auto justify-self-end flex h-14 w-14 items-center justify-center rounded-full border-4 border-black bg-yellow-400 text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-500 hover:shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] transition-colors"
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <Mail className="h-6 w-6" aria-hidden />}
      </motion.button>
    </div>
  );
}

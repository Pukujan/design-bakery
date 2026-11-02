import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

const SPRING = { stiffness: 500, damping: 40, mass: 0.4 };

/**
 * Accent dot that trails the pointer and grows into a label over anything with
 * `data-cursor`. Fine pointers only; returns null for touch and reduced motion.
 */
export function LabCursor({ onActiveChange }: { onActiveChange: (active: boolean) => void }) {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const active = finePointer && !reduceMotion;
    setEnabled(active);
    onActiveChange(active);
    if (!active) return;

    const move = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);
      const target = (event.target as Element | null)?.closest<HTMLElement>('[data-cursor]');
      setLabel(target?.dataset.cursor ?? null);
    };
    const leave = () => setVisible(false);
    window.addEventListener('pointermove', move);
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      onActiveChange(false);
    };
  }, [reduceMotion, onActiveChange, x, y]);

  if (!enabled) return null;

  const size = label ? 84 : 14;
  return (
    <motion.div
      className="lab-cursor"
      aria-hidden="true"
      style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
      animate={{ width: size, height: size, opacity: visible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <motion.span animate={{ opacity: label ? 1 : 0 }} transition={{ duration: 0.15 }}>
        {label}
      </motion.span>
    </motion.div>
  );
}

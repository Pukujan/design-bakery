import { useRef } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'motion/react';

const BASE_SPEED = -2.5; // percent of one copy per second

/** A slow marquee that speeds up, and flips direction, with the scroll. */
export function LabMarquee({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const smoothVelocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false });
  const x = useTransform(baseX, (value) => `${wrap(-25, 0, value)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduceMotion) return;
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    const move = direction.current * BASE_SPEED * (delta / 1000) * (1 + Math.abs(factor));
    baseX.set(baseX.get() + move);
  });

  return (
    <div className="lab-marquee" aria-hidden="true">
      <motion.div className="lab-marquee-track" style={{ x }}>
        {[0, 1, 2, 3].map((copy) => (
          <span key={copy}>{children}</span>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Blog list/detail motion — READ FIRST: additionals/guidelines/agent-devlog-blog-motion.md
 * Index: additionals/guidelines/agent-devlog-index.md | Rule: .cursor/rules/blog-motion.mdc
 */
import { useMemo, type ReactNode } from 'react';
import { motion, type Transition } from 'motion/react';
import { BlobShape, Star } from '@/components/GraphicElements';
import { FlowerCharacter } from '@/components/FlowerCharacter';
import { Cupcake, Donut, Cookie, IceCream, Croissant } from '@/components/BakeryItems';

export type BlogDecorVariant = 'list' | 'detail';

/** Jumpy card lift — matches EngineeringProjects / home sections */
export const blogCardMotion = {
  whileHover: { y: -12, scale: 1.06, rotate: 1.5 },
  whileTap: { scale: 0.94 },
} as const;

export const blogButtonMotion = {
  whileHover: { scale: 1.05, y: -3 },
  whileTap: { scale: 0.95 },
} as const;

export const blogReveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6 },
} as const;

function hashSeed(seed: string | number): number {
  if (typeof seed === 'number') return Math.abs(seed) || 1;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) || 1;
}

function createRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const BLOB_COLORS = ['#9B6DD6', '#4169E1', '#FF6B9D', '#FF8C42', '#A8CC00'];
const STAR_COLORS = ['#9B6DD6', '#4169E1', '#FFD93D', '#FF8C42'];
const FLOWER_COLORS = ['#9B6DD6', '#4169E1', '#FF6B9D', '#A8CC00'];

type FloatKind = 'cupcake' | 'donut' | 'cookie' | 'icecream' | 'croissant';

const FLOAT_SLOTS: Record<
  BlogDecorVariant,
  { className: string; kind: FloatKind; size: number }[]
> = {
  list: [
    { className: 'absolute top-32 right-32 hidden lg:block', kind: 'cupcake', size: 80 },
    { className: 'absolute bottom-40 left-32 hidden lg:block', kind: 'donut', size: 85 },
    { className: 'absolute top-48 right-1/4 hidden md:block', kind: 'icecream', size: 72 },
    { className: 'absolute bottom-56 right-40 hidden xl:block', kind: 'cookie', size: 68 },
  ],
  detail: [
    { className: 'absolute top-32 right-20 hidden lg:block', kind: 'cupcake', size: 50 },
    { className: 'absolute bottom-40 left-20 hidden lg:block', kind: 'donut', size: 60 },
    { className: 'absolute top-56 right-1/3 hidden md:block', kind: 'croissant', size: 55 },
  ],
};

const STAR_SLOTS: Record<BlogDecorVariant, { className: string; size: number }[]> = {
  list: [
    { className: 'absolute top-20 left-20', size: 50 },
    { className: 'absolute bottom-32 right-20', size: 45 },
    { className: 'absolute top-1/3 right-12 hidden md:block', size: 38 },
  ],
  detail: [
    { className: 'absolute top-20 left-32 hidden lg:block', size: 35 },
    { className: 'absolute bottom-28 right-16 hidden md:block', size: 32 },
  ],
};

const FLOWER_SLOTS: Record<BlogDecorVariant, { className: string; size: number }[]> = {
  list: [
    { className: 'absolute top-40 left-10 hidden md:block', size: 70 },
    { className: 'absolute bottom-20 right-10 hidden md:block', size: 75 },
  ],
  detail: [
    { className: 'absolute top-40 left-10 hidden lg:block', size: 50 },
    { className: 'absolute bottom-24 right-8 hidden md:block', size: 48 },
  ],
};

function renderBakery(kind: FloatKind, size: number) {
  switch (kind) {
    case 'cupcake':
      return <Cupcake size={size} animate={false} />;
    case 'donut':
      return <Donut size={size} animate={false} />;
    case 'cookie':
      return <Cookie size={size} animate={false} />;
    case 'icecream':
      return <IceCream size={size} animate={false} />;
    case 'croissant':
      return <Croissant size={size} animate={false} />;
  }
}

function floatTransition(rng: () => number, index: number): Transition {
  const duration = 3.2 + rng() * 2.8 + index * 0.15;
  return { duration, repeat: Infinity, ease: 'easeInOut' };
}

type BlogPageDecorProps = {
  variant: BlogDecorVariant;
  /** Changes float timing & palette — use blog id on detail, "blogs" on list */
  seed?: string | number;
};

/**
 * Home-style floating bakery / stars / blobs for blog list & detail.
 * Seed keeps motion feeling fresh per page without manual layout edits.
 */
export function BlogPageDecor({ variant, seed = variant }: BlogPageDecorProps) {
  const layout = useMemo(() => {
    const rng = createRng(hashSeed(seed));
    const blobs = [0, 1, 2].map((i) => ({
      color: BLOB_COLORS[Math.floor(rng() * BLOB_COLORS.length)],
      size: variant === 'list' ? 300 + Math.floor(rng() * 120) : 280 + Math.floor(rng() * 90),
      className:
        i === 0
          ? 'absolute -top-32 -right-40 opacity-20 hidden lg:block'
          : i === 1
            ? 'absolute bottom-20 -left-32 opacity-20 hidden lg:block'
            : 'absolute top-1/2 left-1/4 opacity-15 hidden md:block',
    }));

    const floats = FLOAT_SLOTS[variant].map((slot, i) => {
      const yAmp = 12 + Math.floor(rng() * 10);
      const rotate = rng() > 0.5;
      return {
        ...slot,
        animate: rotate
          ? { y: [0, -yAmp, 0], rotate: [-6, 6, -6] }
          : { y: [0, yAmp, 0] },
        transition: floatTransition(rng, i),
      };
    });

    const stars = STAR_SLOTS[variant].map((slot, i) => ({
      ...slot,
      color: STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)],
      animate:
        rng() > 0.4
          ? { rotate: 360, scale: [1, 1.15, 1] }
          : { rotate: -360 },
      transition: {
        duration: 14 + rng() * 8,
        repeat: Infinity,
        ease: 'linear' as const,
      },
    }));

    const flowers = FLOWER_SLOTS[variant].map((slot) => ({
      ...slot,
      color: FLOWER_COLORS[Math.floor(rng() * FLOWER_COLORS.length)],
    }));

    return { blobs, floats, stars, flowers };
  }, [seed, variant]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {layout.blobs.map((blob, i) => (
        <BlobShape key={`blob-${i}`} color={blob.color} size={blob.size} className={blob.className} />
      ))}

      {layout.floats.map((item, i) => (
        <motion.div
          key={`float-${item.kind}-${i}`}
          className={item.className}
          animate={item.animate}
          transition={item.transition}
        >
          {renderBakery(item.kind, item.size)}
        </motion.div>
      ))}

      {layout.stars.map((star, i) => (
        <motion.div
          key={`star-${i}`}
          className={star.className}
          animate={star.animate}
          transition={star.transition}
        >
          <Star color={star.color} size={star.size} />
        </motion.div>
      ))}

      {layout.flowers.map((flower, i) => (
        <div key={`flower-${i}`} className={flower.className}>
          <FlowerCharacter color={flower.color} size={flower.size} animate />
        </div>
      ))}
    </div>
  );
}

/** Staggered letter bounce for blog list hero (home playful-text vibe, motion-based) */
export function PlayfulBlogTitle({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const letters = text.split('');

  return (
    <span className={className} aria-label={text}>
      {letters.map((letter, i) => (
        <motion.span
          key={`${letter}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { duration: 0.4, delay: i * 0.06 },
            y: { duration: 2.2 + (i % 3) * 0.3, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' },
          }}
        >
          {letter === ' ' ? '\u00a0' : letter}
        </motion.span>
      ))}
    </span>
  );
}

export function MotionSection({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={blogReveal.initial}
      whileInView={blogReveal.whileInView}
      viewport={blogReveal.viewport}
      transition={{ ...blogReveal.transition, delay }}
    >
      {children}
    </motion.div>
  );
}

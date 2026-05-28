/** Lightweight decor stubs for standalone blog studio (no site-wide BakeryItems). */
import type { ReactNode } from 'react';

export function BlobShape({ color, className }: { color: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 80" aria-hidden>
      <ellipse cx="60" cy="40" rx="55" ry="35" fill={color} opacity={0.35} />
    </svg>
  );
}

export function Star({ color, className }: { color: string; className?: string }) {
  return (
    <span className={className} style={{ color }} aria-hidden>
      ✦
    </span>
  );
}

export function FlowerCharacter({ className }: { className?: string }) {
  return <span className={className} aria-hidden>🌸</span>;
}

export function Cupcake({ className }: { className?: string }) {
  return <span className={className} aria-hidden>🧁</span>;
}
export function Donut({ className }: { className?: string }) {
  return <span className={className} aria-hidden>🍩</span>;
}
export function Cookie({ className }: { className?: string }) {
  return <span className={className} aria-hidden>🍪</span>;
}
export function IceCream({ className }: { className?: string }) {
  return <span className={className} aria-hidden>🍦</span>;
}
export function Croissant({ className }: { className?: string }) {
  return <span className={className} aria-hidden>🥐</span>;
}

export function Squiggle({ color, className }: { color?: string; className?: string }) {
  return (
    <svg className={className} width="120" height="12" viewBox="0 0 120 12" aria-hidden>
      <path
        d="M0 6 Q30 0 60 6 T120 6"
        fill="none"
        stroke={color ?? '#4169E1'}
        strokeWidth="3"
      />
    </svg>
  );
}

export function MotionSection({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={className}>{children}</section>;
}

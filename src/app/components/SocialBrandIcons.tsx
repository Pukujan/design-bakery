import { cn } from './ui/utils';

/** Behance mark as “Bē” text — inherits color from parent (like Lucide icons). */
export function BehanceIcon({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Behance"
      className={cn(
        '@container inline-flex min-h-0 min-w-0 items-center justify-center font-bold leading-none tracking-tight text-current',
        className,
      )}
      style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
    >
      <span className="text-[min(58cqi,72cqh)]">Bē</span>
    </span>
  );
}

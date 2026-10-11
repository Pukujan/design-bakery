import { useEffect, useState } from "react";
import { NAV } from "@/data/content";

/** Slim top nav. It darkens as the descent carries it into the world. */
export function TopNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    const el = document.querySelector<HTMLElement>(`${href}`);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        background: "linear-gradient(180deg, rgba(11,5,16,calc(0.55 * var(--nav-dark,0) + 0.18)) 0%, rgba(11,5,16,0) 100%)",
      }}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <a
          href="#arrival"
          onClick={(e) => {
            e.preventDefault();
            go("#arrival");
          }}
          className="db-wordmark text-[0.72rem] text-cream sm:text-sm"
        >
          Design Bakery
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <li key={n.label}>
              <a
                href={n.href}
                onClick={(e) => {
                  e.preventDefault();
                  go(n.href);
                }}
                className="db-label text-[0.6rem] text-cream/70 transition-colors hover:text-dusk-gold"
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="db-plaque flex h-9 w-9 items-center justify-center rounded-full md:hidden"
        >
          <span className="relative block h-3 w-4">
            <span
              className="absolute left-0 block h-px w-full bg-cream transition-[top,transform] duration-300"
              style={{ top: open ? "6px" : "1px", transform: open ? "rotate(45deg)" : "none" }}
            />
            <span
              className="absolute left-0 block h-px w-full bg-cream transition-[top,transform] duration-300"
              style={{ top: open ? "6px" : "11px", transform: open ? "rotate(-45deg)" : "none" }}
            />
          </span>
        </button>
      </nav>

      <div
        className="overflow-hidden px-5 transition-[max-height,opacity] duration-500 md:hidden"
        style={{ maxHeight: open ? 260 : 0, opacity: open ? 1 : 0 }}
      >
        <ul className="db-plaque mx-auto max-w-6xl space-y-1 rounded-2xl p-4">
          {NAV.map((n) => (
            <li key={n.label}>
              <a
                href={n.href}
                onClick={(e) => {
                  e.preventDefault();
                  go(n.href);
                }}
                className="db-label block rounded-lg px-3 py-2.5 text-[0.62rem] text-cream/80 hover:bg-cream/10 hover:text-dusk-gold"
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

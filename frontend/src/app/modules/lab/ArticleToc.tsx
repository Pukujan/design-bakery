import { useEffect, useMemo, useState } from 'react';
import { tocFrom } from './toc';

/**
 * The contents, pinned to the left of a long article like Wikipedia's. The section being read is
 * highlighted, and each entry jumps to its heading.
 */
export function ArticleToc({ source }: { source: string }) {
  const entries = useMemo(() => tocFrom(source), [source]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length === 0) return;
    const update = () => {
      // The last heading that has scrolled above a line a quarter of the way down the screen.
      const line = window.innerHeight * 0.25;
      let current = entries[0].id;
      for (const entry of entries) {
        const element = document.getElementById(entry.id);
        if (element && element.getBoundingClientRect().top <= line) current = entry.id;
      }
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <nav className="article-toc" aria-label="On this page">
      <p className="article-toc-label lab-mono">On this page</p>
      <ol>
        {entries.map((entry) => (
          <li key={entry.id} className={`level-${entry.level}${active === entry.id ? ' is-active' : ''}`}>
            <a
              href={`#${entry.id}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(entry.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

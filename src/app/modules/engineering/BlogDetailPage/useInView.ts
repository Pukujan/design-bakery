import { useEffect, useState, type RefObject } from 'react';

/** Fire once when the element enters (or nears) the viewport. */
export function useInView(
  ref: RefObject<HTMLElement | null>,
  rootMargin = '240px',
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, inView, rootMargin]);

  return inView;
}

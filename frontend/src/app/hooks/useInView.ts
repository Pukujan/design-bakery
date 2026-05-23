import { useCallback, useRef, useState } from 'react';

/** Fire once when the element enters (or nears) the viewport. */
export function useInView(rootMargin = '240px'): {
  ref: (node: HTMLElement | null) => void;
  inView: boolean;
} {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node || inView) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            observerRef.current = null;
          }
        },
        { rootMargin },
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [inView, rootMargin],
  );

  return { ref, inView };
}

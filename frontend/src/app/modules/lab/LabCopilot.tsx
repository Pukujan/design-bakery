import { useEffect, useRef } from 'react';
import { CopilotChat } from '../copilot/CopilotChat';
import { copilot } from '../copilot/store';

/**
 * The hero chat. It shares one conversation with the floating dock, and tells the dock
 * when it is on screen so the pill only appears once the visitor scrolls past it.
 */
export function LabCopilot() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => copilot.setHeroVisible(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      copilot.setHeroVisible(false);
    };
  }, []);

  return (
    <div ref={ref}>
      <CopilotChat variant="hero" />
    </div>
  );
}

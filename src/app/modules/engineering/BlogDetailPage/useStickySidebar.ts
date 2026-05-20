import { useEffect, useRef, useState, type CSSProperties } from 'react';

const DESKTOP_MQ = '(min-width: 1020px)';

function getNavBottom(): number {
  const nav = document.querySelector('nav');
  return nav ? nav.getBoundingClientRect().bottom + 12 : 112;
}

/**
 * Reliable sticky sidebar for blog detail: uses fixed positioning while scrolling
 * because CSS sticky breaks under motion transforms / short flex columns.
 */
export function useStickySidebar() {
  const columnRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarStyle, setSidebarStyle] = useState<CSSProperties>({});

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);

    const update = () => {
      const column = columnRef.current;
      const sidebar = sidebarRef.current;

      if (!column || !sidebar || !mq.matches) {
        setSidebarStyle({});
        return;
      }

      const top = getNavBottom();
      const sidebarHeight = sidebar.offsetHeight;
      const columnRect = column.getBoundingClientRect();
      const mainColumn = column.previousElementSibling as HTMLElement | null;
      const columnHeight = Math.max(
        column.offsetHeight,
        mainColumn?.offsetHeight ?? 0,
        columnRect.height
      );
      const columnTop = columnRect.top + window.scrollY;
      const scrollY = window.scrollY;
      const pinStart = columnTop - top;
      const pinEnd = columnTop + columnHeight - sidebarHeight - top;

      if (scrollY < pinStart) {
        setSidebarStyle({
          position: 'relative',
          top: 0,
          left: 0,
          width: '100%',
        });
      } else if (scrollY > pinEnd) {
        setSidebarStyle({
          position: 'absolute',
          top: columnHeight - sidebarHeight,
          left: 0,
          width: '100%',
        });
      } else {
        setSidebarStyle({
          position: 'fixed',
          top,
          left: columnRect.left,
          width: columnRect.width,
          zIndex: 20,
        });
      }
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    mq.addEventListener('change', update);

    const observer = new ResizeObserver(update);
    const observeTargets = () => {
      observer.disconnect();
      if (sidebarRef.current) observer.observe(sidebarRef.current);
      if (columnRef.current) {
        observer.observe(columnRef.current);
        const main = columnRef.current.previousElementSibling;
        if (main) observer.observe(main);
      }
    };
    observeTargets();
    const raf = requestAnimationFrame(observeTargets);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      mq.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);

  return { columnRef, sidebarRef, sidebarStyle };
}

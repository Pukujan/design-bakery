import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Research is static HTML under `public/research/` (arXiv-style index + papers).
 * Force full-document navigation so the host serves the static files.
 */
export function ResearchRedirect() {
  const { pathname } = useLocation();

  useEffect(() => {
    const clean = pathname.replace(/\/+$/, '') || '/research';
    let target = '/research/index.html';

    if (clean === '/research') {
      target = '/research/index.html';
    } else if (clean.startsWith('/research/papers/')) {
      const leaf = clean.slice('/research/papers/'.length);
      if (leaf.endsWith('.html') || leaf.endsWith('.bib')) {
        target = clean;
      } else if (leaf) {
        target = `/research/papers/${leaf}.html`;
      }
    } else if (clean.startsWith('/research/')) {
      const rest = clean.slice('/research/'.length);
      if (rest.endsWith('.js') || rest.endsWith('.html') || rest.endsWith('.bib')) {
        target = clean;
      } else {
        target = `/research/${rest}/index.html`;
      }
    }

    window.location.replace(
      `${target}${window.location.search}${window.location.hash}`,
    );
  }, [pathname]);

  return null;
}

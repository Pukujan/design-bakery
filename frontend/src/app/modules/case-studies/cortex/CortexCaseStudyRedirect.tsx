import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * The Cortex case study is static HTML under `public/case-studies/cortex/`.
 * Layout versions: A (quiet instrument), B (current redesign), C (declutter).
 * Force full-document navigation so static files load (not SPA catch-all).
 *
 * Routes:
 *   /case-studies/cortex           -> index.html (picks last A/B/C via localStorage)
 *   /case-studies/cortex/specs     -> specs.html
 *   /case-studies/cortex/{a|b|c}   -> {ver}/index.html
 *   /case-studies/cortex/{a|b|c}/specs -> {ver}/specs.html
 */
export function CortexCaseStudyRedirect() {
  const { pathname } = useLocation();

  useEffect(() => {
    const clean = pathname.replace(/\/+$/, '');
    const base = '/case-studies/cortex';
    const rest = clean.startsWith(base) ? clean.slice(base.length) : '';
    const parts = rest.split('/').filter(Boolean);
    let target = `${base}/index.html`;

    if (parts[0] === 'a' || parts[0] === 'b' || parts[0] === 'c') {
      const ver = parts[0];
      const isSpecs = parts[1] === 'specs';
      target = `${base}/${ver}/${isSpecs ? 'specs.html' : 'index.html'}`;
    } else if (parts[0] === 'specs') {
      target = `${base}/specs.html`;
    }

    window.location.replace(
      `${target}${window.location.search}${window.location.hash}`,
    );
  }, [pathname]);

  return null;
}

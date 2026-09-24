import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * The Fluffy V4 case study is a standalone static page in
 * `frontend/public/case-studies/fluffy-v4/`. SPA routes redirect to the
 * static file, and `/gallery` redirects to the live (unlisted) V4 experiment
 * gallery in `frontend/public/experiments/fluffy-system-v4/`.
 */
export function FluffyV4CaseStudyRedirect() {
  const { pathname } = useLocation();

  useEffect(() => {
    const clean = pathname.replace(/\/+$/, '');
    const base = '/case-studies/fluffy-v4';
    const rest = clean.startsWith(base) ? clean.slice(base.length) : '';
    const page = rest.split('/').filter(Boolean)[0];

    const target = page === 'gallery'
      ? '/experiments/fluffy-system-v4/index.html'
      : `${base}/index.html`;

    window.location.replace(`${target}${window.location.search}${window.location.hash}`);
  }, [pathname]);

  return null;
}

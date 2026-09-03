import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function FossilCaseStudyRedirect() {
  const { pathname } = useLocation();

  useEffect(() => {
    const clean = pathname.replace(/\/+$/, '');
    const base = '/case-studies/fossil';
    const rest = clean.startsWith(base) ? clean.slice(base.length) : '';
    const page = rest.split('/').filter(Boolean)[0];

    const asset = page === 'presentation'
      ? 'presentation.html'
      : page === 'evidence'
        ? 'evidence.html'
        : 'index.html';

    window.location.replace(`${base}/v2/${asset}${window.location.search}${window.location.hash}`);
  }, [pathname]);

  return null;
}

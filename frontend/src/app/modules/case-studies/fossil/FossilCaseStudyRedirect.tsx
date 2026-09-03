import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function FossilCaseStudyRedirect() {
  const { pathname } = useLocation();

  useEffect(() => {
    const clean = pathname.replace(/\/+$/, '');
    const base = '/case-studies/fossil';
    const rest = clean.startsWith(base) ? clean.slice(base.length) : '';
    const page = rest.split('/').filter(Boolean)[0];

    const target = page === 'presentation'
      ? `${base}/v4/presentation.html`
      : page === 'evidence'
        ? `${base}/v4/evidence.html`
        : `${base}/v4/index.html`;

    window.location.replace(`${target}${window.location.search}${window.location.hash}`);
  }, [pathname]);

  return null;
}

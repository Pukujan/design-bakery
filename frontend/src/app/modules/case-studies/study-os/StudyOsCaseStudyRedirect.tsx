import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function StudyOsCaseStudyRedirect() {
  const { pathname } = useLocation();

  useEffect(() => {
    const clean = pathname.replace(/\/+$/, '');
    const base = '/case-studies/study-os';
    const rest = clean.startsWith(base) ? clean.slice(base.length) : '';
    const page = rest.split('/').filter(Boolean)[0];

    const target = page === 'presentation'
      ? `${base}/presentation.html`
      : page === 'evidence'
        ? `${base}/evidence.html`
        : `${base}/index.html`;

    window.location.replace(`${target}${window.location.search}${window.location.hash}`);
  }, [pathname]);

  return null;
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function CortexCaseStudyRedirect() {
  const { pathname } = useLocation();
  useEffect(() => {
    const clean = pathname.replace(/\/+$/, '');
    const base = '/case-studies/cortex';
    const rest = clean.startsWith(base) ? clean.slice(base.length) : '';
    const parts = rest.split('/').filter(Boolean);
    const leg = parts[0];
    const flag = leg === 'specs' || ((leg === 'a' || leg === 'b' || leg === 'c') && parts[1] === 'specs');
    const target = flag ? base + '/a/specs.html' : base + '/a/index.html';
    window.location.replace(target + window.location.search + window.location.hash);
  }, [pathname]);
  return null;
}

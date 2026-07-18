import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * The Cortex case study is a static HTML page pair under
 * `public/case-studies/cortex/` (`index.html` + `specs.html`). The portfolio
 * renders internal links with React Router `<Link>`, which would hijack the path
 * client-side and fall through to the catch-all instead of letting Vercel's
 * `.html` rewrite serve the static file. Force a full-document navigation so the
 * static page loads — the same approach as `StaticCaseStudyAssetGuard` for the
 * legal-workflow case study.
 *
 * Routes:
 *   /case-studies/cortex        -> /case-studies/cortex/index.html
 *   /case-studies/cortex/specs  -> /case-studies/cortex/specs.html
 */
export function CortexCaseStudyRedirect() {
  const { pathname } = useLocation();

  useEffect(() => {
    const clean = pathname.replace(/\/+$/, '');
    const file = clean.endsWith('/specs') ? 'specs.html' : 'index.html';
    window.location.replace(
      `/case-studies/cortex/${file}${window.location.search}${window.location.hash}`,
    );
  }, [pathname]);

  return null;
}

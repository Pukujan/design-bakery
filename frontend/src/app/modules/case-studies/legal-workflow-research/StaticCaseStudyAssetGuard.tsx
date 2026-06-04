import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { LEGAL_WORKFLOW_RESEARCH_CASE_STUDY_PATH } from './legalWorkflowCaseStudyData';

/**
 * If the SPA shell loads for a static `.html` asset under the legal workflow
 * case study, force a full document navigation so Vercel serves the file from
 * `public/` instead of React Router's catch-all redirecting to `/`.
 */
export function StaticCaseStudyAssetGuard() {
  const { asset } = useParams<{ asset: string }>();

  useEffect(() => {
    if (!asset?.endsWith('.html')) return;
    const target = `${LEGAL_WORKFLOW_RESEARCH_CASE_STUDY_PATH}/${asset}${window.location.search}${window.location.hash}`;
    window.location.replace(target);
  }, [asset]);

  if (asset?.endsWith('.html')) return null;

  return <Navigate to="/" replace />;
}

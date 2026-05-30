import InvestAiCaseStudyApp from '@invest-ai-case-study/app/App';
import '@invest-ai-case-study/styles/index.css';
import { PageSeo } from '@/seo/PageSeo';
import { CASE_STUDY_SEO } from '@/seo/pageSeoConfig';

/** Full-page InvestAI case study (product + engineering tabs) from extras/. */
export function InvestAiCaseStudyPage() {
  const seo = CASE_STUDY_SEO.investAi;
  return (
    <div className="invest-ai-case-study min-h-screen">
      <PageSeo {...seo} />
      <InvestAiCaseStudyApp />
    </div>
  );
}

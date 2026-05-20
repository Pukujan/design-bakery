import InvestAiCaseStudyApp from '@invest-ai-case-study/app/App';
import '@invest-ai-case-study/styles/index.css';

/** Full-page InvestAI case study (product + engineering tabs) from extras/. */
export function InvestAiCaseStudyPage() {
  return (
    <div className="invest-ai-case-study min-h-screen">
      <InvestAiCaseStudyApp />
    </div>
  );
}

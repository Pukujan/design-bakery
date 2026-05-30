import OniAgentCaseStudyV4App from '@oni-agent-case-study-v4/app/App';
import '@oni-agent-case-study-v4/styles/index.css';
import ogThumbnail from '@oni-agent-case-study-v4/app/assets/pukujan-astronaut-saturn.png';
import { PageSeo } from '@/seo/PageSeo';
import { CASE_STUDY_SEO } from '@/seo/pageSeoConfig';

/** Reorganized tabbed ONI case study (v4) — A/B comparison layout from extras/oni_agent_interactive_page_svg_darkmode_v4_src/. */
export function AiAgentsCaseStudyV4Page() {
  const seo = CASE_STUDY_SEO.oniV4;
  return (
    <div className="ai-agents-case-study-v4 isolate min-h-screen [color-scheme:light_dark]">
      <PageSeo {...seo} ogImage={ogThumbnail} />
      <OniAgentCaseStudyV4App />
    </div>
  );
}

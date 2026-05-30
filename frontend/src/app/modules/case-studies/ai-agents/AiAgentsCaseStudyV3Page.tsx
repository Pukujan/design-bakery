import OniAgentCaseStudyV3App from '@oni-agent-case-study-v3/app/App';
import '@oni-agent-case-study-v3/styles/index.css';
import ogThumbnail from '@oni-agent-case-study-v3/app/assets/pukujan-astronaut-saturn.png';
import { PageSeo } from '@/seo/PageSeo';
import { CASE_STUDY_SEO } from '@/seo/pageSeoConfig';

/** SVG + dark-mode ONI → agent architecture case study (v3) from extras/oni_agent_interactive_page_svg_darkmode_src/. */
export function AiAgentsCaseStudyV3Page() {
  const seo = CASE_STUDY_SEO.oniV3;
  return (
    <div className="ai-agents-case-study-v3 isolate min-h-screen [color-scheme:light_dark]">
      <PageSeo {...seo} ogImage={ogThumbnail} />
      <OniAgentCaseStudyV3App />
    </div>
  );
}

import OniAgentCaseStudyV4App from '@oni-agent-case-study-v4/app/App';
import '@oni-agent-case-study-v4/styles/index.css';
import { OniCaseStudyV4Head } from './OniCaseStudyV4Head';

/** Reorganized tabbed ONI case study (v4) — A/B comparison layout from extras/oni_agent_interactive_page_svg_darkmode_v4_src/. */
export function AiAgentsCaseStudyV4Page() {
  return (
    <div className="ai-agents-case-study-v4 isolate min-h-screen [color-scheme:light_dark]">
      <OniCaseStudyV4Head />
      <OniAgentCaseStudyV4App />
    </div>
  );
}

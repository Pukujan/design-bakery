import OniAgentCaseStudyV3App from '@oni-agent-case-study-v3/app/App';
import '@oni-agent-case-study-v3/styles/index.css';

/** SVG + dark-mode ONI → agent architecture case study (v3) from extras/oni_agent_interactive_page_svg_darkmode_src/. */
export function AiAgentsCaseStudyV3Page() {
  return (
    <div className="ai-agents-case-study-v3 isolate min-h-screen [color-scheme:light_dark]">
      <OniAgentCaseStudyV3App />
    </div>
  );
}

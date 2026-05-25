import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import astronautLogo from "../../assets/pukujan-astronaut-logo.svg";
import decorOrbit from "../../assets/pukujan-decor-orbit.svg";
import decorSystem from "../../assets/pukujan-decor-system.svg";
import { BrandMark } from "./BrandMark";
import { CaseStudyTabNav, CaseStudyPageJump } from "./CaseStudyTabNav";
import { getPageNavItems, type CaseStudyPageId } from "./caseStudyData";
import { useActiveSection } from "./caseStudyUi";
import { ProjectLinkButtons } from "./ProjectLinkButtons";
import { KLEI_FOOTER_DISCLAIMER } from "./waterLoopsData";
import { OniAnalogyTab } from "./pages/OniAnalogyTab";
import { AgentArchitectureTab } from "./pages/AgentArchitectureTab";
import { Pipeline500Tab } from "./pages/Pipeline500Tab";
import { RiskAdvantageTab } from "./pages/RiskAdvantageTab";

function CaseStudyPageContent({ activePage }: { activePage: CaseStudyPageId }) {
  switch (activePage) {
    case "oni":
      return <OniAnalogyTab />;
    case "architecture":
      return <AgentArchitectureTab />;
    case "pipeline":
      return <Pipeline500Tab />;
    case "risk":
      return <RiskAdvantageTab />;
    default:
      return <OniAnalogyTab />;
  }
}

export function OniAgentCaseStudyPage() {
  const [activePage, setActivePage] = useState<CaseStudyPageId>("oni");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isDark = theme === "dark";

  const pageNavItems = useMemo(() => getPageNavItems(activePage), [activePage]);
  const sectionIds = useMemo(() => pageNavItems.map((item) => item.id), [pageNavItems]);
  const activeSection = useActiveSection(sectionIds);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]);

  const handlePageChange = (pageId: CaseStudyPageId) => {
    setActivePage(pageId);
  };

  return (
    <div data-theme={theme} className="oni-page">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-20">
        <img src={decorOrbit} alt="" className="absolute -right-24 top-28 h-[34rem] w-[24rem] object-contain blur-[1px]" />
        <img src={decorSystem} alt="" className="absolute -left-28 bottom-12 h-[38rem] w-[28rem] object-contain blur-[1px]" />
      </div>
      <header className="oni-header fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex items-center justify-between gap-3 py-3">
            <a href="#top" className="oni-text flex shrink-0 items-center gap-3 font-black tracking-tight">
              <BrandMark
                src={astronautLogo}
                alt="Pukujan"
                preset="icon"
                frameClassName="oni-surface oni-border oni-shadow-lg border shadow-lg"
              />
              <span className="flex flex-col leading-none">
                <span className="text-base font-black">Pukujan</span>
                <span className="oni-text-subtle hidden text-xs font-bold uppercase tracking-[0.22em] sm:inline">Agent-First Architecture</span>
              </span>
            </a>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="oni-btn inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-sm ring-1"
              >
                {isDark ? "Light mode" : "Dark mode"}
              </button>
              <a
                href="https://www.klei.com/games/oxygen-not-included"
                target="_blank"
                rel="noreferrer"
                className="oni-btn hidden shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-sm ring-1 lg:inline-flex"
              >
                ONI source <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <div className="oni-page-tab-bar -mx-4 border-y border-[color:var(--oni-border)] px-4 py-3 md:mx-0 md:px-0">
            <p className="oni-text mb-2 text-xs font-black uppercase tracking-[0.28em]">Case study pages</p>
            <CaseStudyTabNav activePage={activePage} onPageChange={handlePageChange} />
          </div>
          <div className="pb-2 pt-2 md:pb-3">
            <div className="oni-header-scroll-row scrollbar-hide">
              <ProjectLinkButtons labelMode="short" nowrap elevated={false} showExternalIcon={false} />
            </div>
          </div>
          {pageNavItems.length > 1 ? (
            <>
              <p className="oni-text-subtle pb-2 text-[10px] font-black uppercase tracking-[0.28em]">On this page</p>
              <nav className="scrollbar-hide hidden gap-2 overflow-x-auto pb-3 xl:flex">
                {pageNavItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      activeSection === item.id ? "oni-nav-active" : "oni-nav-idle"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-3 xl:hidden">
                {pageNavItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
                      activeSection === item.id ? "oni-nav-active" : "oni-nav-mobile-idle"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </header>

      <main id="top" className="mx-auto max-w-7xl px-4 pb-24 pt-44 md:px-6 md:pt-48">
        <CaseStudyPageContent activePage={activePage} />
        <CaseStudyPageJump activePage={activePage} onPageChange={handlePageChange} />
      </main>

      <footer className="oni-footer border-t">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-6">
          <div>
            <p className="oni-text mb-2 text-xs font-black uppercase tracking-[0.28em]">Case study pages</p>
            <CaseStudyTabNav activePage={activePage} onPageChange={handlePageChange} compact />
          </div>
          <p className="oni-text-subtle border-t border-[color:var(--oni-border)] pt-6 text-xs leading-6">{KLEI_FOOTER_DISCLAIMER}</p>
        </div>
      </footer>
    </div>
  );
}

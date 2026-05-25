import React, { useEffect, useRef } from "react";
import { ChevronDown, ExternalLink, Moon, Sun } from "lucide-react";
import astronautLogo from "../../assets/pukujan-astronaut-logo.svg";
import { BrandMark } from "./BrandMark";
import { ProjectLinkButtons } from "./ProjectLinkButtons";

export type NavItem = {
  id: string;
  label: string;
  shortLabel: string;
};

type OniCaseStudyHeaderProps = {
  navItems: NavItem[];
  activeId: string;
  theme: "dark" | "light";
  onThemeToggle: () => void;
};

export function OniCaseStudyHeader({ navItems, activeId, theme, onThemeToggle }: OniCaseStudyHeaderProps) {
  const isDark = theme === "dark";
  const navScrollRef = useRef<HTMLDivElement>(null);
  const activeItem = navItems.find((item) => item.id === activeId) ?? navItems[0];

  useEffect(() => {
    const container = navScrollRef.current;
    const activeLink = container?.querySelector<HTMLElement>(`[data-nav-id="${activeId}"]`);
    activeLink?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  const jumpToSection = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="oni-header fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Row 1: brand, current section (mobile), actions */}
        <div className="flex items-center gap-3 py-3">
          <a href="#top" className="oni-text flex min-w-0 shrink-0 items-center gap-2.5 font-black tracking-tight sm:gap-3">
            <BrandMark
              src={astronautLogo}
              alt="Pukujan"
              preset="icon"
              frameClassName="oni-surface oni-border oni-shadow-lg border shadow-lg"
            />
            <span className="flex min-w-0 flex-col leading-none">
              <span className="truncate text-base font-black">Pukujan</span>
              <span className="oni-text-subtle hidden truncate text-xs font-bold uppercase tracking-[0.18em] sm:inline">
                Agent-first architecture
              </span>
            </span>
          </a>

          <div className="oni-surface-muted oni-border min-w-0 flex-1 truncate rounded-full border px-3 py-1.5 lg:hidden">
            <p className="oni-text-subtle text-[10px] font-bold uppercase tracking-[0.2em]">Reading</p>
            <p className="oni-text truncate text-xs font-black">{activeItem.label}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="oni-header-divider hidden h-8 w-px sm:block" aria-hidden />
            <div className="hidden items-center gap-2 md:flex">
              <span className="oni-text-subtle hidden text-[10px] font-bold uppercase tracking-[0.2em] xl:inline">
                Project
              </span>
              <ProjectLinkButtons labelMode="short" showExternalIcon={false} elevated />
            </div>
            <button
              type="button"
              onClick={onThemeToggle}
              className="oni-btn inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold shadow-sm ring-1"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>

        {/* Row 2 mobile / tablet: jump menu */}
        <div className="border-t border-[color:var(--oni-border)] pb-3 pt-3 lg:hidden">
          <label htmlFor="oni-section-jump" className="oni-text-subtle mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em]">
            Jump to section
          </label>
          <div className="relative">
            <select
              id="oni-section-jump"
              value={activeId}
              onChange={(e) => jumpToSection(e.target.value)}
              className="oni-jump-select oni-surface oni-border w-full appearance-none rounded-xl border py-2.5 pl-3 pr-10 text-sm font-bold shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="oni-text-subtle pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden />
          </div>
        </div>

        {/* Row 2 desktop: section pills */}
        <div className="hidden border-t border-[color:var(--oni-border)] pb-3 pt-3 lg:block">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="oni-text-subtle text-[10px] font-bold uppercase tracking-[0.2em]">On this page</p>
            <a
              href="https://www.klei.com/games/oxygen-not-included"
              target="_blank"
              rel="noreferrer"
              className="oni-text-subtle inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] hover:text-cyan-400"
            >
              ONI reference <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="oni-nav-scroll-mask relative">
            <div ref={navScrollRef} className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-0.5">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  data-nav-id={item.id}
                  href={`#${item.id}`}
                  title={item.label}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-bold transition ${
                    activeId === item.id ? "oni-nav-active" : "oni-nav-idle"
                  }`}
                >
                  {item.shortLabel}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Project links — mobile only (desktop in row 1) */}
        <div className="border-t border-[color:var(--oni-border)] pb-3 pt-3 md:hidden">
          <p className="oni-text-subtle mb-2 text-[10px] font-bold uppercase tracking-[0.2em]">Project links</p>
          <ProjectLinkButtons labelMode="short" showExternalIcon={false} elevated />
        </div>
      </div>
    </header>
  );
}

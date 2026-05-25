import React, { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { architectureFlowSteps } from "./caseStudyData";

export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    if (ids.length === 0) {
      setActive("");
      return;
    }
    setActive(ids[0]);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [ids.join("|")]);

  return active;
}

export function SectionShell({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="oni-border-t scroll-mt-36 border-t py-20 md:scroll-mt-40">
      <div className="mb-8">
        <p className="oni-eyebrow mb-3 text-xs font-bold uppercase tracking-[0.35em]">{eyebrow}</p>
        <h2 className="oni-text max-w-5xl text-3xl font-black tracking-tight md:text-5xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="oni-surface oni-border oni-shadow rounded-3xl border p-5">
      <p className="oni-text text-3xl font-black tracking-tight">{value}</p>
      <p className="oni-text-muted mt-2 text-sm font-bold leading-6">{label}</p>
    </div>
  );
}

export function FlowStep({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div
      className={`oni-shadow rounded-2xl border px-4 py-3 text-center text-sm font-semibold ${muted ? "oni-flow-muted" : "oni-flow-active"}`}
    >
      {label}
    </div>
  );
}

export function Arrow() {
  return <ArrowDown className="oni-text-subtle mx-auto my-2 h-5 w-5 md:rotate-[-90deg]" />;
}

export function MiniDiagram({
  title,
  left,
  middle,
  right,
}: {
  title: string;
  left: string;
  middle: string;
  right: string;
}) {
  return (
    <div className="oni-surface oni-border oni-shadow rounded-[2rem] border p-6">
      <p className="oni-text mb-5 font-black">{title}</p>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
        <FlowStep label={left} />
        <Arrow />
        <FlowStep label={middle} />
        <Arrow />
        <FlowStep label={right} />
      </div>
    </div>
  );
}

export function ArchitectureFlowDiagram() {
  return (
    <>
      <div className="scrollbar-hide hidden gap-2 overflow-x-auto pb-2 lg:flex lg:items-center">
        {architectureFlowSteps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="oni-flow-active shrink-0 rounded-2xl border px-3 py-3 text-center text-xs font-bold whitespace-nowrap">
              {step}
            </div>
            {index < architectureFlowSteps.length - 1 ? (
              <span className="oni-text-subtle shrink-0 text-lg font-black" aria-hidden>
                →
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
      <div className="grid gap-2 lg:hidden">
        {architectureFlowSteps.map((step, index) => (
          <React.Fragment key={step}>
            <div className="oni-flow-active rounded-2xl border px-4 py-3 text-center text-sm font-bold">{step}</div>
            {index < architectureFlowSteps.length - 1 ? (
              <ArrowDown className="oni-text-subtle mx-auto h-5 w-5" aria-hidden />
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

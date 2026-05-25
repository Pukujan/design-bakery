import React from "react";
import astronautLogo from "../../../assets/pukujan-astronaut-logo.svg";
import { BrandMark } from "../BrandMark";
import {
  architectureCards,
  architectureMemoryCards,
  auditTrailCards,
} from "../caseStudyData";
import { PROJECT_NPM_NAME } from "../projectLinks";
import { ArchitectureFlowDiagram, Arrow, FlowStep, SectionShell } from "../caseStudyUi";

export function AgentArchitectureTab() {
  return (
    <>
      <section className="py-12 lg:py-16">
        <p className="oni-eyebrow text-xs font-bold uppercase tracking-[0.35em]">Agent architecture</p>
        <h1 className="oni-text mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
          Modular blueprint for agent-first coding.
        </h1>
        <p className="oni-text-muted mt-6 max-w-3xl text-lg leading-8">
          {PROJECT_NPM_NAME} scaffolds bounded modules, human dev logs, agent-readable audits, and eval signals so speed does not erase memory.
        </p>
      </section>

      <SectionShell id="architecture" eyebrow="01 / architecture" title={`${PROJECT_NPM_NAME} — modular blueprint for agent-first coding.`}>
        <div className="oni-surface oni-border oni-shadow rounded-[2rem] border p-6 shadow-sm md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            {architectureCards.map((card) => (
              <div key={card.title} className="oni-surface-warm oni-border rounded-3xl border p-6">
                <card.icon className="oni-accent-icon mb-5 h-8 w-8" />
                <p className="oni-text font-black">{card.title}</p>
                <p className="oni-text-muted mt-3 text-sm leading-6">{card.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Core package idea</p>
              <h3 className="mt-4 text-3xl font-black tracking-tight">The repo should not just store code. It should store the memory of how the code was built.</h3>
            </div>
            <BrandMark
              src={astronautLogo}
              alt="Pukujan astronaut accent"
              preset="feature"
              frameClassName="hidden border border-white/10 bg-white/10 md:inline-flex"
            />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {architectureMemoryCards.map(([label, Icon]) => (
              <div key={label} className="rounded-3xl bg-white/10 p-5">
                <Icon className="mb-4 h-6 w-6 text-cyan-300" />
                <p className="font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell id="architecture-flow" eyebrow="02 / architecture flow" title="From human planning to the next agent handoff.">
        <div className="oni-surface oni-border oni-shadow rounded-[2rem] border p-6 shadow-sm md:p-8">
          <ArchitectureFlowDiagram />
        </div>
      </SectionShell>

      <SectionShell id="audit" eyebrow="03 / audit trail" title="Git shows the diff. The audit trail explains the system reason around the diff.">
        <div className="grid gap-6 lg:grid-cols-3">
          {auditTrailCards.map(([Icon, title, text]) => (
            <div key={title} className="oni-surface oni-border oni-shadow rounded-[2rem] border p-8 shadow-sm">
              <Icon className="oni-accent-icon mb-5 h-8 w-8" />
              <h3 className="oni-text text-2xl font-black tracking-tight">{title}</h3>
              <p className="oni-text-muted mt-4 leading-7">{text}</p>
            </div>
          ))}
        </div>
        <div className="oni-surface oni-border oni-shadow mt-8 rounded-[2rem] border p-6 shadow-sm md:p-8">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
            <FlowStep label="Agent patch" />
            <Arrow />
            <FlowStep label="Tests and evals" />
            <Arrow />
            <FlowStep label="Dev log + audit JSON" />
          </div>
        </div>
      </SectionShell>
    </>
  );
}

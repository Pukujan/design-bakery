import React from "react";
import { ExternalLink, Network, Split } from "lucide-react";
import astronautTool from "../../../assets/pukujan-astronaut-tool.svg";
import { BrandMark } from "../BrandMark";
import { sources } from "../caseStudyData";
import { agentUseCases, narrativeCards } from "../waterLoopsData";
import { PROJECT_NPM_NAME, PROJECT_NPM_URL } from "../projectLinks";
import { SectionShell } from "../caseStudyUi";

const controlledChaosBody =
  narrativeCards.find((card) => card.id === "chaotic-system")?.body ??
  "Chaos becomes useful only when it is controlled.";

export function RiskAdvantageTab() {
  return (
    <>
      <section className="py-12 lg:py-16">
        <p className="oni-eyebrow text-xs font-bold uppercase tracking-[0.35em]">Risk + advantage</p>
        <h1 className="oni-text mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
          Speed is leverage only when the system can explain itself.
        </h1>
        <p className="oni-text-muted mt-6 max-w-3xl text-lg leading-8">
          AI agents are powerful because they move fast — and risky when architecture cannot validate, audit, or bound what they do.
        </p>
      </section>

      <SectionShell id="risk" eyebrow="01 / risk + advantage" title="The risk and advantage of AI agents">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="oni-surface oni-border oni-shadow rounded-[2rem] border p-6 md:p-8">
            <p className="oni-text-muted leading-7">
              AI agents are powerful because they can move fast across complex workflows. But that is also the risk. If the architecture is weak, agents can spread mistakes faster than a human can catch them.
            </p>
            <p className="oni-text-muted mt-4 leading-7">
              But when the system is designed correctly, the advantage is huge. The same agent-first architecture can help with difficult, high-complexity workflows like:
            </p>
            <ul className="oni-text-muted mt-4 grid gap-2 sm:grid-cols-2">
              {agentUseCases.map((item) => (
                <li key={item} className="text-sm leading-6">
                  — {item}
                </li>
              ))}
            </ul>
            <p className="oni-text-muted mt-6 leading-7">
              The point is not to let agents act without control. The point is to build controlled systems where agents are specialized, bounded, logged, evaluated, and reviewed.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="oni-callout rounded-[1.5rem] border p-5">
              <p className="text-sm font-black leading-6">
                AI agents are not dangerous because they are fast. They become risky when they are fast inside a system that cannot explain, validate, or audit what they are doing.
              </p>
            </div>
            <div className="oni-accent-soft oni-border rounded-[1.5rem] border p-5">
              <p className="oni-text text-sm font-black leading-6">
                When done correctly, agent-first architecture turns speed into leverage: faster processing, better review queues, reusable workflows, stronger audit trails, and more human time for critical thinking.
              </p>
            </div>
            <BrandMark
              src={astronautTool}
              alt=""
              preset="accent"
              frameClassName="oni-surface oni-border mx-auto border opacity-90"
            />
          </div>
        </div>

        <div className="oni-surface oni-border oni-shadow mt-10 rounded-[2rem] border p-6 md:p-8">
          <p className="oni-eyebrow text-xs font-black uppercase tracking-[0.28em]">Same loop, controlled chaos</p>
          <p className="oni-text-muted mt-4 max-w-4xl leading-7">{controlledChaosBody}</p>
        </div>
      </SectionShell>

      <SectionShell id="why-built" eyebrow="02 / why I built it" title={`Why I built ${PROJECT_NPM_NAME}`}>
        <div className="oni-surface oni-border oni-shadow rounded-[2rem] border p-6 md:p-8">
          <p className="oni-text-muted max-w-4xl leading-7">
            AI agents build fast. Really fast. But fast systems need structure. My architecture is designed to keep agent speed while adding the missing system layer: modular boundaries, architecture contracts, file exchange, versioned dev logs, agent-readable JSON audits, prompt versioning, evals, confidence scores, and rollback context.
          </p>
          <p className="oni-text mt-6 text-xl font-black leading-snug">
            The repo should not just store code. It should store the memory of how the system was built.
          </p>
          <a
            href={PROJECT_NPM_URL}
            target="_blank"
            rel="noreferrer"
            className="oni-accent-link mt-6 inline-flex items-center gap-2 text-sm font-bold"
          >
            View {PROJECT_NPM_NAME} on npm <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </SectionShell>

      <SectionShell id="microservices" eyebrow="03 / growth path" title="The architecture starts as a modular monolith, but the boundaries prepare it for service extraction later.">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="oni-surface oni-border oni-shadow rounded-[2rem] border p-8 shadow-sm">
            <Split className="oni-accent-icon mb-5 h-8 w-8" />
            <h3 className="oni-text text-2xl font-black tracking-tight">Why not microservices first?</h3>
            <p className="oni-text-muted mt-4 leading-7">
              Splitting too early creates overhead. A modular monolith lets agent workflows move fast while keeping clear ownership boundaries. When one module becomes stable, valuable, and independent enough, it can naturally become a service boundary later.
            </p>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
            <Network className="mb-5 h-8 w-8 text-cyan-300" />
            <h3 className="text-2xl font-black tracking-tight">Growth path</h3>
            <div className="mt-6 grid gap-3">
              {[
                "Start with one repo",
                "Create bounded modules",
                "Add contracts and audit logs",
                "Stabilize pipelines with evals",
                "Extract services only when boundaries prove themselves",
              ].map((step, idx) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">{idx + 1}</span>
                  <span className="font-bold text-slate-100">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="sources" eyebrow="04 / sources" title="Reference board for sourced media, community visuals, and project links.">
        <div className="grid gap-4 md:grid-cols-2">
          {sources.map((source) =>
            source.url === "#" ? (
              <div key={source.label} className="oni-surface oni-border oni-shadow rounded-3xl border p-6 shadow-sm">
                <p className="oni-text font-black">{source.label}</p>
                <p className="oni-text-muted mt-2 text-sm leading-6">{source.detail}</p>
              </div>
            ) : (
              <a
                key={source.label}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="oni-surface oni-border oni-shadow group rounded-3xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="oni-text font-black">{source.label}</p>
                    <p className="oni-text-muted mt-2 text-sm leading-6">{source.detail}</p>
                  </div>
                  <ExternalLink className="oni-text-subtle h-5 w-5 shrink-0 group-hover:text-cyan-400" />
                </div>
              </a>
            ),
          )}
        </div>
      </SectionShell>
    </>
  );
}

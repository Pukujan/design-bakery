import React from "react";
import { ArrowDown, ExternalLink } from "lucide-react";
import decorOrbit from "../../assets/pukujan-decor-orbit.svg";
import astronautTool from "../../assets/pukujan-astronaut-tool.svg";
import astronautSystem from "../../assets/pukujan-astronaut-system.svg";
import { BrandMark } from "./BrandMark";
import { PROJECT_NPM_NAME, PROJECT_NPM_URL } from "./projectLinks";
import {
  agentPipelineFlow,
  agentUseCases,
  aiSystemLayers,
  narrativeCards,
  oniSystemLayers,
  specializedAgentRoles,
} from "./waterLoopsData";

function NarrativeMediaCard({
  card,
  index,
}: {
  card: (typeof narrativeCards)[number];
  index: number;
}) {
  const reversed = index % 2 === 1;
  const fitContain = card.mediaFit === "contain";
  const bodyParagraphs = card.bodyParagraphs?.length ? card.bodyParagraphs : card.body ? [card.body] : [];

  return (
    <article className="oni-surface oni-border oni-shadow relative overflow-hidden rounded-[2rem] border shadow-sm">
      <img src={decorOrbit} alt="" className="pointer-events-none absolute -right-20 -top-24 h-64 w-48 opacity-[0.07]" />
      <div className={`grid gap-0 lg:grid-cols-2 ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div className="relative flex flex-col bg-slate-950">
          <div
            className={
              fitContain
                ? "flex min-h-[14rem] flex-1 items-center justify-center p-3 sm:min-h-[18rem] lg:min-h-[22rem]"
                : "relative min-h-[14rem] sm:min-h-[18rem] lg:min-h-[20rem]"
            }
          >
            <img
              src={card.mediaSrc}
              alt={card.mediaAlt}
              className={
                fitContain
                  ? "max-h-[min(32rem,70vh)] w-full object-contain object-center"
                  : "h-56 w-full object-cover sm:h-72 lg:absolute lg:inset-0 lg:h-full lg:object-cover"
              }
              loading="lazy"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-950/95 px-4 py-3 text-xs">
            <span className="font-bold text-slate-400">{card.sourceLabel}</span>
            <a
              href={card.sourceHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-cyan-200 hover:text-white"
            >
              View media <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <p className="oni-eyebrow text-xs font-black uppercase tracking-[0.28em]">
            {String(index + 1).padStart(2, "0")} / narrative
          </p>
          <h3 className="oni-text mt-3 text-2xl font-black tracking-tight md:text-3xl">{card.title}</h3>
          <div className="oni-text-muted mt-4 space-y-4 leading-7">
            {bodyParagraphs.map((paragraph, pIndex) => (
              <p key={`${card.id}-p-${pIndex}`}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-6 grid gap-3">
            <p className="oni-surface-muted rounded-2xl p-4 text-sm leading-6">
              <span className="oni-text-subtle block text-xs font-black uppercase tracking-[0.2em]">ONI</span>
              <span className="oni-text mt-1 block font-semibold">{card.oniCaption}</span>
            </p>
            <p className="oni-accent-soft oni-border rounded-2xl border p-4 text-sm leading-6">
              <span className="oni-eyebrow block text-xs font-black uppercase tracking-[0.2em]">AI agents</span>
              <span className="oni-text mt-1 block font-semibold">{card.aiCaption}</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function PipelineFlowDiagram() {
  return (
    <>
      <div className="scrollbar-hide hidden gap-2 overflow-x-auto pb-2 md:flex md:items-center">
        {agentPipelineFlow.map((step, index) => (
          <React.Fragment key={step}>
            <div className="oni-flow-active shrink-0 rounded-2xl border px-3 py-3 text-center text-xs font-bold whitespace-nowrap">
              {step}
            </div>
            {index < agentPipelineFlow.length - 1 ? (
              <span className="oni-text-subtle shrink-0 text-lg font-black" aria-hidden>
                →
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
      <div className="grid gap-2 md:hidden">
        {agentPipelineFlow.map((step, index) => (
          <React.Fragment key={step}>
            <div className="oni-flow-active rounded-2xl border px-4 py-3 text-center text-sm font-bold">{step}</div>
            {index < agentPipelineFlow.length - 1 ? (
              <ArrowDown className="oni-text-subtle mx-auto h-5 w-5" aria-hidden />
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

export function WaterLoopsNarrativeSection() {
  return (
    <section id="waterLoops" className="oni-border-t scroll-mt-28 border-t py-20">
      <div className="mb-10">
        <p className="oni-eyebrow mb-3 text-xs font-bold uppercase tracking-[0.35em]">03 / water loops</p>
        <h2 className="oni-text max-w-5xl text-3xl font-black tracking-tight md:text-5xl">
          From Water Loops to Multi-Agent Pipelines
        </h2>
        <p className="oni-text-muted mt-4 max-w-3xl text-lg font-semibold leading-8">
          How ONI taught me to think about flow, failure, automation, and controlled systems.
        </p>
        <p className="oni-text-muted mt-6 max-w-4xl text-lg leading-8">
          This is only one ONI system. A water loop is just one piece of the game. To build a sustainable colony, you also have to think about heat, cooling, power, gas flow, food management, resources, infrastructure, manpower, automation, and long-term failure points.
        </p>
        <p className="oni-text-muted mt-4 max-w-4xl text-lg leading-8">
          That is exactly how AI agent systems work too. One pipeline is not enough. You also need prompt control, evals, file routing, logs, review gates, cost control, model behavior, human judgment, rollback paths, and architecture boundaries.
        </p>
      </div>

      <div className="grid gap-8">
        {narrativeCards.map((card, index) => (
          <NarrativeMediaCard key={card.id} card={card} index={index} />
        ))}
      </div>

      <div className="oni-surface oni-border oni-shadow mt-14 rounded-[2rem] border p-6 md:p-8">
        <h3 className="oni-text text-2xl font-black tracking-tight md:text-3xl">One ONI system is never just one system</h3>
        <p className="oni-text-muted mt-4 max-w-3xl leading-7">
          A water loop is only one layer of ONI. A prompt pipeline is only one layer of AI engineering. The real challenge is making all the layers work together without collapsing.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="oni-surface-muted rounded-3xl p-6">
            <p className="oni-eyebrow text-xs font-black uppercase tracking-[0.25em]">ONI systems</p>
            <ul className="oni-text mt-4 grid gap-2 sm:grid-cols-2">
              {oniSystemLayers.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="oni-accent-soft oni-border rounded-3xl border p-6">
            <p className="oni-eyebrow text-xs font-black uppercase tracking-[0.25em]">AI agent systems</p>
            <ul className="oni-text mt-4 grid gap-2 sm:grid-cols-2">
              {aiSystemLayers.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="oni-surface oni-border oni-shadow rounded-[2rem] border p-6 md:p-8">
          <h3 className="oni-text text-2xl font-black tracking-tight md:text-3xl">The risk and advantage of AI agents</h3>
          <p className="oni-text-muted mt-4 leading-7">
            AI agents are powerful because they can move fast across complex workflows. But that is also the risk. If the architecture is weak, agents can spread mistakes faster than a human can catch them.
          </p>
          <p className="oni-text-muted mt-4 leading-7">
            But when the system is designed correctly, the advantage is huge. The same agent-first architecture can help with difficult, high-complexity workflows like:
          </p>
          <ul className="oni-text-muted mt-4 grid gap-2 sm:grid-cols-2">
            {agentUseCases.map((item) => (
              <li key={item} className="text-sm leading-6">— {item}</li>
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

      <div className="relative mt-14 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl md:p-8">
        <img src={decorOrbit} alt="" className="pointer-events-none absolute -right-24 -top-32 h-80 w-56 opacity-15" />
        <BrandMark
          src={astronautSystem}
          alt=""
          preset="decor"
          frameClassName="pointer-events-none absolute right-4 top-4 opacity-20"
        />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">500-agent pipeline</p>
        <h3 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">My 500 Specialized Prompt-Agent Pipeline</h3>
        <p className="mt-5 max-w-4xl leading-7 text-slate-300">
          This is why I do not think about AI systems as one giant smart agent. I think about them as many specialized prompt-agents with narrow jobs. In my own architecture, I tested pipelines with up to 500 specialized prompt-agents — not 500 random agents chatting aimlessly, not a swarm hype claim.
        </p>
        <p className="mt-4 max-w-4xl leading-7 text-slate-300">
          A structured pipeline where each prompt-agent has a specific job. That feels exactly like Oxygen Not Included. One pipe is not the achievement. A working colony is. One prompt is not the achievement. A sustainable multi-agent system is.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {specializedAgentRoles.map((role) => (
            <span key={role} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-100">
              {role}
            </span>
          ))}
        </div>
        <div className="oni-surface oni-border mt-10 rounded-[1.5rem] border p-6">
          <p className="oni-text mb-6 text-sm font-black uppercase tracking-[0.2em]">Connected pipeline flow</p>
          <PipelineFlowDiagram />
        </div>
      </div>

      <div className="oni-surface oni-border oni-shadow mt-14 rounded-[2rem] border p-6 md:p-8">
        <p className="oni-eyebrow text-xs font-black uppercase tracking-[0.28em]">Architecture response</p>
        <h3 className="oni-text mt-3 text-2xl font-black tracking-tight md:text-3xl">
          Why I built{" "}
          <a href={PROJECT_NPM_URL} target="_blank" rel="noreferrer" className="oni-accent-link hover:underline">
            {PROJECT_NPM_NAME}
          </a>
        </h3>
        <p className="oni-text-muted mt-5 max-w-4xl leading-7">
          AI agents build fast. Really fast. But fast systems need structure. My architecture is designed to keep agent speed while adding the missing system layer: modular boundaries, architecture contracts, file exchange, versioned dev logs, agent-readable JSON audits, prompt versioning, evals, confidence scores, and rollback context.
        </p>
        <p className="oni-text mt-6 text-xl font-black leading-snug">
          The repo should not just store code. It should store the memory of how the system was built.
        </p>
      </div>
    </section>
  );
}

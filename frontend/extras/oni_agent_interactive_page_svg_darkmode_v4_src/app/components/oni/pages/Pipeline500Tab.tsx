import React, { useState } from "react";
import decorOrbit from "../../../assets/pukujan-decor-orbit.svg";
import astronautSystem from "../../../assets/pukujan-astronaut-system.svg";
import { BrandMark } from "../BrandMark";
import { PipelineFlowDiagram } from "../PipelineFlowDiagram";
import { agentFamilies, pipelineStages } from "../caseStudyData";
import { specializedAgentRoles } from "../waterLoopsData";
import { Arrow, FlowStep, SectionShell } from "../caseStudyUi";

export function Pipeline500Tab() {
  const [pipelineMode, setPipelineMode] = useState("agent");

  return (
    <>
      <section className="py-12 lg:py-16">
        <p className="oni-eyebrow text-xs font-bold uppercase tracking-[0.35em]">500-agent pipeline</p>
        <h1 className="oni-text mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
          Piping a 500-agent base: jobs, routes, sensors, and fail-safes.
        </h1>
        <p className="oni-text-muted mt-6 max-w-3xl text-lg leading-8">
          Up to 500 specialized prompt-agents in a structured pipeline — each with a distinct job, route, eval signal, and downstream contract.
        </p>
      </section>

      <SectionShell id="pipeline500" eyebrow="01 / 500 specialized agents" title="Piping a 500-agent base: jobs, routes, sensors, and fail-safes for every prompt-agent.">
        <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">What 500 means here</p>
              <h3 className="mt-4 text-4xl font-black tracking-tight">Up to 500 specialized prompt-agents, not 500 random chatbots.</h3>
              <p className="mt-5 leading-7 text-slate-300">
                Not a swarm hype claim — a structured pipeline where each prompt-agent has a distinct job, route, eval signal, and downstream contract.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {agentFamilies.map(([title, text]) => (
                <div key={title} className="rounded-3xl bg-white/10 p-5">
                  <p className="font-black text-cyan-100">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="oni-surface oni-border oni-shadow mt-8 rounded-[2rem] border p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              ["oni", "ONI pipe loop"],
              ["agent", "Agent pipeline"],
              ["solve", "How architecture solves it"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPipelineMode(key)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${pipelineMode === key ? "oni-tab-active" : "oni-tab-idle"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {pipelineMode === "oni" && (
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
              <FlowStep label="Input resource" />
              <Arrow />
              <FlowStep label="Pipe route" />
              <Arrow />
              <FlowStep label="Machine processing" />
              <Arrow />
              <FlowStep label="Output storage or next loop" />
            </div>
          )}
          {pipelineMode === "agent" && (
            <div className="grid gap-3 md:grid-cols-5">
              {pipelineStages.map((stage, index) => (
                <div key={stage} className="oni-surface-muted oni-border rounded-2xl border p-4 text-center text-sm font-black">
                  <span className="oni-eyebrow mb-2 block text-xs">{String(index + 1).padStart(2, "0")}</span>
                  {stage}
                </div>
              ))}
            </div>
          )}
          {pipelineMode === "solve" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["Contracts", "Define what each agent owns, outputs, and must not touch."],
                ["File exchange", "Put every input and output into stamped folders."],
                ["Audit logs", "Preserve what changed, failed, and should happen next."],
                ["Evals", "Check output quality before downstream trust."],
              ].map(([title, text]) => (
                <div key={title} className="oni-solve-card rounded-3xl border p-5">
                  <p className="oni-solve-card-title font-black">{title}</p>
                  <p className="oni-solve-card-text mt-2 text-sm leading-6">{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="oni-callout relative mt-8 overflow-hidden rounded-[2rem] border p-6">
          <BrandMark
            src={astronautSystem}
            alt="Astronaut system accent"
            preset="decor"
            frameClassName="pointer-events-none absolute -right-5 -top-8 opacity-25"
          />
          <p className="font-black">Why this is hard</p>
          <p className="mt-2 leading-7">
            Piping 500 specialized prompt-agents is not hard because one agent is impossible. It is hard because every agent needs a clean role, input, output, eval signal, failure path, audit trail, and downstream contract. Without that, speed turns into chaos.
          </p>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl md:p-8">
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
      </SectionShell>
    </>
  );
}

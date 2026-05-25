import React from "react";
import { Brain, ExternalLink, Gamepad2 } from "lucide-react";
import astronautLogo from "../../../assets/pukujan-astronaut-logo.svg";
import astronautRocket from "../../../assets/pukujan-astronaut-rocket.svg";
import astronautPlanet from "../../../assets/pukujan-astronaut-planet.svg";
import astronautFloat from "../../../assets/pukujan-astronaut-float.svg";
import astronautLab from "../../../assets/pukujan-astronaut-lab.svg";
import decorOrbit from "../../../assets/pukujan-decor-orbit.svg";
import decorSystem from "../../../assets/pukujan-decor-system.svg";
import { BrandMark } from "../BrandMark";
import { MappingScrollSection } from "../MappingScrollSection";
import { mappingRows } from "../mappingData";
import { ProjectLinkButtons } from "../ProjectLinkButtons";
import { WaterLoopsNarrativeSection } from "../WaterLoopsNarrativeSection";
import { failureRows, imageRefs } from "../caseStudyData";
import { PROJECT_NPM_NAME, PROJECT_NPM_URL } from "../projectLinks";
import { Arrow, FlowStep, MiniDiagram, SectionShell, StatPill } from "../caseStudyUi";

export function OniAnalogyTab() {
  return (
    <>
      <section className="grid gap-10 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
        <div>
          <a
            href={PROJECT_NPM_URL}
            target="_blank"
            rel="noreferrer"
            className="oni-accent-pill mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.25em] transition hover:opacity-90"
          >
            <Gamepad2 className="h-4 w-4" aria-hidden />
            {PROJECT_NPM_NAME} case study
            <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </a>
          <h1 className="oni-text max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-7xl">
            Oxygen Not Included taught me why AI agent systems break.
          </h1>
          <p className="oni-text-muted mt-6 max-w-3xl text-xl leading-8">
            Oxygen Not Included is not hard because one pipe is hard — it is hard because every pipe belongs to a larger survival system. AI agent engineering feels the same: one prompt, one API, or one file processor is not the hard part. The hard part is making many specialized agents, prompts, files, evals, logs, and review steps work together without the system breaking.
          </p>
          <ProjectLinkButtons size="md" className="mt-8" />
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="oni-chip oni-border oni-shadow inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black shadow-sm">
              <BrandMark src={astronautLogo} alt="Pukujan astronaut" preset="chip" /> Pukujan
            </span>
            <span className="oni-chip oni-border oni-shadow inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black shadow-sm">
              <BrandMark src={astronautRocket} alt="Pukujan astronaut rocket" preset="chip" /> Agent-first systems
            </span>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatPill value="500" label="specialized prompt-agents tested in an orchestrated document pipeline" />
            <StatPill value="2x" label="memory tracks: human-readable dev logs and agent-readable JSON audits" />
            <StatPill value="1" label="core idea: keep agent speed but add architecture that remembers" />
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-900/10 bg-slate-950 p-4 shadow-2xl">
          <div className="grid gap-4">
            <div className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-cyan-300 via-sky-300 to-blue-500 p-5">
              <img src={decorOrbit} alt="" className="pointer-events-none absolute -right-16 -top-20 h-80 w-56 opacity-45" />
              <img src={decorSystem} alt="" className="pointer-events-none absolute -bottom-24 -left-12 h-80 w-56 opacity-35" />
              <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                <div className="oni-explorer-card rounded-[1.2rem] p-4 shadow-lg">
                  <p className="oni-text-subtle text-xs font-black uppercase tracking-[0.28em]">Agent system explorer</p>
                  <BrandMark src={astronautPlanet} alt="Pukujan astronaut" preset="hero" frameClassName="mx-auto mt-4" />
                </div>
                <div className="oni-explorer-card rounded-[1.2rem] p-4 shadow-lg">
                  <p className="oni-text-subtle text-xs font-black uppercase tracking-[0.28em]">Pipeline explorer</p>
                  <BrandMark src={astronautRocket} alt="Pukujan astronaut rocket" preset="hero" frameClassName="mx-auto mt-4" />
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-[1.35rem] border border-white/10">
              <img
                src={imageRefs[0].src}
                alt="Official Oxygen Not Included colony base reference from Klei"
                className="h-56 w-full object-cover"
              />
              <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm text-slate-300">
                <span>Official ONI media reference from Klei</span>
                <a href={imageRefs[0].source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-cyan-200 hover:text-white">
                  Source <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionShell id="thesis" eyebrow="01 / thesis" title="The game is not hard because one pipe is hard. It is hard because every pipe belongs to a survival system.">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Brain className="h-10 w-10 text-cyan-300" />
              <BrandMark
                src={astronautFloat}
                alt="Astronaut section accent"
                preset="accent"
                frameClassName="border border-white/10 bg-white/10"
              />
            </div>
            <p className="text-2xl font-black leading-tight">AI agent engineering feels the same.</p>
            <p className="mt-5 leading-7 text-slate-300">
              One prompt is not the hard part. One API is not the hard part. One file processor is not the hard part. The hard part is making many specialized agents, prompts, files, evals, logs, and review steps work together without the system breaking.
            </p>
            <p className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-slate-200">
              Personal note: I used to play ONI in an unhealthy, obsessive way, sometimes staying up way too long because one more fix became one more system. I do not want to glamorize that. But it explains why agentic coding feels familiar: it scratches the same systems brain.
            </p>
          </div>
          <div className="oni-surface oni-border oni-shadow rounded-[2rem] border p-6">
            <div className="grid gap-3 md:grid-cols-5 md:items-center">
              <FlowStep label="Build" />
              <Arrow />
              <FlowStep label="Break" />
              <Arrow />
              <FlowStep label="Debug" />
              <Arrow />
              <FlowStep label="Log" />
              <Arrow />
              <FlowStep label="Blueprint" />
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                ["ONI loop", "Oxygen, heat, water, food, power, automation, waste."],
                ["Agent loop", "Prompts, files, evals, logs, APIs, review, audit trail."],
                ["Shared pain", "A single weak handoff creates downstream failure."],
                ["Shared solution", "Blueprints, sensors, logs, and controlled loops."],
              ].map(([title, text]) => (
                <div key={title} className="oni-surface-muted rounded-2xl p-5">
                  <p className="oni-text font-black">{title}</p>
                  <p className="oni-text-muted mt-2 text-sm leading-6">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="oni" eyebrow="02 / ONI systems" title="Oxygen Not Included is a colony sim, but the feeling is systems engineering.">
        <div className="grid gap-6 lg:grid-cols-3">
          {imageRefs.map((image) => (
            <article key={image.title} className="oni-surface oni-border oni-shadow overflow-hidden rounded-[2rem] border shadow-sm">
              <img src={image.src} alt={image.title} className="h-48 w-full object-cover" />
              <div className="p-5">
                <h3 className="oni-text font-black">{image.title}</h3>
                <p className="oni-text-muted mt-2 text-sm leading-6">{image.note}</p>
                <a href={image.source} target="_blank" rel="noreferrer" className="oni-accent-link mt-4 inline-flex items-center gap-2 text-sm font-bold">
                  View source <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Scarcity", "Klei frames oxygen, warmth, and sustenance as constant survival threats, so every system is under pressure."],
            ["Physics-like rules", "Steam highlights thermodynamics, plumbing, power grids, and complex gas/liquid simulations as core features."],
            ["Automation", "Sensors and logic let systems stabilize instead of needing manual reaction forever."],
            ["Blueprint culture", "Tutorials matter because the game teaches through failure, iteration, and design patterns."],
          ].map(([title, text]) => (
            <div key={title} className="oni-surface oni-border oni-shadow rounded-3xl border p-6 shadow-sm">
              <p className="oni-text font-black">{title}</p>
              <p className="oni-text-muted mt-3 text-sm leading-6">{text}</p>
            </div>
          ))}
        </div>
      </SectionShell>

      <WaterLoopsNarrativeSection />

      <SectionShell id="learning" eyebrow="04 / learning curve" title="ONI takes a long time to learn because the failure points are layered. Agent engineering feels the same.">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="oni-surface oni-border oni-shadow rounded-[2rem] border p-8 shadow-sm">
            <h3 className="oni-text text-2xl font-black tracking-tight">The early game lie</h3>
            <p className="oni-text-muted mt-4 leading-7">
              ONI starts simple: dig, breathe, eat, sleep. Then the base gets bigger and every quick fix becomes a future problem. Oxygen depends on water. Water depends on heat. Heat depends on materials. Materials depend on power. Power depends on fuel. Fuel depends on routing.
            </p>
            <p className="oni-text-muted mt-4 leading-7">
              Agent systems start the same way. One prompt works. Then there are ten prompts, files, schemas, evals, logs, review states, and exported artifacts. The system becomes hard because the connections become the product.
            </p>
          </div>
          <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-black tracking-tight">Learning pattern</h3>
              <BrandMark
                src={astronautLab}
                alt="Astronaut lab accent"
                preset="accent"
                frameClassName="bg-white/10 p-2"
              />
            </div>
            <div className="mt-6 grid gap-3">
              {[
                "Watch tutorial",
                "Copy blueprint",
                "Fail on a different map",
                "Study why it failed",
                "Patch the design",
                "Document the pattern",
                "Reuse it with better constraints",
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

      <SectionShell id="mapping" eyebrow="05 / mapping" title="The analogy becomes useful when each game system maps to an AI engineering failure mode.">
        <div className="lg:hidden">
          <div className="scrollbar-hide -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4">
            {mappingRows.map((row, index) => (
              <article key={row.oni} className="oni-surface oni-border oni-shadow min-w-[82%] snap-center rounded-[2rem] border p-6 shadow-sm">
                <p className="oni-eyebrow text-xs font-black uppercase tracking-[0.28em]">Selected analogy {String(index + 1).padStart(2, "0")}</p>
                <div className="mt-5 grid gap-4">
                  <div className="oni-surface-muted rounded-3xl p-5">
                    <p className="oni-text-subtle text-sm font-bold">ONI</p>
                    <p className="oni-text mt-2 text-2xl font-black">{row.oni}</p>
                  </div>
                  <div className="oni-accent-highlight rounded-3xl p-5">
                    <p className="oni-accent-highlight-label text-sm font-bold">AI agents</p>
                    <p className="mt-2 text-2xl font-black">{row.ai}</p>
                  </div>
                  <p className="oni-text-muted leading-7">{row.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <MappingScrollSection />
      </SectionShell>

      <SectionShell id="failure" eyebrow="06 / failure cascade" title="The scary part is not the first failure. The scary part is silent propagation.">
        <div className="grid gap-6 lg:grid-cols-2">
          <MiniDiagram title="ONI cascade" left="Water pipe blocked" middle="Oxygen loop stops" right="Colony labor collapses" />
          <MiniDiagram title="Agent cascade" left="Bad extraction" middle="Wrong JSON trusted" right="Downstream decision breaks" />
        </div>
        <div className="oni-surface oni-border oni-shadow mt-8 overflow-hidden rounded-[2rem] border shadow-sm">
          <div className="grid border-b border-slate-200 bg-slate-950 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-cyan-200 md:grid-cols-3">
            <span>Failure</span>
            <span>ONI analogy</span>
            <span>Architecture response</span>
          </div>
          {failureRows.map(([failure, oni, fix]) => (
            <div key={failure} className="oni-border grid gap-3 border-b px-6 py-5 text-sm last:border-0 md:grid-cols-3">
              <p className="oni-text font-black">{failure}</p>
              <p className="oni-text-muted">{oni}</p>
              <p className="oni-accent-response font-semibold">{fix}</p>
            </div>
          ))}
        </div>
      </SectionShell>
    </>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  Brain,
  ClipboardList,
  Database,
  ExternalLink,
  FileJson,
  Gamepad2,
  Gauge,
  GitBranch,
  History,
  Layers,
  Network,
  RefreshCcw,
  Rocket,
  ScrollText,
  ShieldCheck,
  Split,
} from "lucide-react";
import astronautLogo from "../../assets/pukujan-astronaut-logo.svg";
import astronautRocket from "../../assets/pukujan-astronaut-rocket.svg";
import astronautPlanet from "../../assets/pukujan-astronaut-planet.svg";
import astronautFloat from "../../assets/pukujan-astronaut-float.svg";
import astronautSystem from "../../assets/pukujan-astronaut-system.svg";
import astronautLab from "../../assets/pukujan-astronaut-lab.svg";
import astronautTool from "../../assets/pukujan-astronaut-tool.svg";
import decorOrbit from "../../assets/pukujan-decor-orbit.svg";
import decorSystem from "../../assets/pukujan-decor-system.svg";
import { BrandMark } from "./BrandMark";


const navItems = [
  { id: "thesis", label: "Thesis" },
  { id: "oni", label: "ONI" },
  { id: "learning", label: "Learning Curve" },
  { id: "mapping", label: "Mapping" },
  { id: "failure", label: "Failure" },
  { id: "pipeline500", label: "500 Agents" },
  { id: "architecture", label: "Architecture" },
  { id: "audit", label: "Audit Trail" },
  { id: "microservices", label: "Microservices" },
  { id: "sources", label: "Sources" },
];

const imageRefs = [
  {
    title: "Official ONI colony base media",
    src: "https://assets.klei.com/f/259446/1600x900/c03bceb078/base.jpg/m/fit-in/700x420/filters%3Aquality%2875%29",
    source: "https://www.klei.com/games/oxygen-not-included",
    note: "Use as a sourced visual reference for base layout, rooms, pipes, and colony systems.",
  },
  {
    title: "Official ONI gas biome media",
    src: "https://assets.klei.com/f/259446/1920x1080/4ed8d5f0ca/gas-biome.jpg/m/fit-in/700x420/filters%3Aquality%2875%29",
    source: "https://www.klei.com/games/oxygen-not-included",
    note: "Good visual for gases, pressure, environment, and flow-based thinking.",
  },
  {
    title: "Official ONI in-base media",
    src: "https://assets.klei.com/f/259446/1920x1080/43da0525f1/dance-party.jpg/m/fit-in/700x420/filters%3Aquality%2875%29",
    source: "https://www.klei.com/games/oxygen-not-included",
    note: "Useful for showing how a living base becomes a network of systems, work, and stress.",
  },
];

const comparisonRows = [
  ["Oxygen pipes", "Document and data pipelines", "A blocked pipe starves a colony. A blocked input stage starves downstream agents."],
  ["Liquid and gas flow", "Input and output routing", "Everything depends on correct routing, not just a working machine."],
  ["Heat transfer", "Bad assumptions spreading downstream", "A small hidden issue can spread until the whole workflow becomes unstable."],
  ["Power grid", "API cost, rate limits, compute, model usage", "The system needs enough power, but it also needs safe load distribution."],
  ["Automation sensors", "Evals, confidence gates, validation triggers", "Sensors decide when to stop, route, retry, or escalate."],
  ["Blueprints", "Reusable architecture contracts", "You do not rebuild every loop from scratch once the pattern works."],
  ["Colony reports", "Versioned dev logs and audit trails", "Memory makes future debugging possible."],
  ["Duplicants", "Specialized prompt-agents", "Workers need bounded jobs, clear inputs, and safe outputs."],
  ["Waste loops", "Rejected outputs, schema drift, bad data", "Waste does not vanish. It needs containment, cleanup, or rejection."],
  ["DLC and patches", "Model, tool, prompt, and framework changes", "The environment keeps changing, so the architecture has to adapt."],
];

const architectureCards = [
  {
    icon: Layers,
    title: "Modular boundaries",
    text: "Agents need smaller rooms to work in. Modules keep backend, frontend, prompt, and eval work from bleeding everywhere.",
  },
  {
    icon: ScrollText,
    title: "Human dev logs",
    text: "Markdown logs keep the story: what changed, why it changed, what failed, and what still needs review.",
  },
  {
    icon: FileJson,
    title: "Agent audit JSON",
    text: "Structured logs give future agents machine-readable context instead of forcing them to guess from files alone.",
  },
  {
    icon: Database,
    title: "File exchange",
    text: "Timestamped imports and exports act like clean pipe inlets and outlets for documents, outputs, and handoffs.",
  },
  {
    icon: Gauge,
    title: "Evals and confidence",
    text: "Confidence scores work like system readings: not proof of perfection, but a signal for instability and review.",
  },
  {
    icon: RefreshCcw,
    title: "Patch and rollback context",
    text: "Git shows the diff. Audit trails explain the decision, failure, risk, and rollback path around the diff.",
  },
];

const agentFamilies = [
  ["Intake agents", "Receive documents, normalize file names, detect type, stamp imports, and preserve source context."],
  ["Extraction agents", "Pull facts, dates, parties, clauses, labels, or entities from raw documents."],
  ["Classification agents", "Route documents or chunks by type, risk, topic, workflow stage, or confidence."],
  ["Validation agents", "Check schema, required fields, contradictions, source grounding, and missing evidence."],
  ["Eval agents", "Compare outputs against golden fixtures, expected JSON, rubrics, or confidence thresholds."],
  ["Audit agents", "Write machine-readable logs, failure notes, model metadata, and handoff instructions."],
  ["Review agents", "Prepare human-readable summaries, review queues, and provisional vs verified status."],
  ["Export agents", "Package outputs, snapshots, manifests, and next-agent context into traceable export folders."],
];

const pipelineStages = [
  "Document intake",
  "Type detection",
  "Chunking",
  "Extraction",
  "Normalization",
  "Classification",
  "Validation",
  "Eval scoring",
  "Human review",
  "Audit export",
];

const failureRows = [
  ["Bad source document", "Polluted water entering the wrong pipe", "Quarantine imports, preserve source metadata, mark low-quality inputs"],
  ["Prompt overreach", "Duplicant doing the wrong errand", "Bound prompt-agent scope with contracts and expected outputs"],
  ["Schema drift", "Pipe fitting no longer connects", "Run schema validation and version contracts"],
  ["Hidden hallucination", "Heat leaking behind walls", "Source grounding checks and confidence scoring"],
  ["Lost context", "No colony history after a collapse", "Human dev logs and agent audit JSON"],
  ["Bad patch", "Emergency build that fixes one thing and breaks another", "Patch notes, rollback context, and CI checks"],
];

const sources = [
  {
    label: "Astronaut SVG assets used on this page",
    detail: "Uploaded SVG assets were renamed and used as Pukujan visual accents. The files did not include embedded creator metadata, so add the original creator/source here once confirmed.",
    url: "#",
  },
  {
    label: "Klei official ONI page",
    detail: "Official framing around oxygen, warmth, sustenance, survival, thriving, Spaced Out, and official media assets.",
    url: "https://www.klei.com/games/oxygen-not-included",
  },
  {
    label: "Steam store page",
    detail: "Release date, Steam description, and official feature sections covering plumbing, power grids, thermodynamics, and gas/liquid simulation.",
    url: "https://store.steampowered.com/app/457140/Oxygen_Not_Included/",
  },
  {
    label: "ONI Wiki: Elements",
    detail: "Reference for solids, liquids, gases, vacuum, void, and material categories.",
    url: "https://oxygennotincluded.wiki.gg/wiki/Elements",
  },
  {
    label: "ONI Wiki: Automation",
    detail: "Reference for automation sensors, logic, and control behavior.",
    url: "https://oxygennotincluded.wiki.gg/wiki/Guide/Automation",
  },
  {
    label: "ONI Wiki: Thermal Conductivity",
    detail: "Reference for how materials transfer heat, useful for the heat-leak analogy.",
    url: "https://oxygennotincluded.wiki.gg/wiki/Thermal_Conductivity",
  },
  {
    label: "SteamDB patch history",
    detail: "Reference point for ongoing patch and update history over time.",
    url: "https://steamdb.info/app/457140/patchnotes/",
  },
  {
    label: "Francis John ONI tutorials",
    detail: "Community learning culture and tutorial-heavy blueprint learning.",
    url: "https://www.youtube.com/playlist?list=PLS-hAL3jgjOt7qpH-JZ1d5hJcjfoAZOnk",
  },
  {
    label: "Brothgar ONI automation videos",
    detail: "Engineering-style experiments, automation, and system builds.",
    url: "https://www.youtube.com/@Brothgar/search?query=oxygen%20not%20included%20automation",
  },
];

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0.1, 0.25, 0.5] }
    );

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [ids]);

  return active;
}

function SectionShell({
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
    <section id={id} className="oni-border-t scroll-mt-28 border-t py-20">
      <div className="mb-8">
        <p className="oni-eyebrow mb-3 text-xs font-bold uppercase tracking-[0.35em]">{eyebrow}</p>
        <h2 className="oni-text max-w-5xl text-3xl font-black tracking-tight md:text-5xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="oni-surface oni-border oni-shadow rounded-3xl border p-5">
      <p className="oni-text text-3xl font-black tracking-tight">{value}</p>
      <p className="oni-text-muted mt-2 text-sm font-bold leading-6">{label}</p>
    </div>
  );
}

function FlowStep({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div className={`oni-shadow rounded-2xl border px-4 py-3 text-center text-sm font-semibold ${muted ? "oni-flow-muted" : "oni-flow-active"}`}>
      {label}
    </div>
  );
}

function Arrow() {
  return <ArrowDown className="oni-text-subtle mx-auto my-2 h-5 w-5 md:rotate-[-90deg]" />;
}

function MiniDiagram({ title, left, middle, right }: { title: string; left: string; middle: string; right: string }) {
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

export function OniAgentCaseStudyPage() {
  const ids = useMemo(() => navItems.map((item) => item.id), []);
  const active = useActiveSection(ids);
  const [selectedMap, setSelectedMap] = useState(0);
  const [pipelineMode, setPipelineMode] = useState("oni");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isDark = theme === "dark";

  return (
    <div data-theme={theme} className="oni-page">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-20">
        <img src={decorOrbit} alt="" className="absolute -right-24 top-28 h-[34rem] w-[24rem] object-contain blur-[1px]" />
        <img src={decorSystem} alt="" className="absolute -left-28 bottom-12 h-[38rem] w-[28rem] object-contain blur-[1px]" />
      </div>
      <header className="oni-header fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <a href="#top" className="oni-text flex items-center gap-3 font-black tracking-tight">
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
          <nav className="hidden items-center gap-1 xl:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${active === item.id ? "oni-nav-active" : "oni-nav-idle"}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="oni-btn inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-sm ring-1"
            >
              {isDark ? "Light mode" : "Dark mode"}
            </button>
            <a
              href="https://www.klei.com/games/oxygen-not-included"
              target="_blank"
              rel="noreferrer"
              className="oni-btn hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-sm ring-1 sm:inline-flex"
            >
              ONI source <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-3 xl:hidden">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${active === item.id ? "oni-nav-active" : "oni-nav-mobile-idle"}`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </header>

      <main id="top" className="mx-auto max-w-7xl px-4 pb-24 pt-32 md:px-6">
        <section className="grid gap-10 py-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
          <div>
            <div className="oni-accent-pill mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.25em]">
              <Gamepad2 className="h-4 w-4" /> pukujan@create-modular-monolith case study
            </div>
            <h1 className="oni-text max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-7xl">
              Oxygen Not Included taught me why AI agent systems break.
            </h1>
            <p className="oni-text-muted mt-6 max-w-3xl text-xl leading-8">
              ONI feels like pipes, pressure, heat, survival, and failure loops. Agent-first coding feels the same: prompts, files, evals, audit trails, and specialized agents all depend on each other. One weak connection can break the whole loop. The astronaut visuals give the page a lightweight exploration theme that fits the system-building story.
            </p>
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
                One prompt can work once. One API can work once. One file processor can work once. The hard part is making the whole connected loop survive repeated failure points without losing context.
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

        <SectionShell id="learning" eyebrow="03 / learning curve" title="ONI takes a long time to learn because the failure points are layered. Agent engineering feels the same.">
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

        <SectionShell id="mapping" eyebrow="04 / mapping" title="The analogy becomes useful when each game system maps to an AI engineering failure mode.">
          <div className="md:hidden">
            <div className="scrollbar-hide -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4">
              {comparisonRows.map(([oni, ai, why], index) => (
                <article key={oni} className="oni-surface oni-border oni-shadow min-w-[82%] snap-center rounded-[2rem] border p-6 shadow-sm">
                  <p className="oni-eyebrow text-xs font-black uppercase tracking-[0.28em]">Selected analogy {String(index + 1).padStart(2, "0")}</p>
                  <div className="mt-5 grid gap-4">
                    <div className="oni-surface-muted rounded-3xl p-5">
                      <p className="oni-text-subtle text-sm font-bold">ONI</p>
                      <p className="oni-text mt-2 text-2xl font-black">{oni}</p>
                    </div>
                    <div className="oni-accent-highlight rounded-3xl p-5">
                      <p className="oni-accent-highlight-label text-sm font-bold">AI agents</p>
                      <p className="mt-2 text-2xl font-black">{ai}</p>
                    </div>
                    <p className="oni-text-muted leading-7">{why}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="hidden gap-8 md:grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="oni-surface oni-border oni-shadow max-h-[42rem] overflow-y-auto rounded-[2rem] border p-6 pr-4 shadow-sm">
              <p className="oni-text-subtle mb-4 text-sm font-bold uppercase tracking-[0.2em]">Interactive mapping</p>
              <div className="grid gap-2">
                {comparisonRows.map(([oni, ai], index) => (
                  <button
                    key={oni}
                    onClick={() => setSelectedMap(index)}
                    className={`rounded-2xl border p-4 text-left transition ${selectedMap === index ? "oni-map-selected oni-shadow border" : "oni-map-idle border"}`}
                  >
                    <p className="oni-text font-black">{oni}</p>
                    <p className="oni-text-muted mt-1 text-sm">{ai}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="sticky top-28 h-fit overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
              <img src={decorOrbit} alt="" className="pointer-events-none absolute -right-24 -top-32 h-96 w-72 opacity-20" />
              <BrandMark
                src={astronautTool}
                alt="Astronaut tool accent"
                preset="accent"
                frameClassName="absolute right-5 top-5 bg-white/10 p-2"
              />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Selected analogy</p>
              <div className="relative mt-8 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="rounded-3xl bg-white/10 p-6">
                  <p className="text-sm font-bold text-slate-400">ONI</p>
                  <p className="mt-2 text-2xl font-black">{comparisonRows[selectedMap][0]}</p>
                </div>
                <ArrowDown className="mx-auto h-6 w-6 text-cyan-300 md:rotate-[-90deg]" />
                <div className="oni-accent-highlight rounded-3xl p-6">
                  <p className="oni-accent-highlight-label text-sm font-bold">AI agents</p>
                  <p className="mt-2 text-2xl font-black">{comparisonRows[selectedMap][1]}</p>
                </div>
              </div>
              <p className="relative mt-8 text-xl font-bold leading-8 text-slate-200">{comparisonRows[selectedMap][2]}</p>
            </div>
          </div>
        </SectionShell>

        <SectionShell id="failure" eyebrow="05 / failure cascade" title="The scary part is not the first failure. The scary part is silent propagation.">
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

        <SectionShell id="pipeline500" eyebrow="06 / 500 specialized agents" title="The 500-agent pipeline is like piping a giant ONI base: every specialized unit needs a job, route, sensor, and fail-safe.">
          <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">What 500 means here</p>
                <h3 className="mt-4 text-4xl font-black tracking-tight">Up to 500 specialized prompt-agents, not 500 random chatbots.</h3>
                <p className="mt-5 leading-7 text-slate-300">
                  The architecture was tested around an orchestrated document-processing pipeline where each prompt-agent has a distinct function. That is closer to an ONI base full of machines, pipes, sensors, filters, and storage loops than a swarm of independent agents doing whatever they want.
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
        </SectionShell>

        <SectionShell id="architecture" eyebrow="07 / architecture" title="My modular monolith package is the base blueprint for agent-first coding.">
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
              {[
                ["What changed", History],
                ["What failed", AlertTriangle],
                ["What was reviewed", ShieldCheck],
                ["What to do next", Rocket],
              ].map(([label, Icon]) => {
                const RealIcon = Icon as typeof History;
                return (
                  <div key={String(label)} className="rounded-3xl bg-white/10 p-5">
                    <RealIcon className="mb-4 h-6 w-6 text-cyan-300" />
                    <p className="font-bold">{label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionShell>

        <SectionShell id="audit" eyebrow="08 / audit trail" title="Git shows the diff. The audit trail explains the system reason around the diff.">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              [ClipboardList, "Human dev log", "A readable story of what changed, why it changed, what failed, what was risky, and what the next human should know."],
              [FileJson, "Agent JSON audit", "Machine-readable memory for future agents: changed files, tests, outputs, errors, prompt versions, and handoff notes."],
              [GitBranch, "Patch and rollback context", "The change is not only a commit. It has reason, risk, validation, and a rollback path if it breaks downstream."],
            ].map(([Icon, title, text]) => {
              const RealIcon = Icon as typeof ClipboardList;
              return (
                <div key={String(title)} className="oni-surface oni-border oni-shadow rounded-[2rem] border p-8 shadow-sm">
                  <RealIcon className="oni-accent-icon mb-5 h-8 w-8" />
                  <h3 className="oni-text text-2xl font-black tracking-tight">{title as string}</h3>
                  <p className="oni-text-muted mt-4 leading-7">{text as string}</p>
                </div>
              );
            })}
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

        <SectionShell id="microservices" eyebrow="09 / growth path" title="The architecture starts as a modular monolith, but the boundaries prepare it for service extraction later.">
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

        <SectionShell id="sources" eyebrow="10 / sources" title="Reference board for turning this into a sourced interactive blog or thesis-style case study.">
          <div className="grid gap-4 md:grid-cols-2">
            {sources.map((source) => (
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
              )
            ))}
          </div>

          <div className="oni-callout mt-10 rounded-[2rem] border p-6 text-sm leading-6">
            <p className="font-black">Image sourcing note</p>
            <p className="mt-2">
              The page uses official Klei-hosted ONI media URLs and links back to Klei as the source. Before publishing publicly, keep the source links visible and confirm usage and attribution expectations for your portfolio or blog context.
            </p>
          </div>
        </SectionShell>
      </main>

      <footer className="oni-footer border-t">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-[auto_1fr_auto] md:items-center md:px-6">
          <div className="flex items-center gap-4">
            <BrandMark
              src={astronautLogo}
              alt="Pukujan footer logo"
              preset="footer"
              frameClassName="oni-surface oni-border oni-shadow border shadow-sm"
            />
            <div>
              <p className="oni-text text-2xl font-black tracking-tight">Pukujan</p>
              <p className="oni-text-subtle text-sm font-bold uppercase tracking-[0.2em]">Agent-first architecture case study</p>
            </div>
          </div>
          <p className="oni-text-muted max-w-2xl text-sm leading-6">Astronaut visual system connected to exploration, engineering loops, and sustainable systems. Case study theme: why Oxygen Not Included feels like building a 500-specialized-agent pipeline.</p>
          <a href="#top" className="oni-nav-active inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-black shadow-sm hover:opacity-90">Back to top</a>
        </div>
      </footer>
    </div>
  );
}

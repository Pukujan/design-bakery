import {
  AlertTriangle,
  ClipboardList,
  Database,
  FileJson,
  Gauge,
  GitBranch,
  History,
  Layers,
  RefreshCcw,
  Rocket,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { PROJECT_NPM_NAME, PROJECT_NPM_URL, PROJECT_GITHUB_URL, PROJECT_STUDY_BLOG_URL } from "./projectLinks";

export type CaseStudyPageId = "oni" | "architecture" | "pipeline" | "risk";

export const caseStudyPages: { id: CaseStudyPageId; label: string; shortLabel: string }[] = [
  { id: "oni", label: "ONI Analogy", shortLabel: "ONI" },
  { id: "architecture", label: "Agent Architecture", shortLabel: "Architecture" },
  { id: "pipeline", label: "500-Agent Pipeline", shortLabel: "500 Agents" },
  { id: "risk", label: "Risk + Advantage", shortLabel: "Risk" },
];

export const oniPageNavItems = [
  { id: "thesis", label: "Thesis" },
  { id: "oni", label: "ONI" },
  { id: "waterLoops", label: "Water Loops" },
  { id: "learning", label: "Learning Curve" },
  { id: "mapping", label: "Mapping" },
  { id: "failure", label: "Failure" },
];

export const architecturePageNavItems = [
  { id: "architecture", label: "Architecture" },
  { id: "architecture-flow", label: "Flow" },
  { id: "audit", label: "Audit Trail" },
];

export const pipelinePageNavItems = [{ id: "pipeline500", label: "500 Agents" }];

export const riskPageNavItems = [
  { id: "risk", label: "Risk" },
  { id: "why-built", label: "Why I Built It" },
  { id: "microservices", label: "Growth Path" },
  { id: "sources", label: "Sources" },
];

export type PageNavItem = { id: string; label: string };

export function getPageNavItems(pageId: CaseStudyPageId): PageNavItem[] {
  switch (pageId) {
    case "oni":
      return oniPageNavItems;
    case "architecture":
      return architecturePageNavItems;
    case "pipeline":
      return pipelinePageNavItems;
    case "risk":
      return riskPageNavItems;
    default:
      return oniPageNavItems;
  }
}

export const imageRefs = [
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

export const architectureCards = [
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

export const architectureFlowSteps = [
  "Human Planning",
  "Module Contract",
  "File Import",
  "Agent Work",
  "Prompt Version",
  "Eval Check",
  "Audit Log",
  "Human Review",
  "Exported Output",
  "Next Agent Handoff",
];

export const agentFamilies = [
  ["Intake agents", "Receive documents, normalize file names, detect type, stamp imports, and preserve source context."],
  ["Extraction agents", "Pull facts, dates, parties, clauses, labels, or entities from raw documents."],
  ["Classification agents", "Route documents or chunks by type, risk, topic, workflow stage, or confidence."],
  ["Validation agents", "Check schema, required fields, contradictions, source grounding, and missing evidence."],
  ["Eval agents", "Compare outputs against golden fixtures, expected JSON, rubrics, or confidence thresholds."],
  ["Audit agents", "Write machine-readable logs, failure notes, model metadata, and handoff instructions."],
  ["Review agents", "Prepare human-readable summaries, review queues, and provisional vs verified status."],
  ["Export agents", "Package outputs, snapshots, manifests, and next-agent context into traceable export folders."],
];

export const pipelineStages = [
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

export const failureRows = [
  ["Bad source document", "Polluted water entering the wrong pipe", "Quarantine imports, preserve source metadata, mark low-quality inputs"],
  ["Prompt overreach", "Duplicant doing the wrong errand", "Bound prompt-agent scope with contracts and expected outputs"],
  ["Schema drift", "Pipe fitting no longer connects", "Run schema validation and version contracts"],
  ["Hidden hallucination", "Heat leaking behind walls", "Source grounding checks and confidence scoring"],
  ["Lost context", "No colony history after a collapse", "Human dev logs and agent audit JSON"],
  ["Bad patch", "Emergency build that fixes one thing and breaks another", "Patch notes, rollback context, and CI checks"],
];

export const sources = [
  {
    label: PROJECT_NPM_NAME,
    detail: "npm package for scaffolding agent-first modular monolith repos with dev logs, audit trails, and bounded module boundaries.",
    url: PROJECT_NPM_URL,
  },
  {
    label: "create-modular-monolith on GitHub",
    detail: "Source repository for the package, templates, and architecture contracts referenced in this case study.",
    url: PROJECT_GITHUB_URL,
  },
  {
    label: "Technical study blog (Design Bakery)",
    detail: "Long-form engineering log for the modular monolith and agent-first workflow work behind this page.",
    url: PROJECT_STUDY_BLOG_URL,
  },
  {
    label: "Water loop GIF — Steam user content",
    detail: "Community visual reference for the simple water loop narrative card.",
    url: "https://images.steamusercontent.com/ugc/2038484798752154306/1A1CE0FA0DBC5DDCECAFD4548B7B3BC9C2D2C92B/?imw=637&imh=358&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true",
  },
  {
    label: "Broken pipe image — Reddit community media",
    detail: "Community visual reference for unstable pipe / routing failure analogy.",
    url: "https://preview.redd.it/my-liquid-pipe-keeps-breaking-v0-ehq4msa6ohve1.png?width=640&crop=smart&auto=webp&s=3aaa9be6398feaeaf492b33e30dca7896db73e98",
  },
  {
    label: "Water injector GIF — Klei forum community media",
    detail: "Community visual reference for automation-controlled water loop analogy.",
    url: "https://cdn.forums.klei.com/monthly_2021_06/363972178_waterinjector.gif.2e23e5e605511be626396ac160f6737d.gif",
  },
  {
    label: "Volcano control GIF — Reddit community media",
    detail: "Community visual reference for scaling a loop into a chaotic system.",
    url: "https://i.redd.it/culryrrblgsb1.gif",
  },
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

export const architectureMemoryCards = [
  ["What changed", History],
  ["What failed", AlertTriangle],
  ["What was reviewed", ShieldCheck],
  ["What to do next", Rocket],
] as const;

export const auditTrailCards = [
  [ClipboardList, "Human dev log", "A readable story of what changed, why it changed, what failed, what was risky, and what the next human should know."],
  [FileJson, "Agent JSON audit", "Machine-readable memory for future agents: changed files, tests, outputs, errors, prompt versions, and handoff notes."],
  [GitBranch, "Patch and rollback context", "The change is not only a commit. It has reason, risk, validation, and a rollback path if it breaks downstream."],
] as const;

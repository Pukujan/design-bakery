/**
 * CONTENT CONTRACT — transcribed verbatim from the brief.
 * Nothing here is invented: exact project names, taglines, descriptions,
 * tech tags, links, the About text, the five roles, skills and contact.
 */

export type Device = "signboard" | "billboard" | "lantern" | "panel" | "passing";

export type ProjectLink = { label: string; href: string };

export type Project = {
  index: string;
  title: string;
  tagline: string;
  /** tagline is a package name / identifier — set in a code-ish face */
  monoTagline?: boolean;
  description: string;
  tech: string[];
  links: ProjectLink[];
  stats?: { value: string; label: string }[];
  device: Device;
  side: "left" | "right";
};

export const ARRIVAL_LINE = "Design Bakery — AI Engineer";

/** The few narrative lines. Each one is about the person and the work. */
export const SCENE_LINES = {
  descent: "I build AI systems that have to prove they still work on a Tuesday.",
  cut: "The part nobody sees is the part that holds.",
  night: "If you have an AI system that has to keep working, I would like to hear about it.",
} as const;

/** Sparse scene accents only — English beneath, never carrying needed content. */
export const JP_ACCENTS = {
  evening: { jp: "夕", en: "Evening" },
  lightShadow: { jp: "光と影", en: "Light and shadow" },
  lantern: { jp: "灯", en: "Lantern" },
  night: { jp: "夜", en: "Night" },
} as const;

export const PROJECTS: Project[] = [
  {
    index: "01",
    title: "Study OS",
    tagline: "When it doesn't click, change the explanation.",
    description:
      "A public AI learning project: models can generate endless explanations, but learners still need help finding the one that makes sense. Study OS learns from where a student gets stuck and tries a different representation.",
    tech: ["AI Learning", "Adaptive Tutoring", "Learning Science", "Python"],
    links: [
      { label: "Case Study", href: "/case-studies/study-os" },
      { label: "Live App", href: "https://study.design-bakery.com/" },
      { label: "GitHub", href: "https://github.com/Pukujan/Study-os" },
    ],
    device: "signboard",
    side: "left",
  },
  {
    index: "02",
    title: "Cortex",
    tagline: "A reliability kernel for AI agents.",
    description:
      "A deny-by-default reference monitor, unforgeable content-bound receipts, trust-graded sandboxes and deterministic oracle gates, so interchangeable models do real work on a codebase you never have to read to trust.",
    tech: [
      "AI Agents",
      "Reliability Kernel",
      "Reference Monitor",
      "Sandboxing",
      "Formal Invariants",
      "Contract-first",
    ],
    links: [
      { label: "Case Study", href: "/case-studies/cortex" },
      { label: "Technical Spec", href: "/case-studies/cortex/specs" },
    ],
    device: "billboard",
    side: "right",
  },
  {
    index: "03",
    title: "FOSSIL",
    tagline: "Keep the why.",
    description:
      "Preserves the research, evidence, rejected paths and changing reasoning behind human-led technical decisions.",
    tech: ["Decision Lineage", "Provenance", "Evidence", "AI-Assisted Work"],
    links: [{ label: "Case Study", href: "/case-studies/fossil" }],
    device: "lantern",
    side: "left",
  },
  {
    index: "04",
    title: "ONI vs My Agent Ready Architecture",
    tagline: "@pukujan/create-modular-monolith",
    monoTagline: true,
    description:
      "An npm package so repos keep agent speed without losing planning time, audit trails or architecture shape — modular boundaries, contracts, versioned dev logs, agent-readable JSON audits, prompt versioning, evals. Tested with multi-agent pipelines up to 500 agents.",
    tech: ["AI Agents", "Modular Monolith", "Audit Logs", "Prompt Versioning", "Evals"],
    links: [
      { label: "Case Study", href: "/case-studies/ai-agents/v3" },
      {
        label: "npm",
        href: "https://www.npmjs.com/package/@pukujan/create-modular-monolith",
      },
    ],
    device: "panel",
    side: "right",
  },
  {
    index: "05",
    title: "Ekagajpatra",
    tagline: "Civic-Tech Workflow Platform.",
    description:
      "A civic-tech product that turned complex government and legal-documentation processes into guided workflows.",
    tech: ["Workflow Design", "Product Engineering", "Civic Tech", "Full-Stack"],
    links: [{ label: "Live Platform", href: "https://www.ekagajpatra.com" }],
    stats: [
      { value: "35,000+", label: "users" },
      { value: "99%", label: "cost reduction" },
      { value: "5", label: "awards/grants" },
    ],
    device: "billboard",
    side: "left",
  },
  {
    index: "06",
    title: "SaaS Dashboard Systems",
    tagline: "Client Operations Tools.",
    description:
      "Dashboards, analytics views, workflow prototypes and client-specific tools for legal, financial and business operations teams.",
    tech: ["Solutions Engineering", "React", "Node.js", "Dashboards", "SaaS", "APIs"],
    links: [],
    device: "signboard",
    side: "right",
  },
  {
    index: "07",
    title: "Legal Workflow Research",
    tagline: "AI-Assisted Litigation & Document Intelligence.",
    description:
      "Independent research into safer AI-assisted legal workflows using document intelligence, confidence routing, source authority, human review and procedural memory.",
    tech: ["Legal AI", "RAG", "Workflow Systems", "Python", "Node.js"],
    links: [
      { label: "GitHub", href: "https://github.com/Pukujan/litigation-prompt-engineering-v2" },
    ],
    device: "panel",
    side: "left",
  },
  {
    index: "08",
    title: "Fluffy V4",
    tagline: "Same product. Different worlds.",
    description:
      "An agent workflow that researches a product, its buyers, market and proof before writing any marketing, then renders several genuinely different directions for a human to judge.",
    tech: ["AI Agents", "Product Marketing", "Three.js", "SVG", "Generated Imagery"],
    links: [
      { label: "Case Study", href: "/case-studies/fluffy-v4" },
      { label: "Live Gallery", href: "/case-studies/fluffy-v4/gallery" },
    ],
    device: "lantern",
    side: "right",
  },
  {
    index: "09",
    title: "Eval Lab",
    tagline: "When should we trust the judge?",
    description:
      "A reproducible research lab for lightweight AI judges, comparing judge decisions with objective evidence. 25 judges, from small local models to frontier APIs, on the same 760 objective decisions.",
    tech: ["Python", "LLM Judges", "Benchmarks", "Coverage", "Reproducibility"],
    links: [
      { label: "GitHub", href: "https://github.com/Pukujan/Eval-lab" },
      { label: "Research Paper", href: "/research/papers/db-r-2026-010" },
    ],
    device: "billboard",
    side: "left",
  },
  {
    index: "10",
    title: "Project Continuity Modules",
    tagline: "Projects outlast agent sessions.",
    description:
      "A protocol and a small Python CLI that keep a project's working memory in Git as plain Markdown and JSON, so any fresh human or agent session can resume.",
    tech: ["Python", "CLI", "Git", "Markdown/JSON", "Agent Workflows"],
    links: [
      { label: "GitHub", href: "https://github.com/Pukujan/project-continuity-modules" },
    ],
    device: "passing",
    side: "right",
  },
  {
    index: "11",
    title: "Inference Recommendation Engine",
    tagline: "The lowest price is not the decision.",
    description:
      "A local, provider-neutral engine that ranks inference routes from price ladders, observed supply, runtime evidence and an editable, versioned policy.",
    tech: ["JavaScript", "Node.js", "Python", "Property Testing", "Inference Routing"],
    links: [
      { label: "Today's Picks", href: "/ire" },
      { label: "GitHub", href: "https://github.com/Pukujan/inference-recommendation-engine" },
    ],
    device: "passing",
    side: "left",
  },
];

export const ABOUT = {
  name: "Pujan Bajracharya",
  paragraphs: [
    "Pujan Bajracharya, an AI-focused engineer working across legal datasets, agentic workflows, prompt systems, RAG, eval pipelines, LLM distillation, data analytics and human review.",
    "He cares about AI systems that retrieve context, follow constraints, produce structured outputs, measure performance against ground truth, and improve through data-driven prompt optimization.",
  ],
  highlights: [
    "Legal Dataset Testing",
    "Prompt Standard Optimization",
    "Data + AI Insights",
    "Product Engineering",
  ],
} as const;

export const EXPERIENCE = [
  {
    org: "Nepasoft LLC",
    role: "AI/ML Engineer",
    period: "Mar 2024 to Dec 2025",
  },
  {
    org: "The Fitzgerald Law Firm",
    role: "Litigation Operations / AI Workflow Systems",
    period: "Feb 2026 to Present",
  },
  {
    org: "Independent AI Projects",
    role: "AI Workflow Systems Builder",
    period: "Dec 2025 to Present",
  },
  {
    org: "Ekagajpatra",
    role: "Lead Product Designer / Full-Stack Developer",
    period: "Feb 2023 to Apr 2024",
  },
  {
    org: "Perpetual Motion Nepal",
    role: "Frontend Developer",
    period: "May 2023 to Apr 2025",
  },
] as const;

export const SKILLS = [
  {
    group: "AI & Systems",
    items: [
      "Agent orchestration",
      "RAG",
      "OCR",
      "Prompt engineering",
      "Evals",
      "Document intelligence",
      "Frontend",
      "Data",
    ],
  },
] as const;

export const CONTACT = {
  email: "hello@design-bakery.com",
  github: "https://github.com/Pukujan",
  linkedin: "https://www.linkedin.com/",
  resume: "/resume",
} as const;

export const NAV = [
  { label: "Home", href: "#arrival" },
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Journey", href: "#cut" },
  { label: "Contact", href: "#contact" },
] as const;

export type NarrativeCard = {
  id: string;
  title: string;
  mediaSrc: string;
  mediaAlt: string;
  sourceLabel: string;
  sourceHref: string;
  body: string;
  /** When set, renders multiple paragraphs instead of a single body block. */
  bodyParagraphs?: string[];
  oniCaption: string;
  aiCaption: string;
  /** Use contain so GIFs and tall media are fully visible without cropping. */
  mediaFit?: "cover" | "contain";
};

export const narrativeCards: NarrativeCard[] = [
  {
    id: "simple-loop",
    title: "Simple Loop",
    mediaSrc:
      "https://images.steamusercontent.com/ugc/2038484798752154306/1A1CE0FA0DBC5DDCECAFD4548B7B3BC9C2D2C92B/?imw=637&imh=358&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true",
    mediaAlt: "Oxygen Not Included simple water loop flowing through a base",
    sourceLabel: "Source: Steam user content",
    sourceHref:
      "https://images.steamusercontent.com/ugc/2038484798752154306/1A1CE0FA0DBC5DDCECAFD4548B7B3BC9C2D2C92B/?imw=637&imh=358&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true",
    mediaFit: "contain",
    body: "At first, a water loop looks simple. Water flows through the base, machines use it, and the system keeps moving. That is exactly how an AI pipeline starts too: a document comes in, one prompt processes it, another stage receives the output, and the flow looks clean.",
    oniCaption: "ONI analogy: a simple water loop flowing through the base.",
    aiCaption: "AI analogy: data moving through a multi-stage prompt-agent pipeline.",
  },
  {
    id: "broken-pipe",
    title: "Broken Pipe",
    mediaSrc:
      "https://preview.redd.it/my-liquid-pipe-keeps-breaking-v0-ehq4msa6ohve1.png?width=640&crop=smart&auto=webp&s=3aaa9be6398feaeaf492b33e30dca7896db73e98",
    mediaAlt: "Broken liquid pipe in Oxygen Not Included",
    sourceLabel: "Source: Reddit community media",
    sourceHref:
      "https://preview.redd.it/my-liquid-pipe-keeps-breaking-v0-ehq4msa6ohve1.png?width=640&crop=smart&auto=webp&s=3aaa9be6398feaeaf492b33e30dca7896db73e98",
    body: "But even a small loop breaks when the structure is weak. Bad routing, pressure problems, uncontrolled flow, or poor system planning can break the pipe again and again. AI systems fail the same way when prompts are not versioned, handoffs are unclear, outputs are not validated, and downstream agents trust weak upstream results.",
    oniCaption: "ONI analogy: pipes breaking from unstable system design.",
    aiCaption: "AI analogy: agent workflows breaking because architecture cannot control the flow.",
  },
  {
    id: "controlled-automation",
    title: "Controlled Automation",
    mediaSrc: "https://cdn.forums.klei.com/monthly_2021_06/363972178_waterinjector.gif.2e23e5e605511be626396ac160f6737d.gif",
    mediaAlt: "Automated water injector loop in Oxygen Not Included",
    sourceLabel: "Source: Klei forum community media",
    sourceHref: "https://cdn.forums.klei.com/monthly_2021_06/363972178_waterinjector.gif.2e23e5e605511be626396ac160f6737d.gif",
    mediaFit: "contain",
    body: "Automation turns a fragile loop into a controlled loop. Sensors, timing, routing, and logic make the system more reliable. That is what my architecture is trying to do for AI agents: add contracts, evals, confidence checks, file exchange, dev logs, and audit trails so the flow can be controlled instead of manually babysat.",
    oniCaption: "ONI analogy: water loop controlled with automation.",
    aiCaption: "AI analogy: managed agent flow with routing, validation, review, and audit trails.",
  },
  {
    id: "chaotic-system",
    title: "Same Loop, Controlled Chaos",
    mediaSrc: "https://i.redd.it/culryrrblgsb1.gif",
    mediaAlt: "Water loop used to control a volcano in Oxygen Not Included",
    sourceLabel: "Source: Reddit community media",
    sourceHref: "https://i.redd.it/culryrrblgsb1.gif",
    mediaFit: "contain",
    body: "Chaos becomes useful only when it is controlled. A volcano in ONI can melt your base into an unlivable disaster, but with the right routing, cooling, automation, and control layer, that same chaos becomes heat, power, minerals, clean water, and leverage. AI agents are the same: high-risk workflows are dangerous when uncontrolled, but with the right architecture, evals, audit trails, review gates, and routing, chaotic data becomes controlled system intelligence.",
    oniCaption: "ONI analogy: a controlled loop turns a volcano from a threat into a resource engine.",
    aiCaption:
      "AI analogy: controlled multi-agent architecture turns chaotic unstructured data into usable, reviewable workflow intelligence.",
  },
];

export const oniSystemLayers = [
  "water loops",
  "heat management",
  "cooling",
  "power grids",
  "gas flow",
  "food management",
  "resource extraction",
  "automation",
  "manpower",
  "failure recovery",
];

export const aiSystemLayers = [
  "document flow",
  "prompt versioning",
  "eval checks",
  "confidence scoring",
  "file routing",
  "model selection",
  "cost control",
  "human review",
  "audit logs",
  "rollback paths",
];

export const agentPipelineFlow = [
  "Document Input",
  "Intake Agent",
  "Extraction Agents",
  "Classification Agents",
  "Validation Agents",
  "Eval Agents",
  "Audit Agents",
  "Human Review",
  "Exported Output",
];

export const specializedAgentRoles = [
  "intake",
  "extraction",
  "classification",
  "normalization",
  "validation",
  "confidence scoring",
  "routing",
  "summarization",
  "audit creation",
  "review preparation",
  "export packaging",
];

export const agentUseCases = [
  "legal operations",
  "financial document analysis",
  "critical infrastructure workflows",
  "medical and healthcare operations",
  "compliance review",
  "high-volume document processing",
  "risk detection",
  "audit-heavy internal tools",
];

export const KLEI_FOOTER_DISCLAIMER =
  "Oxygen Not Included and related game assets belong to Klei Entertainment. I do not own Oxygen Not Included and I am not affiliated with, endorsed by, or sponsored by Klei Entertainment. This page uses game visuals and community media only as sourced references for a personal systems-engineering analogy.";

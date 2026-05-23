/** ONI ↔ agent architecture mapping rows for scrollytelling + mobile carousel. */

export type MappingRow = {
  oni: string;
  ai: string;
  detail: string;
};

export const mappingRows: MappingRow[] = [
  {
    oni: "Oxygen pipes",
    ai: "Document and data pipelines",
    detail: "A blocked pipe starves a colony. A blocked input stage starves downstream agents.",
  },
  {
    oni: "Liquid and gas flow",
    ai: "Input and output routing",
    detail: "Everything depends on correct routing, not just a working machine.",
  },
  {
    oni: "Heat transfer",
    ai: "Bad assumptions spreading downstream",
    detail: "A small hidden issue can spread until the whole workflow becomes unstable.",
  },
  {
    oni: "Power grid",
    ai: "API cost, rate limits, compute, model usage",
    detail: "The system needs enough power, but it also needs safe load distribution.",
  },
  {
    oni: "Automation sensors",
    ai: "Evals, confidence gates, validation triggers",
    detail: "Sensors decide when to stop, route, retry, or escalate.",
  },
  {
    oni: "Blueprints",
    ai: "Reusable architecture contracts",
    detail: "You do not rebuild every loop from scratch once the pattern works.",
  },
  {
    oni: "Colony reports",
    ai: "Versioned dev logs and audit trails",
    detail: "Memory makes future debugging possible.",
  },
  {
    oni: "Duplicants",
    ai: "Specialized prompt-agents",
    detail: "Workers need bounded jobs, clear inputs, and safe outputs.",
  },
  {
    oni: "Waste loops",
    ai: "Rejected outputs, schema drift, bad data",
    detail: "Waste does not vanish. It needs containment, cleanup, or rejection.",
  },
  {
    oni: "DLC and patches",
    ai: "Model, tool, prompt, and framework changes",
    detail: "The environment keeps changing, so the architecture has to adapt.",
  },
];

/** vh of scroll track per mapping row (sticky panel advances while user scrolls this range). */
export const MAPPING_STEP_VH = 70;

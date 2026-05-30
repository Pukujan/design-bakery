export const LEGAL_WORKFLOW_GITHUB =
  'https://github.com/Pukujan/litigation-system-research';

export const BLOGS_INDEX_PATH = '/endtoend-engineer/blogs';

export const SOURCES_FOOTER =
  'Sources: Anonymized litigation-operations observations; synthetic examples used for public demonstration.';

export const ARCHITECTURE_LAYERS: { title: string; description: string }[] = [
  {
    title: 'Legal Ops Incidents',
    description:
      'Anonymized workflow observations, docketing ambiguity, court behavior patterns, and attorney corrections.',
  },
  {
    title: 'Domain Modeling',
    description: 'Court events, rule hierarchy, judge/part rules, and procedural risk.',
  },
  {
    title: 'Document Intake',
    description: 'Privacy-safe, synthetic, or authorized legal document collection.',
  },
  {
    title: 'OCR / Text Extraction',
    description: 'Document parsing, source spans, layout handling, and structured fields.',
  },
  {
    title: 'Prompt + Eval Pipeline',
    description: 'Versioned prompts, golden JSON, workflow-specific evals, and dev logs.',
  },
  {
    title: 'RAG / Rule Context',
    description: 'Relevant procedural context with source authority and freshness.',
  },
  {
    title: 'Confidence Routing',
    description: 'Source grounding, field risk, model agreement, and workflow impact.',
  },
  {
    title: 'Model Arbitration',
    description: 'Disputed fields only, reasoning exchange, and convergence check.',
  },
  {
    title: 'Human Review',
    description: 'Escalation for ambiguity, high-risk fields, and authority conflicts.',
  },
  {
    title: 'Procedural Memory',
    description: 'Human corrections become reusable workflow intelligence.',
  },
  {
    title: 'Safer Workflow Actions',
    description: 'Act, block, flag, or require human approval.',
  },
];

export const AGENT_PIPELINE_STEPS: { title: string; description: string }[] = [
  { title: 'Document uploaded', description: 'Immutable intake and traceable job creation.' },
  { title: 'OCR worker', description: 'Produces candidate text and source regions.' },
  { title: 'Extraction worker', description: 'Produces candidate structured fields.' },
  {
    title: 'Source-grounding validator',
    description: 'Checks field support against source spans.',
  },
  {
    title: 'Authority validator',
    description: 'Checks controlling source and supersession.',
  },
  { title: 'Confidence router', description: 'Routes by agreement, grounding, and risk.' },
  {
    title: 'Human-review queue',
    description: 'Handles unresolved or high-risk ambiguity.',
  },
  {
    title: 'Approved workflow state',
    description: 'Only reviewed or safe fields advance.',
  },
  { title: 'Verified record', description: 'Durable writes happen after approval.' },
];

export const AUTHORITY_RANKS: { title: string; description: string }[] = [
  {
    title: 'General rule',
    description: 'Useful background, but not automatically controlling.',
  },
  {
    title: 'County / court-wide practice',
    description: 'Stronger when more specific to the case workflow.',
  },
  {
    title: 'Judge or part rule',
    description: 'Stronger when more specific to the case workflow.',
  },
  {
    title: 'Case-specific order',
    description: 'Stronger when more specific to the case workflow.',
  },
  {
    title: 'Later case-specific order',
    description: 'Highest practical priority when it supersedes earlier sources.',
  },
];

export const RESEARCH_REPOS: { name: string; description: string; url: string }[] = [
  {
    name: 'litigation-system-research',
    description: 'Main research platform for legal workflow intelligence.',
    url: LEGAL_WORKFLOW_GITHUB,
  },
  {
    name: 'litigation-prompt-engineering',
    description: 'Prompt, eval, and structured extraction platform for litigation documents.',
    url: 'https://github.com/Pukujan/litigation-prompt-engineering',
  },
  {
    name: 'litigation-ops',
    description: 'Early domain modeling and litigation operations research.',
    url: 'https://github.com/Pukujan/litigation-ops',
  },
  {
    name: 'create-modular-monolith',
    description: 'Agent-ready modular monolith architecture scaffold.',
    url: 'https://github.com/Pukujan/create-modular-monolith',
  },
  {
    name: 'legal-doc-grabber',
    description: 'Document intake utility for authorized legal document collection.',
    url: 'https://github.com/Pukujan/legal-doc-grabber',
  },
];

export type StudyBlogEntry = {
  title: string;
  theme: string;
  /** Used when live blog list has no title match (production CMS). */
  fallbackNumericId?: number;
};

export const STUDY_BLOG_TRAIL: StudyBlogEntry[] = [
  {
    title: 'The Extraction Is Easy. The Confidence Is Hard.',
    theme:
      'Confidence routing, model disagreement, arbitration, human review, procedural memory.',
    fallbackNumericId: 23,
  },
  {
    title: 'From Legal Hallucinations to Litigation Intelligence',
    theme:
      'Incident memory, authority ontology, temporal source tracking, evals, human review routing.',
  },
  {
    title: 'Stop Building God-Object Orchestrators in AI Pipelines',
    theme: 'State-machine control, validators, workers, durable workflow truth.',
  },
  {
    title: 'Stop Accumulating Agent Memory. Start Engineering Context.',
    theme:
      'Context control, scoped memory, freshness, authority hierarchy, stale memory rejection.',
  },
  {
    title: 'Why Modular Monoliths Fracture at Scale',
    theme:
      'Scaling AI pipelines, event-driven boundaries, durable workers, human review bottlenecks.',
  },
];

export const SECTION_SUBNAV: { href: string; label: string }[] = [
  { href: '#problem', label: 'Problem' },
  { href: '#example', label: 'Example' },
  { href: '#architecture', label: 'Pipeline' },
  { href: '#confidence', label: 'Routing' },
  { href: '#arbitration', label: 'Arbitration' },
  { href: '#authority', label: 'Authority' },
  { href: '#memory', label: 'Memory' },
  { href: '#evals', label: 'Evals' },
  { href: '#agent-safe', label: 'Agent-safe' },
  { href: '#status', label: 'Status' },
];

export type HubDestination = {
  title: string;
  path: string;
  description: string;
  color: string;
  accentColor: string;
  tag?: string;
};

export const HUB_DESTINATIONS: HubDestination[] = [
  {
    title: 'Fullstack Design Engineer',
    path: '/endtoend-engineer',
    description:
      'Design-led full-stack engineering — 0→1 products, scalable systems, and AI-enabled workflows.',
    color: '#6366F1',
    accentColor: '#A78BFA',
  },
  {
    title: 'Legal Workflow Engineer',
    path: '/legal-workflow-engineer',
    description:
      'AI systems for legal workflows: document intelligence, RAG, automation, and verification-first review.',
    color: '#4169E1',
    accentColor: '#8EA7FF',
  },
  {
    title: 'AI Engineer',
    path: '/ai-engineer',
    description:
      'Agentic systems, prompt standards, golden datasets, eval pipelines, and human-in-the-loop AI.',
    color: '#9B6DD6',
    accentColor: '#C4B5FD',
  },
  {
    title: 'Forward-Deployed Engineer',
    path: '/forward-deployed-engineer',
    description:
      'Solutions built close to the problem — client workflows, internal tools, AI automation, and product implementation.',
    color: '#0D9488',
    accentColor: '#14B8A6',
  },
  {
    title: 'Design Portfolio',
    path: '/design',
    description:
      'Visual design, advocacy, art gallery, web showcases, and creative product work.',
    color: '#F97316',
    accentColor: '#FB923C',
  },
];

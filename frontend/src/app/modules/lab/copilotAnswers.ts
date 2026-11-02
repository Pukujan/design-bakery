import rawProjects from '../../portfolios/endtoend-engineer/engineering/projects.json';
import hero from '../../portfolios/endtoend-engineer/engineering/hero.json';
import experience from '../../portfolios/endtoend-engineer/engineering/relevant-experience.json';
import { orderProjectsForShowcase } from '../../lib/projectOrder';

export type CopilotProject = (typeof rawProjects)[number];

export type CopilotAction =
  | { kind: 'scroll'; label: string; target: string }
  | { kind: 'link'; label: string; href: string };

export type CopilotAnswer = {
  text: string;
  projects?: CopilotProject[];
  actions?: CopilotAction[];
};

/**
 * Prototype answer engine: matches the question against the site's own
 * project index. No model call yet; the live copilot (TASK-DB-0098 next step)
 * replaces this function and keeps the same answer shape.
 */
const STOPWORDS = new Set(
  'the a an and or of to in on for with about your you me my what which how does do is are can tell show give any some have has work works project projects'.split(
    ' ',
  ),
);

const projects = orderProjectsForShowcase(rawProjects, 'all');

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9/+-]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
}

function score(project: CopilotProject, words: string[]): number {
  const title = project.title.toLowerCase();
  const tech = project.tech.join(' ').toLowerCase();
  const tagline = project.tagline.toLowerCase();
  const body = project.description.toLowerCase();
  return words.reduce((total, word) => {
    if (title.includes(word)) total += 6;
    if (project.category === word || `${project.category}`.startsWith(word)) total += 4;
    if (tech.includes(word)) total += 3;
    if (tagline.includes(word)) total += 2;
    if (body.includes(word)) total += 1;
    return total;
  }, 0);
}

function projectLink(project: CopilotProject): CopilotAction | null {
  const links = (project.links ?? []).filter((link) => link.url && link.url !== '#');
  const link = links.find((item) => item.label === 'Case Study') ?? links[0];
  return link ? { kind: 'link', label: `Open ${project.title}`, href: link.url } : null;
}

export function answer(question: string): CopilotAnswer {
  const q = question.toLowerCase();

  // Small talk, so a plain "hello" is never met with "I couldn't find that". The wording is
  // fixed and claims nothing the site does not say; the live service has the same replies.
  if (/^\s*(hi|hello|hey|yo|howdy|hiya|good (morning|afternoon|evening))\b[\s!.,?]*(there)?[\s!.,?]*$/.test(q)) {
    return {
      text: "Hey. I can take you through Pujan's work, research or writing, or point you at whatever is closest to what you are building.",
    };
  }
  if (/\b(how are you|how's it going|how are things|what's up|whats up)\b/.test(q)) {
    return {
      text: "Doing well, thanks. I'm Pujan's AI presence on this site, so I mostly think about his work. What would you like to see?",
    };
  }
  if (/\b(are you (a |an )?(real|human|bot|ai|robot|person|pujan)|am i (talking|speaking) to)\b/.test(q)) {
    return {
      text: "I'm Pujan's virtual presence on this site: an AI, not Pujan live. I answer from what is published here.",
    };
  }
  if (/\b(what can you (do|help)|how does this work|help me)\b/.test(q)) {
    return {
      text: 'I can walk you through the projects, the research papers and the writing, tell you about the work history, or help you book a free consultation.',
    };
  }
  if (/\b(thanks|thank you|cheers|appreciate it)\b/.test(q)) {
    return { text: 'Anytime. Ask about a project, a paper, or the work history whenever you want.' };
  }
  if (/^\s*(bye|goodbye|see you|see ya|cya|later)\b/.test(q)) {
    return { text: 'Thanks for stopping by. Come back any time, or email Pujan if you want to talk.' };
  }

  if (/\b(tour|show me around|walk me|where (do|should) i start)\b/.test(q)) {
    return {
      text: "Happy to. I'll scroll you to the work first: the big tiles are shipped products, then systems, research and experiments. Ask me about any of them on the way.",
      actions: [{ kind: 'scroll', label: 'Start the tour', target: '#work' }],
    };
  }

  if (/\b(book|consult|consultation|appointment|meeting|call)\b/.test(q)) {
    return {
      text: 'Pujan offers free 30-minute consultations on AI engineering, product design, marketing and full-stack development. The live copilot books them for you; for now, email is the quickest way.',
      actions: [{ kind: 'link', label: 'Email Pujan', href: 'mailto:pujan3645@gmail.com' }],
    };
  }

  if (/\b(contact|hire|email|reach|available|freelance)\b/.test(q)) {
    return {
      text: 'The quickest way is the contact form on the main site. Tell me what you are building and I will point you to the most relevant work first.',
      actions: [{ kind: 'link', label: 'Go to contact', href: '/contact' }],
    };
  }

  if (/\b(experience|experiences|work history|career|employment|jobs|roles)\b/.test(q)) {
    const roles = experience.experiences.map((item) => `${item.role} at ${item.company} (${item.period})`);
    return {
      text: `The site lists Pujan's experience as ${roles.join('; ')}.`,
      actions: [{ kind: 'scroll', label: 'See work history', target: '#experience' }],
    };
  }

  if (/\b(who|about you|background|what do you (do|build)|kind of ai|ai engineer|skills?|stack)\b/.test(q)) {
    const shipped = projects.filter((p) => p.category === 'shipped').slice(0, 3);
    return {
      text: `${hero.titleLine1} ${hero.description}`,
      projects: shipped,
    };
  }

  const words = tokens(question);
  const ranked = projects
    .map((project) => ({ project, value: score(project, words) }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const profile = `${hero.titleLine1} ${hero.titleLine2} ${hero.description}`.toLowerCase();
  if (ranked.length === 0 && words.some((word) => profile.includes(word))) {
    return {
      text: `That's part of my core work rather than one project. ${hero.description}`,
      projects: projects.filter((p) => p.category === 'shipped' || p.category === 'research').slice(0, 3),
    };
  }

  if (ranked.length === 0) {
    return {
      text: "I can only answer from what's on this site so far, and I couldn't find that. Try asking about a project, a technique like RAG or evals, or say “give me a tour”.",
    };
  }

  const [top, ...rest] = ranked.map((item) => item.project);
  const lead = `${top.title}: ${top.tagline}. ${top.description.split('. ').slice(0, 2).join('. ')}.`;
  const action = projectLink(top);
  return {
    text: rest.length ? `${lead}\n\nRelated work below.` : lead,
    projects: rest.slice(0, 3),
    actions: action ? [action] : undefined,
  };
}

/** Sample questions shown inside the composer; each one is matched by the answer engine. */
export const SUGGESTIONS = [
  'Who are you?',
  'What experience do you have?',
  'Can I book a consultation?',
  'What do you build?',
  'Give me a tour',
  'Which project used OCR?',
  'What is Cortex?',
] as const;

export const PLACEHOLDER_QUESTIONS = [
  'Ask about RAG, evals or agents…',
  'Which project used OCR?',
  'What is Cortex?',
  'Give me a tour of your work',
] as const;

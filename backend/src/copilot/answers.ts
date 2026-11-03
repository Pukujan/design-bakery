/**
 * Instant answers: the questions visitors actually open with, answered from the site's
 * own data without a model call (TASK-DB-0098 follow-up).
 *
 * The traces in Phoenix made the case. Eleven turns cost about 180k prompt tokens and
 * only 4k completion: the system brief plus the tool loop is the expense, and the
 * questions were almost all one of nine shapes (hello, what do you build, contact,
 * tour, blog, research, experience, projects, book). Those are answered here for free,
 * in one or two sentences, with the same events the model path sends.
 *
 * A cached answer never claims anything the brief would not: the wording is fixed, the
 * facts are read from the site at request time, and every answer that points somewhere
 * emits a navigate action so the visitor still ends up on the page.
 *
 * Deliberately conservative about when it fires: the first turn of a conversation, or a
 * near-exact match later. A follow-up ("open", "summarise that") depends on the
 * conversation, so it goes to the model.
 */
import { blogTime, loadBlogs, loadExperience, loadPapers, loadProjects, SOCIAL_LINKS, type BlogSummary, type Paper, type Project } from './knowledge.js';

export type CachedAction =
  | { kind: 'navigate'; path: string; label: string }
  | { kind: 'projects'; slugs: string[] }
  | { kind: 'link'; label: string; url: string }
  | { kind: 'book'; url: string; name?: string; email?: string; topic?: string };

/** `steps` are for a voice call only: scroll to a section when the spoken answer reaches character `at`. */
export type CachedAnswer = {
  intent: string;
  text: string;
  actions: CachedAction[];
  steps?: Array<{ path: string; at: number }>;
  /** Set by a routine (routines.ts) when the visitor explicitly asked to be taken somewhere: the page moves, in chat and on a call. */
  go?: boolean;
};

/**
 * Answers whose page move a voice call makes on its own: the visitor asked to be shown something, so the call takes
 * them there. Greetings, thanks and small talk never move the page.
 */
export const FOLLOW_ON_CALL = new Set(['tour', 'project', 'projects', 'blog', 'research', 'experience', 'identity', 'contact', 'book', 'service']);

type Intent = { id: string; phrases: string[]; keywords: string[] };

/**
 * Phrases a visitor actually types, not the only phrasings accepted: matching is fuzzy
 * on content words, so "how can i get in touch" still lands on contact.
 *
 * `keywords` are the unambiguous words that settle the intent outright. Fuzzy scoring
 * alone could not: "how do i contact pujan" scores the same against `contact` and
 * against `tell me about pujan`, because both explain one of its two content words.
 */
const INTENTS: Intent[] = [
  { id: 'greeting', phrases: ['hi', 'hello', 'hey', 'yo', 'good morning', 'good afternoon', 'howdy'], keywords: ['hi', 'hello', 'hey', 'howdy'] },
  { id: 'thanks', phrases: ['thanks', 'thank you', 'cheers', 'nice one', 'got it'], keywords: ['thanks', 'thank', 'cheers'] },
  { id: 'identity', phrases: ['what kind of ai do you build', 'what do you do', 'who is pujan', 'tell me about pujan', 'what is this site', 'what does he work on', 'who are you', 'what do you build', 'what do you make'], keywords: [] },
  { id: 'contact', phrases: ['contact', 'how do i reach him', 'email', 'get in touch', 'hire him', 'is he available for work'], keywords: ['contact', 'email', 'reach', 'hire', 'touch'] },
  { id: 'tour', phrases: ['give me a tour', 'show me around', 'walk me through', 'where do i start', 'show me your work'], keywords: ['tour', 'around'] },
  { id: 'blog', phrases: ['blog', 'writing', 'posts', 'articles'], keywords: ['blog', 'post', 'writing', 'article'] },
  { id: 'research', phrases: ['research', 'papers', 'publications'], keywords: ['research', 'paper', 'publication'] },
  { id: 'experience', phrases: ['experience', 'work history', 'where has he worked', 'jobs', 'resume', 'cv'], keywords: ['experience', 'resume', 'cv', 'worked', 'job'] },
  { id: 'projects', phrases: ['projects', 'portfolio', 'what has he built', 'case studies'], keywords: ['project', 'portfolio', 'built', 'case'] },
  { id: 'book', phrases: ['book a call', 'consultation', 'consult', 'schedule a call', 'talk to him'], keywords: ['book', 'consultation', 'consult', 'schedule', 'appointment'] },
];

/**
 * Small talk is matched on the raw sentence, before the word scoring: "how are you pujan"
 * is all stop words plus a name, and scored as words it lands on `who is pujan`. Short
 * sentences only, so a real question that happens to contain "help me" still goes on.
 */
const SMALL_TALK: Array<{ intent: Intent; pattern: RegExp }> = [
  { intent: { id: 'howareyou', phrases: [], keywords: [] }, pattern: /\b(how are you|how're you|how's it going|how are things|what's up|whats up)\b/ },
  { intent: { id: 'realai', phrases: [], keywords: [] }, pattern: /\b(are you (a |an )?(real|human|bot|ai|robot|person)|am i (talking|speaking) to|is this (really )?pujan|real or fake|are you (the )?same (person|as)|are you two|you and pujan|are you fake)\b/ },
  { intent: { id: 'capabilities', phrases: [], keywords: [] }, pattern: /\b(what can you (do|help)|how does this work)\b/ },
  { intent: { id: 'bye', phrases: [], keywords: [] }, pattern: /^\s*(bye|goodbye|see you|see ya|cya|later)\b/ },
];

function smallTalkIntent(question: string): Intent | null {
  const text = question.toLowerCase();
  if (text.trim().split(/\s+/).length > 10) return null;
  return SMALL_TALK.find((entry) => entry.pattern.test(text))?.intent ?? null;
}

const STOP = new Set(
  'the a an and or of to in on for with about your you me my i his he him do does did is are was what which how can could would tell show give any some have has it this that please just'.split(' '),
);

/** Content words, crudely stemmed so "experiences" and "experience" meet. */
export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP.has(word))
    .map((word) => (word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word));
}

/** Sørensen–Dice over the two word sets: 1 is identical, 0 shares nothing. */
function similarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const shared = a.filter((word) => setB.has(word)).length;
  return (2 * shared) / (a.length + setB.size);
}

/**
 * How much of the question the phrase accounts for. The tie-break matters: "how do i
 * contact pujan" matches both `contact` and `who is pujan` at the same Dice score, and
 * only coverage tells them apart — the phrase that explains more of the question wins.
 */
function coverage(a: string[], b: string[]): number {
  if (!a.length) return 0;
  const setB = new Set(b);
  return a.filter((word) => setB.has(word)).length / a.length;
}

function bestIntent(question: string, threshold: number): Intent | null {
  const asked = words(question);

  // An unambiguous word settles it, and keeps the behaviour predictable: "how do i
  // contact pujan" is a contact question however the rest of the sentence is phrased.
  // A greeting or a thanks is only that when it is all there is: "hey there, tell me about your projects" is a projects
  // question that happens to start with "hey", so those two only count for a very short message.
  const social = (intent: Intent) => intent.id === 'greeting' || intent.id === 'thanks';
  let byKeyword: { intent: Intent; hits: number } | null = null;
  for (const intent of INTENTS) {
    if (social(intent)) continue;
    const hits = asked.filter((word) => intent.keywords.includes(word)).length;
    if (hits > (byKeyword?.hits ?? 0)) byKeyword = { intent, hits };
  }
  if (!byKeyword && asked.length <= 3) {
    for (const intent of INTENTS) {
      if (!social(intent)) continue;
      const hits = asked.filter((word) => intent.keywords.includes(word)).length;
      if (hits > (byKeyword?.hits ?? 0)) byKeyword = { intent, hits };
    }
  }
  if (byKeyword) return byKeyword.intent;

  let best: { intent: Intent; score: number } | null = null;
  for (const intent of INTENTS) {
    for (const phrase of intent.phrases) {
      const phraseWords = words(phrase);
      const score = similarity(asked, phraseWords) + 0.01 * coverage(asked, phraseWords);
      if (score > (best?.score ?? 0)) best = { intent, score };
    }
  }
  return best && best.score >= threshold ? best.intent : null;
}

/** The four areas I consult on, with the projects that show each one. The questions come from the Contact page's buttons. */
const SERVICES: Array<{ match: RegExp; label: string; slugs: string[] }> = [
  { match: /\bai engineering\b/, label: 'AI engineering', slugs: ['precedent', 'eval-lab', 'website-copilot'] },
  { match: /\bproduct design\b/, label: 'product design', slugs: ['ekagajpatra', 'study-os'] },
  { match: /\bmarketing\b/, label: 'marketing', slugs: ['fluffy-v4'] },
  { match: /\bfull ?stack\b/, label: 'full-stack development', slugs: ['orbitgraph', 'voidfeed', 'ekagajpatra'] },
];

/** "How can you help with product design?": answered from a fixed line, the booking link and the related projects. */
function serviceAnswer(question: string, projects: Project[]): CachedAnswer | null {
  const q = norm(question);
  if (!/^(how can you help|how do you help|what can you do|can you help) (me )?(with|for)\b/.test(q)) return null;
  const service = SERVICES.find((entry) => entry.match.test(q));
  if (!service) return null;
  const slugs = service.slugs.filter((slug) => projects.some((project) => project.slug === slug));
  const booking = process.env.COPILOT_BOOKING_URL?.trim();
  return {
    intent: 'service',
    text: vary('service', [
      `I offer free 30-minute consultations on ${service.label}. Tell me what you are working on and pick a time, and I will come with ideas. Some related work is below.`,
      `${service.label[0].toUpperCase()}${service.label.slice(1)} is one of the four things I consult on. Book a free 30 minutes, tell me what you are building, and I will bring ideas. Related work is below.`,
      `Happy to help with ${service.label}. A free half-hour call is the way to start: pick a time and say what you are working on. A few related projects are below.`,
    ]),
    actions: [
      ...(slugs.length ? [{ kind: 'projects' as const, slugs }] : []),
      booking ? { kind: 'book' as const, url: booking } : { kind: 'link' as const, label: 'Email me', url: 'mailto:pujan3645@gmail.com' },
    ],
  };
}

/** The first sentences of a description, up to a short limit, so an answer stays a few lines. */
export function lead(text: string, limit = 280): string {
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/);
  let out = '';
  for (const sentence of sentences) {
    if (out && (out + ' ' + sentence).length > limit) break;
    out = out ? `${out} ${sentence}` : sentence;
    if (out.length >= limit * 0.6) break;
  }
  return out;
}

export const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * "Tell me about Cortex", "what is Orbitgraph", or just a project's name: answered from that project's record
 * (tagline and the start of its description) with a chip to its page. Short questions only, and only for a
 * project the site actually has, so a longer follow-up still goes to the model.
 */
function projectAbout(question: string, projects: Project[]): CachedAnswer | null {
  const q = norm(question);
  if (!q || q.split(' ').length > 9) return null;
  const asked = /^(please )?(can you |could you )?(tell me (more )?about|what is|what s|what are|explain|describe|about|show me|give me)\b/.test(q);
  let best: { project: Project; length: number } | null = null;
  for (const project of projects) {
    // The title, the slug, and a short name for the one project people call by half its name. Never a generic first
    // word: "show me your project" is not about Project Continuity Modules.
    const names = new Set([norm(project.title), norm(project.slug.replace(/-/g, ' ')), ...(project.slug === 'oni-architecture' ? ['oni'] : [])]);
    for (const name of names) {
      if (name.length < 3) continue;
      const exact = q === name;
      if (!exact && !(asked && new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(q))) continue;
      if (!best || name.length > best.length) best = { project, length: name.length };
    }
  }
  if (!best) return null;
  const { project } = best;
  return {
    intent: 'project',
    text: vary('project', [`${project.title}: ${project.tagline}. ${lead(project.description)}`, `${project.title} in short: ${project.tagline}. ${lead(project.description)}`, `${project.title}, briefly. ${project.tagline}. ${lead(project.description)}`]),
    actions: [navigate(`/work/${project.slug}`, `Open ${project.title}`)],
  };
}

/** One of several wordings, never the one used last for this key, so the same question twice does not read the same twice. */
const lastPick = new Map<string, number>();
export function vary<T>(key: string, options: readonly T[]): T {
  if (options.length === 1) return options[0];
  let index = Math.floor(Math.random() * options.length);
  if (index === lastPick.get(key)) index = (index + 1 + Math.floor(Math.random() * (options.length - 1))) % options.length;
  lastPick.set(key, index);
  return options[index];
}

export const list = (items: string[]) => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

export const navigate = (path: string, label: string): CachedAction => ({ kind: 'navigate', path, label });

/** Most recent blog and paper, by date, for the pointers that name one. */
export const latestBlog = (blogs: BlogSummary[]) => [...blogs].sort((a, b) => blogTime(b) - blogTime(a))[0];
export const latestPaper = (papers: Paper[]) => [...papers].sort((a, b) => b.submitted.localeCompare(a.submitted))[0];

function compose(
  intent: Intent,
  data: { projects: Project[]; papers: Paper[]; blogs: BlogSummary[]; experiences: Awaited<ReturnType<typeof loadExperience>>['experiences']; booking: string | undefined; voice: boolean; firstTurn: boolean },
): CachedAnswer {
  const { projects, papers, blogs, experiences, booking, voice, firstTurn } = data;
  const shipped = projects.filter((project) => project.category === 'shipped');
  const named = (shipped.length ? shipped : projects).slice(0, 2).map((project) => project.title);
  const email = SOCIAL_LINKS.find((link) => link.label === 'Email')?.url ?? 'mailto:pujan3645@gmail.com';
  // A navigate action moves the page the moment it arrives, so an instant answer carries
  // at most one. The rest of the journey is offered as chips the visitor chooses from.
  const book = booking
    ? [{ kind: 'book' as const, url: booking }]
    : [{ kind: 'link' as const, label: 'Email me', url: email }];

  switch (intent.id) {
    case 'greeting':
      return {
        intent: intent.id,
        // The texts are also pre-recorded (public/voice/hello-*.m4a, matched by text in holdAudio.ts): change both together.
        text: firstTurn
          ? vary('greeting', [
              "Hey, it's AI Pujan. I can take you through my work, my research or my writing, or point you at whatever is closest to what you're building.",
              "Hi, I'm AI Pujan. Want a tour of my work, or is there something you're building I can help with?",
              "Hello! I'm AI Pujan. Ask me about my projects, my writing, or my research.",
              'Hey there. AI Pujan here. What would you like to see first?',
            ])
          : vary('greeting-again', ['Hi again! What would you like to look at?', 'Hey, still here. Ask me about a project, a paper, or my work history.', 'Hello again. Where should we go next?']),
        actions: [navigate('/#work', 'See the work')],
      };

    case 'howareyou':
      return { intent: intent.id, text: vary('howareyou', ["Doing well, thanks. I'm AI Pujan, so I mostly think about my own work. What would you like to see?", 'All good here, thanks for asking. Want to see some work, or just chat?', "Can't complain. I live on this site, so it's a calm day. What are you curious about?", 'Pretty good! Ask me about a project, and I will get properly excited.']), actions: [] };

    case 'realai':
      return { intent: intent.id, text: vary('realai', ["He and I are one. I'm AI Pujan: his work and his voice, running as an AI. I'm not him live, but everything I say comes from what's published here.", "I'm an AI, and I'm Pujan too: his work and his way of explaining it. Not him live, but everything I say comes from what he published.", "Both, in a way. I'm AI Pujan, built from his projects, writing and research. He and I are one, though I'm not him live."]), actions: [] };

    case 'capabilities':
      return { intent: intent.id, text: vary('capabilities', ['I can walk you through the projects, the research papers and the writing, tell you about the work history, or help you book a free consultation.', 'Ask me about any project, a paper, a blog post or my experience. I can also take you on a tour or set up a free call.', 'Lots: project walk-throughs, my research, my writing, my background, or booking a free 30-minute consultation.']), actions: [] };

    case 'bye':
      return { intent: intent.id, text: vary('bye', ['Thanks for stopping by. Come back any time, or email me if you want to talk.', 'See you! The site is always here, and so is my inbox.', 'Take care. Come back whenever you like.']), actions: [] };

    case 'thanks':
      return { intent: intent.id, text: vary('thanks', ['Anytime. Ask about a project, a paper, or the work history whenever you want.', 'Happy to help. Anything else you want to look at?', "You're welcome! Say the word if you want to dig into something."]), actions: [] };

    case 'identity':
      return {
        intent: intent.id,
        text: vary('identity', [
          `I'm AI Pujan. I build AI/ML systems for document-heavy workflows: RAG, OCR, eval engineering and human-in-the-loop validation, mostly in legal. ${projects.length} projects on the site, ${shipped.length} of them shipped.`,
          `AI Pujan here. My work is AI for messy, document-heavy jobs: retrieval, OCR, evals and keeping a human in the loop, mostly in legal. There are ${projects.length} projects on the site and ${shipped.length} are shipped.`,
          `I'm the AI version of Pujan. I build RAG, OCR and evaluation systems for legal and other document-heavy work, ${shipped.length} shipped products among ${projects.length} projects here.`,
        ]),
        actions: [{ kind: 'projects', slugs: (shipped.length ? shipped : projects).slice(0, 3).map((project) => project.slug) }, navigate('/#about', 'More about me')],
      };

    case 'contact':
      return {
        intent: intent.id,
        text: booking
          ? vary('contact-book', ['Email me at pujan3645@gmail.com, or pick a time for a free 30-minute consultation.', 'The quickest ways: email pujan3645@gmail.com, or book a free 30-minute call.', 'Write to pujan3645@gmail.com, or grab a free 30-minute slot below.'])
          : vary('contact', ['Email is fastest: pujan3645@gmail.com. I also take free 30-minute consultations.', 'Best is email: pujan3645@gmail.com. I also do free 30-minute consultations.']),
        actions: [...book, navigate('/contact', 'Contact page')],
      };

    case 'tour': {
      if (voice) {
        // Passage by passage: one spoken passage per section, and the page scrolls to each as it is spoken.
        const passages: Array<[string, string]> = [
          ['/#about', vary('tour-about', ['Let me walk you through it, starting with who I am.', "Okay, let's start at the beginning, with who I am.", 'First, a little about me.'])],
          ['/#work', vary('tour-work', ['Next is my work. The big tiles are shipped products, then systems, research and experiments.', 'Now the work. The big tiles are the shipped products, and below them come systems, research and experiments.'])],
          ['/#experience', vary('tour-experience', ['And here is my experience, role by role.', 'Then my experience, one role at a time.'])],
        ];
        const closing = vary('tour-close', ["Ask me about any of it and I'll go deeper.", 'Tell me what caught your eye and I will go deeper.']);
        let text = '';
        const steps: Array<{ path: string; at: number }> = [];
        for (const [path, passage] of passages) {
          steps.push({ path, at: text.length });
          text += `${text ? ' ' : ''}${passage}`;
        }
        return { intent: intent.id, text: `${text} ${closing}`, actions: [], steps };
      }
      return {
        intent: intent.id,
        text: vary('tour', ['Short version: the work first, then research and writing. Ask about any of them and I will go deeper.', 'Start with the work, then the research and the writing. Ask about anything on the way.', "Here's the order I'd take: the work, then the research, then the writing. Ask me to go deeper anywhere."]),
        actions: [navigate('/#work', 'Start with the work')],
      };
    }

    case 'blog': {
      const newest = latestBlog(blogs);
      return {
        intent: intent.id,
        text: newest
          ? vary('blog', [`${blogs.length} posts, most recently "${newest.title}". The writing is where my day-to-day thinking lives.`, `I've written ${blogs.length} posts. The newest is "${newest.title}". It's where I think out loud about the work.`, `The blog has ${blogs.length} posts so far, the latest being "${newest.title}".`])
          : 'The blog is where my day-to-day thinking lives.',
        actions: [navigate('/blogs', 'Open the blog')],
      };
    }

    case 'research': {
      const newest = latestPaper(papers);
      return {
        intent: intent.id,
        text: newest
          ? vary('research', [`${papers.length} working papers. The newest is "${newest.title}" (${newest.status}). Most are awaiting my approval, so cite them as drafts.`, `There are ${papers.length} working papers, the latest "${newest.title}" (${newest.status}). Treat them as drafts: most still await my approval.`, `My research is ${papers.length} working papers. Newest: "${newest.title}" (${newest.status}). They are drafts until I approve them.`])
          : 'The research section holds my working papers.',
        actions: [navigate('/research', 'Open research')],
      };
    }

    case 'experience': {
      // One role, not the whole CV: the page has the rest, and the visitor asked a
      // question rather than for a document.
      const recent = experiences[0];
      return {
        intent: intent.id,
        text: recent
          ? vary('experience', [`Most recently I was ${recent.role} at ${recent.company} (${recent.period.split('·')[0].trim()}). The full history, with what I shipped at each, is on the page.`, `My latest role was ${recent.role} at ${recent.company} (${recent.period.split('·')[0].trim()}). The page lists every role and what I shipped.`, `I was ${recent.role} at ${recent.company} most recently (${recent.period.split('·')[0].trim()}). The rest of the history is on the page.`])
          : 'The work history is on the page.',
        actions: [navigate('/#experience', 'Work history')],
      };
    }

    case 'projects':
      return {
        intent: intent.id,
        text: vary('projects', [`${projects.length} projects, from shipped products like ${list(named)} to research systems and experiments. Each has its own page.`, `There are ${projects.length} projects here, shipped products such as ${list(named)} plus research systems and experiments.`, `The work runs from shipped products like ${list(named)} to experiments: ${projects.length} projects, each with its own page.`]),
        actions: [{ kind: 'projects', slugs: (shipped.length ? shipped : projects).slice(0, 4).map((project) => project.slug) }, navigate('/#work', 'All projects')],
      };

    case 'book':
      return {
        intent: intent.id,
        text: vary('book', ['I offer free 30-minute consultations in AI engineering, product design, marketing and full-stack development. Pick a time, and say what it is about.', 'Happy to talk. A free 30-minute consultation covers AI engineering, product design, marketing or full-stack development. Choose a slot and tell me the topic.', 'You can book a free half hour with me on AI engineering, product design, marketing or full-stack work. Pick a time that suits you.']),
        actions: [...(booking ? [{ kind: 'book' as const, url: booking }] : [{ kind: 'link' as const, label: 'Email me', url: email }]), navigate('/contact', 'Contact page')],
      };

    default:
      return { intent: intent.id, text: '', actions: [] };
  }
}

/**
 * The instant answer for this question, or null when it needs the model.
 * `firstTurn` lowers the bar, because a first message carries no context to lose.
 */
export async function cachedAnswer(question: string, firstTurn: boolean, voice = false): Promise<CachedAnswer | null> {
  // The Contact page's "Ask the AI right now" sends "How can you help with <area>?": one fixed answer per area.
  const service = serviceAnswer(question, await loadProjects());
  if (service) return service;
  // "Tell me about Cortex": the Ask button on every project page, and the most common project question. Answered
  // from the project's own record, so it never waits on a model.
  const projectAnswer = projectAbout(question, await loadProjects());
  if (projectAnswer) return projectAnswer;
  const intent = smallTalkIntent(question) ?? bestIntent(question, firstTurn ? 0.5 : 0.8);
  if (!intent) return null;
  // Mid-conversation, "hello??" means "are you there", not a new visitor: the canned
  // introduction would drop the thread.
  if (!firstTurn && intent.id === 'greeting') return null;
  const [projects, papers, blogs, experience] = await Promise.all([loadProjects(), loadPapers(), loadBlogs(), loadExperience()]);
  const answer = compose(intent, {
    projects,
    papers,
    blogs,
    experiences: experience.experiences,
    booking: process.env.COPILOT_BOOKING_URL?.trim(),
    voice,
    firstTurn,
  });
  return answer.text ? answer : null;
}

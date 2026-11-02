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
import { loadBlogs, loadExperience, loadPapers, loadProjects, SOCIAL_LINKS, type BlogSummary, type Paper, type Project } from './knowledge.js';

export type CachedAction =
  | { kind: 'navigate'; path: string; label: string }
  | { kind: 'projects'; slugs: string[] }
  | { kind: 'link'; label: string; url: string }
  | { kind: 'book'; url: string; name?: string; email?: string; topic?: string };

export type CachedAnswer = { intent: string; text: string; actions: CachedAction[] };

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
  { id: 'identity', phrases: ['what kind of ai do you build', 'what do you do', 'who is pujan', 'tell me about pujan', 'what is this site', 'what does he work on'], keywords: [] },
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
  { intent: { id: 'realai', phrases: [], keywords: [] }, pattern: /\b(are you (a |an )?(real|human|bot|ai|robot|person)|am i (talking|speaking) to|is this (really )?pujan)\b/ },
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
function words(text: string): string[] {
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
  let byKeyword: { intent: Intent; hits: number } | null = null;
  for (const intent of INTENTS) {
    const hits = asked.filter((word) => intent.keywords.includes(word)).length;
    if (hits > (byKeyword?.hits ?? 0)) byKeyword = { intent, hits };
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

const list = (items: string[]) => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

const navigate = (path: string, label: string): CachedAction => ({ kind: 'navigate', path, label });

/** Most recent blog and paper, by date, for the pointers that name one. */
const latestBlog = (blogs: BlogSummary[]) => [...blogs].sort((a, b) => b.date.localeCompare(a.date))[0];
const latestPaper = (papers: Paper[]) => [...papers].sort((a, b) => b.submitted.localeCompare(a.submitted))[0];

function compose(
  intent: Intent,
  data: { projects: Project[]; papers: Paper[]; blogs: BlogSummary[]; experiences: Awaited<ReturnType<typeof loadExperience>>['experiences']; booking: string | undefined },
): CachedAnswer {
  const { projects, papers, blogs, experiences, booking } = data;
  const shipped = projects.filter((project) => project.category === 'shipped');
  const named = (shipped.length ? shipped : projects).slice(0, 2).map((project) => project.title);
  const email = SOCIAL_LINKS.find((link) => link.label === 'Email')?.url ?? 'mailto:pujan3645@gmail.com';
  // A navigate action moves the page the moment it arrives, so an instant answer carries
  // at most one. The rest of the journey is offered as chips the visitor chooses from.
  const book = booking
    ? [{ kind: 'book' as const, url: booking }]
    : [{ kind: 'link' as const, label: 'Email Pujan', url: email }];

  switch (intent.id) {
    case 'greeting':
      return {
        intent: intent.id,
        text: `Hey. I can take you through Pujan's work, research or writing, or point you at whatever is closest to what you are building.`,
        actions: [navigate('/#work', 'See the work')],
      };

    case 'howareyou':
      return { intent: intent.id, text: "Doing well, thanks. I'm Pujan's AI presence on this site, so I mostly think about his work. What would you like to see?", actions: [] };

    case 'realai':
      return { intent: intent.id, text: "I'm Pujan's virtual presence on this site: an AI, not Pujan live. I answer from what is published here.", actions: [] };

    case 'capabilities':
      return { intent: intent.id, text: 'I can walk you through the projects, the research papers and the writing, tell you about the work history, or help you book a free consultation.', actions: [] };

    case 'bye':
      return { intent: intent.id, text: 'Thanks for stopping by. Come back any time, or email Pujan if you want to talk.', actions: [] };

    case 'thanks':
      return { intent: intent.id, text: 'Anytime. Ask about a project, a paper, or the work history whenever you want.', actions: [] };

    case 'identity':
      return {
        intent: intent.id,
        text: `Pujan builds AI/ML systems for document-heavy workflows: RAG, OCR, eval engineering and human-in-the-loop validation, mostly in legal. ${projects.length} projects on the site, ${shipped.length} of them shipped.`,
        actions: [{ kind: 'projects', slugs: (shipped.length ? shipped : projects).slice(0, 3).map((project) => project.slug) }, navigate('/#about', 'More about him')],
      };

    case 'contact':
      return {
        intent: intent.id,
        text: booking
          ? `Email is pujan3645@gmail.com, or pick a time for a free 30-minute consultation.`
          : `Email is fastest: pujan3645@gmail.com. He also takes free 30-minute consultations.`,
        actions: [...book, navigate('/contact', 'Contact page')],
      };

    case 'tour':
      return {
        intent: intent.id,
        text: `Short version: the work first, then research and writing. Ask about any of them and I will go deeper.`,
        actions: [navigate('/#work', 'Start with the work')],
      };

    case 'blog': {
      const newest = latestBlog(blogs);
      return {
        intent: intent.id,
        text: newest ? `${blogs.length} posts, most recently "${newest.title}". The writing is where the day-to-day thinking lives.` : 'The blog is where the day-to-day thinking lives.',
        actions: [navigate('/blogs', 'Open the blog')],
      };
    }

    case 'research': {
      const newest = latestPaper(papers);
      return {
        intent: intent.id,
        text: newest
          ? `${papers.length} working papers. The newest is "${newest.title}" (${newest.status}). Most are awaiting his approval, so cite them as drafts.`
          : 'The research section holds his working papers.',
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
          ? `Most recently ${recent.role} at ${recent.company} (${recent.period.split('·')[0].trim()}). The full history, with what he shipped at each, is on the page.`
          : 'The work history is on the page.',
        actions: [navigate('/#experience', 'Work history')],
      };
    }

    case 'projects':
      return {
        intent: intent.id,
        text: `${projects.length} projects, from shipped products like ${list(named)} to research systems and experiments. Each has its own page.`,
        actions: [{ kind: 'projects', slugs: (shipped.length ? shipped : projects).slice(0, 4).map((project) => project.slug) }, navigate('/#work', 'All projects')],
      };

    case 'book':
      return {
        intent: intent.id,
        text: `He offers free 30-minute consultations in AI engineering, product design, marketing and full-stack development. Pick a time, and say what it is about.`,
        actions: booking ? [{ kind: 'book', url: booking }] : [{ kind: 'link', label: 'Email Pujan', url: email }],
      };

    default:
      return { intent: intent.id, text: '', actions: [] };
  }
}

/**
 * The instant answer for this question, or null when it needs the model.
 * `firstTurn` lowers the bar, because a first message carries no context to lose.
 */
export async function cachedAnswer(question: string, firstTurn: boolean): Promise<CachedAnswer | null> {
  const intent = smallTalkIntent(question) ?? bestIntent(question, firstTurn ? 0.5 : 0.8);
  if (!intent) return null;
  const [projects, papers, blogs, experience] = await Promise.all([loadProjects(), loadPapers(), loadBlogs(), loadExperience()]);
  const answer = compose(intent, {
    projects,
    papers,
    blogs,
    experiences: experience.experiences,
    booking: process.env.COPILOT_BOOKING_URL?.trim(),
  });
  return answer.text ? answer : null;
}

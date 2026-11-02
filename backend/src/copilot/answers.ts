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
 * A cached answer never claims anything the brief would not: the wording is fixed and
 * facts are read from the site at request time. Navigation is offered for confirmation.
 *
 * Deliberately conservative about when it fires: the first turn of a conversation, or a
 * near-exact match later. A follow-up ("open", "summarise that") depends on the
 * conversation, so it goes to the model.
 */
import { loadBlogs, loadExperience, loadPapers, loadProjects, type BlogSummary, type Paper, type Project } from './knowledge.js';

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
  // A navigation action is a proposal; the browser waits for visitor confirmation.

  switch (intent.id) {
    case 'greeting':
      return {
        intent: intent.id,
        text: `Hey, I’m Pujan’s virtual presence on Design Bakery. I can walk you through my work, research, or writing. What are you curious about?`,
        actions: [],
      };

    case 'thanks':
      return { intent: intent.id, text: 'Anytime. Ask about a project, a paper, or the work history whenever you want.', actions: [] };

    case 'identity':
      return {
        intent: intent.id,
        text: `I build AI/ML systems for document-heavy workflows: RAG, OCR, evaluation, and human review, mostly in legal. I’ve shared ${projects.length} projects here; ${shipped.length} have shipped. Want me to show you my work?`,
        actions: [{ kind: 'projects', slugs: (shipped.length ? shipped : projects).slice(0, 3).map((project) => project.slug) }, navigate('/#work', 'Selected work')],
      };

    case 'contact':
      return {
        intent: intent.id,
        text: booking
          ? `You can email me at pujan3645@gmail.com or book a free 30-minute consultation. Want me to open Contact?`
          : `Email me at pujan3645@gmail.com. I also offer free 30-minute consultations. Want me to open Contact?`,
        actions: [navigate('/contact', 'Contact')],
      };

    case 'tour':
      return {
        intent: intent.id,
        text: `Let’s start with my selected work, then we can explore research or writing. Want me to open the work section?`,
        actions: [navigate('/#work', 'Selected work')],
      };

    case 'blog': {
      const newest = latestBlog(blogs);
      return {
        intent: intent.id,
        text: newest ? `I’ve published ${blogs.length} posts. The latest is “${newest.title}.” Want me to open the writing page?` : 'My writing is collected on the blog. Want me to open it?',
        actions: [navigate('/blogs', 'Writing')],
      };
    }

    case 'research': {
      const newest = latestPaper(papers);
      return {
        intent: intent.id,
        text: newest
          ? `I have ${papers.length} working papers. The latest is “${newest.title}” (${newest.status}). Want me to open Research?`
          : 'My working papers are on the Research page. Want me to open it?',
        actions: [navigate('/research', 'Research')],
      };
    }

    case 'experience': {
      // One role, not the whole CV: the page has the rest, and the visitor asked a
      // question rather than for a document.
      const recent = experiences[0];
      return {
        intent: intent.id,
        text: recent
          ? `Most recently, I was ${recent.role} at ${recent.company} (${recent.period.split('·')[0].trim()}). Want me to show you my full experience?`
          : 'I’ve shared my work history on this page. Want me to open it?',
        actions: [navigate('/#experience', 'Experience')],
      };
    }

    case 'projects':
      return {
        intent: intent.id,
        text: `I’ve shared ${projects.length} projects, including shipped work like ${list(named)}. Want me to open the project list?`,
        actions: [{ kind: 'projects', slugs: (shipped.length ? shipped : projects).slice(0, 4).map((project) => project.slug) }, navigate('/#work', 'All projects')],
      };

    case 'book':
      return {
        intent: intent.id,
        text: `I offer free 30-minute consultations in AI engineering, product design, marketing, and full-stack development. Want me to open Contact so you can choose a time?`,
        actions: [navigate('/contact', 'Contact')],
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
  const intent = bestIntent(question, firstTurn ? 0.5 : 0.8);
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

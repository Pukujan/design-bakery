/**
 * The request router (TASK-DB-0130): sits in front of the model and answers common requests with a
 * pre-written routine, instantly and with no model call. Whatever no routine claims falls through to
 * the model, so the model keeps everything open-ended.
 *
 * A routine is a cheap matcher (rules on the raw sentence, no data loaded) plus a runner that reads the
 * site's content once, in parallel, and returns the reply and its actions. A runner that cannot find
 * what was asked for returns null, so a half-understood request is the model's, never a guess.
 *
 * Order: routines here (open, latest, tech, role), then the saved intents and small talk of answers.ts
 * (greeting, tour, contact, book, blog, research, experience, projects, "tell me about <project>"...), then the model.
 *
 * Safety rules every routine shares:
 * - only paths and facts from the live content (knowledge.ts); a path is built from a record that exists;
 * - short, self-contained requests only. A question that leans on the conversation ("open it", "the second
 *   one", "more") or is long or asks for reasoning goes to the model;
 * - on a call the reply's navigate action carries `go`, so the browser moves before the speech (store.ts takeMoves).
 */
import {
  cachedAnswer, lead, list, latestBlog, latestPaper, navigate, norm, vary, words,
  type CachedAnswer,
} from './answers.js';
import { loadBlogs, loadExperience, loadPapers, loadProjects, projectPath, type BlogSummary, type Paper, type Project } from './knowledge.js';

export type RoutedAnswer = CachedAnswer & { routine: string };

type Site = {
  projects: Project[];
  papers: Paper[];
  blogs: BlogSummary[];
  experiences: Awaited<ReturnType<typeof loadExperience>>['experiences'];
};
type Ask = { question: string; q: string; voice: boolean; firstTurn: boolean };
type Routine = {
  name: string;
  /** Cheap, synchronous, no I/O: does this sentence look like my kind of request? */
  test: (ask: Ask) => boolean;
  /** Reads the site and builds the reply, or null when the request names nothing the site has. */
  run: (ask: Ask, site: Site) => Omit<RoutedAnswer, 'routine'> | null;
};

/** Words that point back at the conversation: a routine never answers these. */
const DEPENDS_ON_CONTEXT = /\b(which ones?|it|that|this|those|these|them|they|there|the (first|second|third|fourth|last|previous|next|other|same) (one|post|paper|project)|the (first|second|third|fourth|last|previous|next|other|same) one|again|more|another|same|instead|also|too)\b/;
/** Asks for reasoning, comparison or opinion: the model's job. */
const NEEDS_THOUGHT = /\b(why|how come|compare|difference|versus|vs|better|worse|should|recommend|opinion|think|explain|summar(?:y|ise|ize)|pros|cons)\b/;
const MAX_WORDS = 16;

/** The sentence is a short, self-contained request. */
function selfContained(q: string): boolean {
  return q.split(' ').length <= MAX_WORDS && !DEPENDS_ON_CONTEXT.test(q) && !NEEDS_THOUGHT.test(q);
}

const GENERIC = new Set(
  'open show take bring pull find go read play post blog article paper research project study case work site page stuff thing something everything around call called titled named latest new newest recent interesting best favourite favorite wrote write written talk talks discuss discusses cover covers one want see look view check link write writeup'.split(' '),
);

function kindOf(q: string): 'blog' | 'paper' | 'project' | null {
  if (/\b(post|posts|blog|blogs|article|articles|writeup|write up)\b/.test(q)) return 'blog';
  if (/\b(paper|papers|research|study)\b/.test(q)) return 'paper';
  if (/\b(project|projects|case study|app|product)\b/.test(q)) return 'project';
  return null;
}

type Candidate = { kind: 'blog' | 'paper' | 'project'; path: string; title: string; titleWords: Set<string>; tagWords: Set<string>; bodyWords: Set<string>; blurb: string };

function candidates(site: Site, kind: ReturnType<typeof kindOf>): Candidate[] {
  const set = (text: string) => new Set(words(text));
  const out: Candidate[] = [];
  if (!kind || kind === 'project')
    for (const p of site.projects)
      out.push({ kind: 'project', path: projectPath(p), title: p.title, titleWords: set(`${p.title} ${p.slug.replace(/-/g, ' ')}`), tagWords: set(p.tech.join(' ')), bodyWords: set(`${p.tagline} ${p.description}`), blurb: p.tagline });
  if (!kind || kind === 'blog')
    for (const b of site.blogs)
      out.push({ kind: 'blog', path: `/blogs/${b.id}`, title: b.title, titleWords: set(b.title), tagWords: set(b.tags.join(' ')), bodyWords: set(b.excerpt), blurb: lead(b.excerpt, 140) });
  if (!kind || kind === 'paper')
    for (const p of site.papers)
      out.push({ kind: 'paper', path: `/research/papers/${p.id}`, title: p.title, titleWords: set(p.title), tagWords: new Set(), bodyWords: set(p.abstract), blurb: p.status === 'approved' ? '' : 'A working paper, still awaiting my approval.' });
  return out;
}

/** The one item the topic clearly names, or null when nothing fits or two fit about equally. */
function resolve(topic: string[], items: Candidate[]): Candidate | null {
  if (!topic.length) return null;
  const scored = items
    .map((item) => {
      let score = 0;
      let hits = 0;
      let strong = 0;
      for (const word of topic) {
        const s = item.titleWords.has(word) ? 3 : item.tagWords.has(word) ? 2 : item.bodyWords.has(word) ? 1 : 0;
        if (s) hits += 1;
        if (s >= 2) strong += 1;
        score += s;
      }
      return { item, score, hits, strong };
    })
    .filter((entry) => entry.strong >= 1 && entry.score >= 3 && entry.hits / topic.length >= 0.6)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  if (scored[1] && scored[0].score - scored[1].score < 2) return null;
  return scored[0].item;
}

const KIND_WORD = { blog: 'post', paper: 'paper', project: 'project' } as const;

const open: Routine = {
  name: 'open',
  test: ({ q }) => /^(please )?(can you |could you |would you |i want to |i d like to |lets |let s )?(open|show( me)?|take me to|bring up|pull up|go to|find|read|i want to (see|read))\b/.test(q),
  run: ({ q }, site) => {
    const kind = kindOf(q);
    const topic = words(q).filter((word) => !GENERIC.has(word));
    if (!topic.length || topic.length > 6) return null;
    const hit = resolve(topic, candidates(site, kind));
    if (!hit) return null;
    const what = KIND_WORD[hit.kind];
    const extra = hit.blurb ? ` ${hit.blurb}` : '';
    return {
      intent: hit.kind === 'blog' ? 'blog' : hit.kind === 'paper' ? 'research' : 'project',
      text: vary(`open-${hit.kind}`, [
        `That would be "${hit.title}". Taking you there now.${extra}`,
        `Found it: "${hit.title}". Opening the ${what} for you.${extra}`,
        `On it. "${hit.title}" coming up.${extra}`,
      ]),
      actions: [navigate(hit.path, `Open ${hit.title}`)],
      go: true,
    };
  },
};

const latest: Routine = {
  name: 'latest',
  test: ({ q }) => /\b(latest|newest|most recent|last|recent|new)\b/.test(q) && /\b(post|blog|article|paper|research|writing|publication)\b/.test(q) && !/\b(projects?)\b/.test(q),
  run: ({ q }, site) => {
    const wantsPaper = kindOf(q) === 'paper';
    const hit = wantsPaper ? latestPaper(site.papers) : latestBlog(site.blogs);
    if (!hit) return null;
    const path = wantsPaper ? `/research/papers/${(hit as Paper).id}` : `/blogs/${(hit as BlogSummary).id}`;
    const note = wantsPaper && (hit as Paper).status !== 'approved' ? ' It is a working paper, still awaiting my approval.' : '';
    const body = wantsPaper ? lead((hit as Paper).abstract, 150) : lead((hit as BlogSummary).excerpt, 150);
    return {
      intent: wantsPaper ? 'research' : 'blog',
      text: vary(`latest-${wantsPaper ? 'paper' : 'post'}`, [
        `My newest ${wantsPaper ? 'paper' : 'post'} is "${hit.title}". ${body}${note} Taking you there.`,
        `The latest is "${hit.title}". ${body}${note} Opening it now.`,
        `Freshest one: "${hit.title}". ${body}${note} Here you go.`,
      ]),
      actions: [navigate(path, `Open ${hit.title}`)],
      go: true,
    };
  },
};

const TECH_GENERIC = new Set(['ai', 'ml', 'api', 'web', 'app']);

const tech: Routine = {
  name: 'tech',
  test: ({ q }) => /\b(which|what|any|list|show|have you)\b/.test(q) && /\b(projects?|built|used|use|uses|using|worked with|made with|anything)\b/.test(q) && /\b(with|using|used|use|uses|in|on|worked)\b/.test(q),
  run: ({ q }, site) => {
    // The longest technology named in the sentence wins, so "react native" is not read as "react".
    const names = new Map<string, string>();
    for (const project of site.projects) for (const item of project.tech) names.set(norm(item), item);
    const found = [...names.keys()]
      .filter((name) => name.length >= 3 && !TECH_GENERIC.has(name) && new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(q))
      .sort((a, b) => b.length - a.length)[0];
    if (!found) return null;
    const matched = site.projects.filter((project) => project.tech.some((item) => norm(item) === found));
    if (!matched.length) return null;
    const display = names.get(found) ?? found;
    const titles = matched.map((project) => project.title);
    const shown = matched.slice(0, 4);
    const summary = matched.length > 4 ? `${list(shown.map((p) => p.title))} and ${matched.length - 4} more` : list(titles);
    return {
      intent: 'projects',
      text: vary('tech', [
        `${matched.length === 1 ? 'One project uses' : `${matched.length} of my projects use`} ${display}: ${summary}.`,
        `${display} shows up in ${matched.length === 1 ? 'one project' : `${matched.length} projects`}: ${summary}.`,
        `Yes, I have used ${display}. ${matched.length === 1 ? 'The project is' : 'The projects are'} ${summary}.`,
      ]),
      actions: [{ kind: 'projects', slugs: shown.map((project) => project.slug) }],
    };
  },
};

const COMPANY_SUFFIX = /\b(inc|llc|ltd|corp|co|company|gmbh)\b/g;

const role: Routine = {
  name: 'role',
  test: ({ q }) => /\b(what did you do|what do you do|what were you doing|what was your role|what was your job|what did you work on|what did you build|tell me about your (time|role|work|job|experience))\b/.test(q) && /\b(at|with|for)\b/.test(q),
  run: ({ q }, site) => {
    const matches = site.experiences.filter((job) => {
      const name = norm(job.company).replace(COMPANY_SUFFIX, '').replace(/\s+/g, ' ').trim();
      return name.length >= 3 && new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(q);
    });
    const job = matches[0];
    if (!job) return null;
    const summary = lead(job.expandedSummary ?? job.collapsedSummary ?? '', 230);
    const when = job.period.split('·')[0].trim();
    const more = matches.length > 1 ? ` I had ${matches.length} roles there; this is the latest.` : '';
    return {
      intent: 'experience',
      text: vary('role', [
        `At ${job.company} I was ${job.role} (${when}). ${summary}${more}`,
        `${job.company}: ${job.role}, ${when}. ${summary}${more}`,
        `I was ${job.role} at ${job.company} (${when}). ${summary}${more}`,
      ]).trim(),
      actions: [navigate('/#experience', 'Work history')],
    };
  },
};

/** The registry, in the order they are tried. New routines are added here. */
export const ROUTINES: readonly Routine[] = [latest, tech, role, open];

/**
 * The routine's answer for this question, or null when it belongs to the model. `routine` names which one ran: the
 * routines above, or `intent:<id>` for the saved intents in answers.ts. It is what the trace labels the turn with.
 */
export async function routeRequest(question: string, firstTurn: boolean, voice = false): Promise<RoutedAnswer | null> {
  const ask: Ask = { question, q: norm(question), voice, firstTurn };
  if (ask.q && selfContained(ask.q)) {
    const due = ROUTINES.filter((routine) => routine.test(ask));
    if (due.length) {
      // One parallel read of everything a routine may need; the loaders cache, so this is cheap after the first turn.
      const [projects, papers, blogs, experience] = await Promise.all([loadProjects(), loadPapers(), loadBlogs(), loadExperience()]);
      const site: Site = { projects, papers, blogs, experiences: experience.experiences };
      for (const routine of due) {
        const answer = routine.run(ask, site);
        if (answer?.text) return { ...answer, routine: routine.name };
      }
    }
  }
  const saved = await cachedAnswer(question, firstTurn, voice);
  return saved ? { ...saved, routine: `intent:${saved.intent}` } : null;
}

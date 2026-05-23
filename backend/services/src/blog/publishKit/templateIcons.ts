import { parseAgentJson } from '../agentJson.js';
import { callOpenRouter } from '../../openrouter.js';
import { leadParagraphs } from './textUtils.js';
import {
  TECH_ICONS,
  type TechIconId,
} from './techStickers.js';

export const ALL_TECH_ICON_IDS: TechIconId[] = TECH_ICONS.map((i) => i.id);

const ICON_HINTS: Record<TechIconId, string> = {
  code: 'programming, source code, developer',
  terminal: 'CLI, shell, DevOps, scripts',
  cpu: 'performance, hardware, compute, ML inference',
  database: 'Postgres, SQL, data storage, Supabase',
  cloud: 'cloud deploy, AWS, Vercel, Railway, SaaS',
  'git-branch': 'Git, GitHub, version control, branching',
  brackets: 'API, JSON, full-stack, integration',
  workflow: 'pipelines, automation, architecture flow',
  bot: 'AI agents, LLMs, chatbots, automation',
  sparkles: 'AI magic, generative tools, creative tech',
  layers: 'system design, stack layers, architecture',
  server: 'backend, API server, infrastructure',
};

const ICONS_SYSTEM = `You pick colorful flat sticker icons for a technical blog cover template.
Return ONLY valid JSON (no markdown): { "iconIds": string[], "rationale": string }

Rules:
- iconIds: array of 4 to 6 distinct ids from this exact list:
  code, terminal, cpu, database, cloud, git-branch, brackets, workflow, bot, sparkles, layers, server
- Pick icons that match the post topic, tags, category, and SEO/meta — not random.
- Prefer icons implied by the title and tags first, then excerpt/meta.
- rationale: one short sentence explaining the icon choices.`;

type HeuristicRule = { pattern: RegExp; icons: TechIconId[] };

const HEURISTIC_RULES: HeuristicRule[] = [
  { pattern: /\b(ai|ml|llm|agent|gpt|openrouter|cursor|gemini|model|neural)\b/i, icons: ['bot', 'sparkles', 'cpu'] },
  { pattern: /\b(supabase|postgres|sql|database|firestore|redis|data)\b/i, icons: ['database', 'server', 'layers'] },
  { pattern: /\b(cloud|aws|vercel|railway|deploy|hosting|saas)\b/i, icons: ['cloud', 'server', 'workflow'] },
  { pattern: /\b(git|github|branch|commit|merge|pr|pull request)\b/i, icons: ['git-branch', 'code', 'workflow'] },
  { pattern: /\b(react|frontend|vite|component|css|ui|design)\b/i, icons: ['code', 'brackets', 'layers'] },
  { pattern: /\b(api|backend|express|node|server|rest)\b/i, icons: ['server', 'brackets', 'workflow'] },
  { pattern: /\b(architecture|system|diagram|mermaid|infra)\b/i, icons: ['layers', 'workflow', 'server'] },
  { pattern: /\b(terminal|cli|shell|bash|script|devops)\b/i, icons: ['terminal', 'code', 'workflow'] },
  { pattern: /\b(performance|cpu|benchmark|optimize)\b/i, icons: ['cpu', 'server', 'layers'] },
  { pattern: /\b(automation|pipeline|ci|cd|workflow)\b/i, icons: ['workflow', 'git-branch', 'terminal'] },
];

function isTechIconId(id: string): id is TechIconId {
  return ALL_TECH_ICON_IDS.includes(id as TechIconId);
}

export function parseTechIconIds(raw: string[] | undefined): TechIconId[] {
  if (!raw?.length) return [];
  return dedupeIcons(raw.filter((id): id is TechIconId => typeof id === 'string' && isTechIconId(id)));
}

function dedupeIcons(ids: TechIconId[]): TechIconId[] {
  const seen = new Set<TechIconId>();
  const out: TechIconId[] = [];
  for (const id of ids) {
    if (!isTechIconId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function corpusText(params: {
  title: string;
  excerpt: string;
  categoryLabel: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
}): string {
  const lead = params.content ? leadParagraphs(params.content, 2, 800) : '';
  return [
    params.title,
    params.metaTitle,
    params.excerpt,
    params.metaDescription,
    params.categoryLabel,
    params.tags.join(' '),
    lead,
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
}

/** Keyword fallback when the agent is unavailable. */
export function heuristicTemplateIconPool(params: {
  title: string;
  excerpt: string;
  categoryLabel: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
  designSeed: number;
}): TechIconId[] {
  const text = corpusText(params);
  const scored = new Map<TechIconId, number>();

  for (const rule of HEURISTIC_RULES) {
    if (rule.pattern.test(text)) {
      for (const icon of rule.icons) {
        scored.set(icon, (scored.get(icon) ?? 0) + 2);
      }
    }
  }

  for (const tag of params.tags) {
    for (const rule of HEURISTIC_RULES) {
      if (rule.pattern.test(tag)) {
        for (const icon of rule.icons) {
          scored.set(icon, (scored.get(icon) ?? 0) + 3);
        }
      }
    }
  }

  const cat = params.categoryLabel.toLowerCase();
  if (/ai|ml/.test(cat)) ['bot', 'sparkles', 'cpu'].forEach((i) => scored.set(i as TechIconId, (scored.get(i as TechIconId) ?? 0) + 2));
  if (/engineer|system|architect/.test(cat)) ['layers', 'workflow', 'server'].forEach((i) => scored.set(i as TechIconId, (scored.get(i as TechIconId) ?? 0) + 2));
  if (/design|product/.test(cat)) ['layers', 'sparkles', 'code'].forEach((i) => scored.set(i as TechIconId, (scored.get(i as TechIconId) ?? 0) + 2));

  const ranked = [...scored.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const pool = dedupeIcons(ranked);

  if (pool.length >= 4) return pool.slice(0, 6);

  let s = params.designSeed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    return s / 4294967296;
  };
  const fill = [...pool];
  while (fill.length < 4) {
    const id = ALL_TECH_ICON_IDS[Math.floor(rand() * ALL_TECH_ICON_IDS.length)]!;
    if (!fill.includes(id)) fill.push(id);
  }
  return fill.slice(0, 6);
}

function validatePool(raw: unknown, designSeed: number): TechIconId[] | null {
  if (!Array.isArray(raw)) return null;
  const ids = dedupeIcons(
    raw.filter((x): x is TechIconId => typeof x === 'string' && isTechIconId(x)),
  );
  if (ids.length < 2) return null;
  while (ids.length < 4) {
    const extra = heuristicTemplateIconPool({
      title: '',
      excerpt: '',
      categoryLabel: '',
      tags: [],
      designSeed: designSeed + ids.length,
    }).find((i) => !ids.includes(i));
    if (extra) ids.push(extra);
    else break;
  }
  return ids.slice(0, 6);
}

export async function generateTemplateIconPool(params: {
  apiKey: string;
  model: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
  designSeed: number;
}): Promise<{ iconIds: TechIconId[]; rationale?: string }> {
  const catalog = ALL_TECH_ICON_IDS.map((id) => `- ${id}: ${ICON_HINTS[id]}`).join('\n');

  const user = [
    'Allowed icons:',
    catalog,
    '',
    `Title: ${params.title}`,
    params.metaTitle ? `Meta title: ${params.metaTitle}` : '',
    `Excerpt: ${params.excerpt}`,
    params.metaDescription ? `Meta description: ${params.metaDescription}` : '',
    `Category: ${params.categoryLabel}`,
    params.tags.length ? `Tags: ${params.tags.join(', ')}` : '',
    params.content ? `Opening:\n${leadParagraphs(params.content, 2, 900)}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const result = await callOpenRouter({
    apiKey: params.apiKey,
    model: params.model,
    system: ICONS_SYSTEM,
    user,
  });

  const parsed = parseAgentJson<{ iconIds?: unknown; rationale?: string }>(result.content);
  const iconIds = validatePool(parsed.iconIds, params.designSeed);
  if (!iconIds) {
    throw new Error('Template icon agent returned invalid iconIds');
  }

  return {
    iconIds,
    rationale: typeof parsed.rationale === 'string' ? parsed.rationale.trim() : undefined,
  };
}

export async function resolveTemplateIconPool(params: {
  apiKey: string;
  model: string;
  title: string;
  excerpt: string;
  categoryLabel: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
  designSeed: number;
  /** When set (shuffle), skip LLM and reuse this pool. */
  cachedPool?: TechIconId[];
}): Promise<{ iconIds: TechIconId[]; rationale?: string; source: 'agent' | 'heuristic' | 'cached' }> {
  const cached = params.cachedPool ? dedupeIcons(params.cachedPool) : [];
  if (cached.length >= 2) {
    return { iconIds: cached.slice(0, 6), source: 'cached' };
  }

  try {
    const agent = await generateTemplateIconPool(params);
    return { ...agent, source: 'agent' };
  } catch (err) {
    console.warn('[publishKit] Template icon agent failed, using heuristic pool:', err);
    return {
      iconIds: heuristicTemplateIconPool(params),
      source: 'heuristic',
    };
  }
}

/** Pick `count` icons from pool using designSeed (shuffle varies subset). */
export function pickIconsFromPool(pool: TechIconId[], designSeed: number, count: number): TechIconId[] {
  const unique = dedupeIcons(pool);
  if (unique.length === 0) return ['code', 'layers', 'sparkles', 'terminal'];

  let s = (designSeed ^ 0x85ebca6b) >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const shuffled = [...unique];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }

  const want = Math.min(Math.max(2, count), shuffled.length);
  return shuffled.slice(0, want);
}

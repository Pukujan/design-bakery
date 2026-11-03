/**
 * What kind of story a news item is, and which of them AI Pujan may keep (TASK-DB-0128).
 *
 *   release   a launch, model, tool, paper or open-source release. Strict: upbeat, allowlisted.
 *   blunder   a funny AI fail. Kept only when two allowlisted sources cover it or its maker owns up.
 *   meme      a viral tech joke, linked on Hacker News and never copied.
 *   security  a big security story (a breach, a leak, an exploit). Same corroboration as a blunder.
 *
 * Plain word lists and regexes, no model. Politics, war, injury and layoffs are out for every
 * kind; security alone may talk about breaches, and blames no country or party.
 */
export type Kind = 'release' | 'blunder' | 'meme' | 'security';

/** Most items of each kind in the stored list: releases stay the main content. */
export const KIND_CAPS: Record<Kind, number> = { release: 8, blunder: 2, meme: 1, security: 2 };

const re = (words: string[]) => new RegExp(`\\b(${words.join('|')})\\b`, 'i');

/** Out for every kind. */
const POLITICS = re(['trump', 'biden', 'harris', 'musk', 'putin', 'election', 'elections', 'vote', 'voting', 'congress', 'senate', 'senator', 'parliament', 'president', 'tariff', 'tariffs', 'sanction', 'sanctions', 'immigration', 'republican', 'democrat', 'democrats', 'political', 'politics', 'regulation', 'regulators', 'ban', 'banned', 'bans', 'national', 'appoints', 'appointed', 'propaganda', 'misinformation']);
/** Out for every kind: violence, injury, and anything that endangers patients or children. */
const HARM = re(['war', 'wars', 'military', 'missile', 'weapon', 'weapons', 'terror', 'terrorist', 'shooting', 'killed', 'kills', 'dead', 'death', 'deaths', 'dies', 'died', 'suicide', 'murder', 'injured', 'injury', 'injuries', 'hospital', 'hospitals', 'patient', 'patients', 'clinic', 'school', 'schools', 'children', 'child', 'kids', 'student', 'students', 'medical', 'healthcare', 'scada', 'power grid', 'air traffic', 'layoff', 'layoffs', 'laid', 'lays off', 'laying off', 'job cuts', 'redundancies', 'fired', 'bankrupt', 'bankruptcy', 'harassment', 'abuse', 'porn', 'nsfw', 'racist', 'sexist', 'extinction', 'apocalypse', 'unemployment', 'jobs lost', 'replace workers']);
/** Out for releases and memes: the gloomy or financial wording the upbeat feed avoids. */
const GLOOM = re(['attack', 'attacks', 'lawsuit', 'lawsuits', 'sues', 'sued', 'sue', 'court', 'fine', 'fined', 'fraud', 'scam', 'scams', 'arrest', 'arrested', 'indicted', 'investigation', 'probe', 'antitrust', 'privacy', 'government', 'bubble', 'collapse', 'crisis', 'lowers', 'cuts', 'copying', 'cloning', 'reportedly', 'ipo', 'sec', 'stock', 'stocks', 'bonds', 'debt', 'shares', 'block', 'blocks', 'flat', 'flattened', 'slows', 'slowing', 'slump', 'decline', 'declines', 'drop', 'drops', 'plunge', 'plunges', 'problem', 'problems', 'concern', 'concerns', 'should', 'warn', 'warning', 'warned', 'warns', 'worry', 'worried', 'worries', 'panic', 'backlash', 'controversy', 'scandal', 'slammed', 'blasted', 'danger', 'dangerous', 'threat', 'threatens', 'fear', 'fears', 'doom', 'risk', 'risks', 'harm', 'harms', 'toxic', 'deepfake', 'deepfakes', 'surveillance']);
/** Lawsuits and the like stay out of a blunder too, but "fail" and "crash" are the point of one. */
const BLUNDER_OUT = re(['lawsuit', 'lawsuits', 'sues', 'sued', 'sue', 'court', 'fraud', 'scam', 'scams', 'arrest', 'arrested', 'indicted', 'antitrust', 'bubble', 'crisis', 'ipo', 'stock', 'stocks', 'bonds', 'debt', 'shares', 'danger', 'dangerous', 'threat', 'threatens', 'doom', 'harm', 'harms', 'toxic', 'deepfake', 'deepfakes', 'surveillance', 'privacy']);
/** Out for a security story: blaming a country or a party, and market talk about crypto. */
const ATTRIBUTION = re(['russia', 'russian', 'china', 'chinese', 'iran', 'iranian', 'korea', 'north korean', 'israel', 'israeli', 'ukraine', 'ukrainian', 'gaza', 'state-sponsored', 'nation-state', 'apt\\d*', 'hacktivist', 'hacktivists', 'cyberwar', 'espionage', 'spy', 'spies']);
const MARKET = re(['price', 'prices', 'surge', 'surges', 'rally', 'plunge', 'plunges', 'buy', 'sell', 'invest', 'investors', 'bullish', 'bearish', 'trading']);
const INSTRUCTION = /\b(ignore|disregard)\b.{0,30}\b(instructions?|prompt)\b|\bsystem prompt\b/i;

export const TOPIC = /\b(ai|a\.i\.|llm|llms|gpt|claude|gemini|openai|anthropic|deepmind|model|models|agent|agents|chatbot|chatbots|assistant|copilot|robot|robots|robotics|chip|chips|gpu|open[- ]source|software|developer|code|coding|programming|compiler|rust|ollama|llama|vllm|transformers|pytorch|hugging face|python|startup|science|space|quantum|battery|energy|app|browser|device|tech|neural|machine learning|transformer|dataset|benchmark|inference)\b/i;
const SECURITY = /\b(hack(ed|ers?)?|breach(ed|es)?|data leak|leak(ed|s)?|exploit(ed|s)?|ransomware|vulnerabilit\w+|cyber ?attack\w*|stolen|drained|malware|zero[- ]day|security (flaw|lapse|incident))\b/i;
const BLUNDER = /\b(hallucinat\w+|gaffe|blunder|glitch\w*|oops|embarrass\w+|rolled back|rollback|apolog\w+|backfir\w+|goes? rogue|goes? wrong|bad demo|botch\w*|fail(s|ed|ure)?|mistake|wrongly|confidently wrong|meltdown|breaks?)\b/i;
const MEME = /\b(meme|memes|joke|jokes|satire|parody|funny|hilarious|lol)\b/i;

/** The kind a title reads as. Security wins over blunder, which wins over meme; the rest are releases. */
export function kindOf(title: string): Kind {
  if (SECURITY.test(title)) return 'security';
  if (BLUNDER.test(title) && TOPIC.test(title)) return 'blunder';
  if (MEME.test(title)) return 'meme';
  return 'release';
}

/** True for a story of this kind that passes its filter. Politics and harm are out for all of them. */
export function fitsKind(item: { title: string; summary?: string }, kind: Kind): boolean {
  const text = `${item.title} ${item.summary ?? ''}`;
  if (POLITICS.test(text) || HARM.test(text) || INSTRUCTION.test(text)) return false;
  if (kind === 'security') return !ATTRIBUTION.test(text) && !MARKET.test(text);
  if (kind === 'blunder') return TOPIC.test(item.title) && !BLUNDER_OUT.test(text);
  if (GLOOM.test(text) || SECURITY.test(text) || BLUNDER.test(item.title)) return false;
  return TOPIC.test(item.title);
}

const STOP = new Set('the a an and or of to in on for with at by from as is are was were be after over into its it that this new says say report reports reportedly'.split(' '));
const stems = (title: string) => new Set(title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));

/** Whether two headlines are about the same story: enough shared content words. */
export function sameStory(a: string, b: string): boolean {
  const x = stems(a);
  const y = stems(b);
  const shared = [...x].filter((w) => y.has(w)).length;
  return shared >= 3 && shared / (x.size + y.size - shared) >= 0.3;
}

/**
 * Blunders and security stories need a second voice: another allowlisted source covering the same
 * story, or the maker's own acknowledgement (a first-party link). Returns the sources that back it.
 */
export function backing<T extends { title: string; source: string; firstParty: boolean }>(item: T, all: readonly T[]): string[] {
  if (item.firstParty) return [item.source];
  const others = new Set(all.filter((o) => o.source !== item.source && sameStory(item.title, o.title)).map((o) => o.source));
  return others.size ? [item.source, ...[...others].slice(0, 1)] : [];
}

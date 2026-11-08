/**
 * Names the visitor probably meant (TASK-DB-0142). Speech recognition writes "President" for Precedent and "Arise"
 * for Arize, and search then finds nothing. Before the search, each word of the message is compared with the site's
 * known names (project titles, the tools in their Built with lists, companies, and coined words in paper titles) by
 * sound (Double Metaphone) and spelling (edit distance). A confident match is added to the search query and told to
 * the model as a likelihood; the visitor's words are never rewritten.
 */
import { doubleMetaphone } from 'double-metaphone';
import { loadPapers, loadProjects, loadShownExperience } from './knowledge.js';
import { isLower, isUpper, isWordChar, keepOnly, squash } from './words.js';

export type KnownName = { token: string; word: string; name: string };
export type SoundAlike = { heard: string; name: string; word: string };

/** Words in tool names that are ordinary English, not names: "Arize Evals" is known by "Arize", not "Evals". */
const GENERIC = new Set(
  'agents agent api apis animations citation data evals eval filling form forms graph graphs legal models model open pipeline pipelines search systems tools voice workflow workflows design testing tests react next'.split(' '),
);

const letters = (word: string) => keepOnly(word.toLowerCase().normalize('NFKD'), (c) => c >= 'a' && c <= 'z');
/** Characters that separate the words of a name ("Arize Evals", "Next.js / React", "Ekagajpatra (2025)"). */
const NAME_BREAK = ' /,.()·:–—-';
const nameWords = (name: string) => Array.from(squash(name), (c) => (NAME_BREAK.includes(c) ? ' ' : c)).join('').split(' ').filter(Boolean);
/** A coined word in a paper title: capitalised with a capital inside (JudgeBench), or four capitals or more (CALM). */
function coined(word: string): boolean {
  const chars = Array.from(word);
  const camel = chars.length > 2 && isUpper(chars[0]) && isLower(chars[1]) && chars.slice(2).some(isUpper);
  const acronym = chars.length >= 4 && chars.every((c) => c >= 'A' && c <= 'Z');
  return camel || acronym;
}

/** The known names, as tokens of four letters or more (matching uses five or more). */
export async function knownNames(): Promise<KnownName[]> {
  const [projects, papers, experience] = await Promise.all([loadProjects(), loadPapers(), loadShownExperience()]);
  const out: KnownName[] = [];
  const add = (name: string, generic: boolean) => {
    for (const word of nameWords(name)) {
      const token = letters(word);
      if (token.length >= 4 && !(generic && GENERIC.has(token))) out.push({ token, word: keepOnly(word, isWordChar), name });
    }
  };
  for (const p of projects) {
    add(p.title, false);
    for (const tech of p.tech ?? []) add(tech, true);
  }
  for (const job of experience.experiences) add(job.company, true);
  // A paper title is mostly ordinary words; only its coined ones (JudgeBench, CALM) are names.
  for (const paper of papers) for (const word of squash(paper.title).split(' ')) if (coined(word)) add(word, false);
  return out;
}

/** Levenshtein distance, small strings only. */
export function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const next = [i];
    for (let j = 1; j <= b.length; j += 1) next[j] = Math.min(prev[j] + 1, next[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = next;
  }
  return prev[b.length];
}

/**
 * The known names a message's words sound like but do not spell. A word matches a name token when both have five
 * letters or more (four-letter ones collide too easily: "note" and Node), they share a Double Metaphone code, they are
 * within a small edit distance (1 for short names, 2 from seven letters), and the word is not itself a known name or
 * an inflection of one ("precedents" is not a mishearing of Precedent).
 */
export function soundAlikes(message: string, names: KnownName[]): SoundAlike[] {
  const known = new Set(names.map((n) => n.token));
  const found = new Map<string, SoundAlike>();
  for (const raw of squash(message).split(' ')) {
    const word = letters(raw);
    if (word.length < 5 || known.has(word)) continue;
    const codes = new Set(doubleMetaphone(word));
    for (const name of names) {
      if (name.token.length < 5 || word.startsWith(name.token) || name.token.startsWith(word)) continue;
      if (!doubleMetaphone(name.token).some((code) => codes.has(code))) continue;
      if (editDistance(word, name.token) > (name.token.length >= 7 ? 2 : 1)) continue;
      if (!found.has(name.word)) found.set(name.word, { heard: keepOnly(raw, (c) => isWordChar(c) || c === "'" || c === '-'), name: name.name, word: name.word });
    }
  }
  return [...found.values()];
}

/** The note the model reads: a likelihood, with the visitor's own word. */
export function soundAlikeNote(matches: SoundAlike[]): string {
  if (!matches.length) return '';
  const said = matches.map((m) => `"${m.heard}" probably means ${m.word}${m.word === m.name ? '' : ` (${m.name})`}`).join('; ');
  return `\n\n[Names that sound alike: ${said}. The visitor's words may be a mishearing or a typo; answer about the name if that fits, and say which you mean.]`;
}

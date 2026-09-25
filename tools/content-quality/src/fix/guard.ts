import { extractLinks, extractNumbers } from '../text.js';

export interface GuardResult {
  ok: boolean;
  reasons: string[];
  missingNumbers: string[];
  newNumbers: string[];
  missingLinks: string[];
  newLinks: string[];
}

function count(values: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return map;
}

function missingFrom(original: Map<string, number>, rewritten: Map<string, number>): string[] {
  const out: string[] = [];
  for (const [value, needed] of original) {
    if ((rewritten.get(value) ?? 0) < needed) out.push(value);
  }
  return out;
}

function addedIn(original: Map<string, number>, rewritten: Map<string, number>): string[] {
  const out: string[] = [];
  for (const [value, count2] of rewritten) {
    if ((original.get(value) ?? 0) < count2) out.push(value);
  }
  return out;
}

/**
 * A rewrite must keep every number and every link from the original, and must
 * not invent new ones. Numbers and links are compared as multisets.
 */
export function guardRewrite(original: string, rewritten: string): GuardResult {
  const originalNumbers = count(extractNumbers(original));
  const rewrittenNumbers = count(extractNumbers(rewritten));
  const originalLinks = count(extractLinks(original).map(normaliseLink));
  const rewrittenLinks = count(extractLinks(rewritten).map(normaliseLink));

  const missingNumbers = missingFrom(originalNumbers, rewrittenNumbers);
  const newNumbers = addedIn(originalNumbers, rewrittenNumbers);
  const missingLinks = missingFrom(originalLinks, rewrittenLinks);
  const newLinks = addedIn(originalLinks, rewrittenLinks);

  const reasons: string[] = [];
  if (missingNumbers.length > 0) reasons.push(`dropped number(s): ${missingNumbers.join(', ')}`);
  if (newNumbers.length > 0) reasons.push(`invented number(s): ${newNumbers.join(', ')}`);
  if (missingLinks.length > 0) reasons.push(`dropped link(s): ${missingLinks.join(', ')}`);
  if (newLinks.length > 0) reasons.push(`invented link(s): ${newLinks.join(', ')}`);

  return {
    ok: reasons.length === 0,
    reasons,
    missingNumbers,
    newNumbers,
    missingLinks,
    newLinks,
  };
}

function normaliseLink(link: string): string {
  return link.replace(/[.,;)]+$/, '');
}

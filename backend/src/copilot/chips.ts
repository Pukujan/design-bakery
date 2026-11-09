/**
 * Which kind of chip an action is. A NAVIGATION chip takes the visitor somewhere (another page, or a section of one) and
 * the site's moon walks them there; an EXPANSION chip is a follow-up in the same topic and just sends a message.
 * The server stamps `chip` on every action it sends (route.ts), and the browser reads it back
 * (frontend/src/app/modules/copilot/chips.ts keeps the same rule for actions that arrive without it).
 * No imports, so a script test can read this file directly.
 */
export type ChipKind = 'navigate' | 'expand';

type ChipSource = { kind: string; chip?: string; text?: string };

/** `null` for an action that is not a chip at all (a call's scroll step, a song's player). */
export function chipKindOf(action: ChipSource): ChipKind | null {
  if (action.kind === 'scrollstep') return null;
  if (action.kind === 'ask') return 'expand';
  if (action.kind === 'song') return null;
  if (['navigate', 'projects', 'link', 'book', 'cite'].includes(action.kind)) return 'navigate';
  if (action.chip === 'navigate' || action.chip === 'expand') return action.chip;
  // An action of a kind nobody has classified: a question stays in the chat, anything else is a place to go.
  return action.text?.trim().endsWith('?') ? 'expand' : 'navigate';
}

export function withChip<T extends ChipSource>(action: T): T & { chip?: ChipKind } {
  const chip = chipKindOf(action);
  return (chip ? { ...action, chip } : action) as T & { chip?: ChipKind };
}

/** The words on a project chip: where it goes. */
export const openLabel = (title: string) => `Open ${title}`;

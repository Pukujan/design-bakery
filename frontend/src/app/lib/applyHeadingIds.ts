import { anchorAllocator } from './headingAnchors';

/**
 * Gives the headings under `root` their anchors, in reading order, so a repeated heading gets -2, -3 and the ids match
 * the ones the copilot server computes from the same text (headingAnchors.ts). Run it after the markdown has rendered.
 */
export function applyHeadingIds(root: ParentNode | null, options: { selector?: string; stripNumber?: boolean } = {}) {
  if (!root) return;
  const next = anchorAllocator({ stripNumber: options.stripNumber });
  root.querySelectorAll<HTMLElement>(options.selector ?? 'h2, h3').forEach((heading) => {
    heading.id = next(heading.textContent ?? '');
  });
}

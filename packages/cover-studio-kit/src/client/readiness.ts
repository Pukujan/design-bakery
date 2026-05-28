import type { CoverStudioAction, CoverStudioSnapshot } from '../types.js';

export type CoverStudioReadiness = {
  ready: boolean;
  message: string;
  hint?: string;
};

export function getCoverStudioReadiness(snapshot: CoverStudioSnapshot): CoverStudioReadiness {
  const title = snapshot.title?.trim() ?? '';
  const description = snapshot.excerpt?.trim() ?? '';

  if (!title) {
    return { ready: false, message: 'Add a title first.' };
  }

  if (!description) {
    return {
      ready: false,
      message: 'Add a description first.',
      hint: 'Description drives the cover blurb and image prompts.',
    };
  }

  return { ready: true, message: 'Ready' };
}

export function getCoverStudioTagReadiness(snapshot: CoverStudioSnapshot): CoverStudioReadiness {
  const base = getCoverStudioReadiness(snapshot);
  if (!base.ready) return base;
  const count = (snapshot.tags ?? []).filter(Boolean).length;
  if (count === 0) {
    return {
      ready: false,
      message: 'Pick at least one tag (up to 5).',
      hint: 'Use Suggest tags from your title and description.',
    };
  }
  return { ready: true, message: 'Ready' };
}

/** @deprecated use getCoverStudioReadiness */
export function getCoverStudioReadinessLegacy(
  snapshot: CoverStudioSnapshot,
  _action: CoverStudioAction,
): CoverStudioReadiness {
  return getCoverStudioReadiness(snapshot);
}

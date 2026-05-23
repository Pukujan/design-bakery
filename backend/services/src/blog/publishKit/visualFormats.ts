/** Canonical output sizes — one AI hero, multiple crops + overlays. */

export const COVER_SIZE = { width: 1200, height: 800 } as const;
/** Open Graph / Twitter (1.91:1). */
export const OG_SIZE = { width: 1200, height: 630 } as const;
/** List cards + admin social preview thumb (square). */
export const THUMBNAIL_SIZE = { width: 640, height: 640 } as const;
export const OG_THUMB_SIZE = { width: 800, height: 800 } as const;

/** Master AI canvas — square crops cleanly to OG, cover, and thumbs. */
export const MASTER_HERO_SIZE = { width: 1024, height: 1024 } as const;

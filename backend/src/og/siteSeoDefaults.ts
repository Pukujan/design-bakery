/**
 * The subset of `frontend/src/app/seo/siteSeoDefaults.ts` the Open Graph preview
 * service needs. Kept as its own file (rather than importing the frontend module,
 * which lives outside the backend's `rootDir`) so the og modules can be copied
 * verbatim.
 *
 * `scripts/test-og-contract.mjs` fails CI if these two values drift from the
 * frontend originals.
 */

export const SITE_NAME = 'Design Baker';

/** Default social preview image (1200×630-ish PNG in /public). */
export const DEFAULT_OG_IMAGE_PATH = '/images/site-og.png';

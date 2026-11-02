/**
 * Picks the site's space theme. The colours themselves live in styles/space-theme.css; this file only
 * chooses which one is on. Order of choice: ?theme= in the address (remembered), the remembered choice,
 * then the default. Imported first in main.tsx so the theme is set before any page paints.
 */
import '../../styles/space-theme.css';

export const THEMES = ['black-hole', 'red-giant', 'blue-star', 'green-nebula', 'pulsar', 'supernova'] as const;
export type SpaceTheme = (typeof THEMES)[number];
const DEFAULT_THEME: SpaceTheme = 'black-hole';
const KEY = 'db-theme-v1';

const isTheme = (value: string | null): value is SpaceTheme => !!value && (THEMES as readonly string[]).includes(value);

function remembered(): SpaceTheme | null {
  try {
    const value = localStorage.getItem(KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

/** Switch theme now and remember it. With no name, back to the default. */
export function setTheme(name?: string): SpaceTheme {
  const next = isTheme(name ?? null) ? (name as SpaceTheme) : DEFAULT_THEME;
  document.documentElement.dataset.theme = next;
  try {
    if (next === DEFAULT_THEME) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    /* the theme still applies for this visit */
  }
  return next;
}

/** A CSS token's current value, for canvas and 3D code that cannot use var(). */
export function themeColor(token: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || fallback;
}

const asked = new URLSearchParams(window.location.search).get('theme');
setTheme(isTheme(asked) ? asked : (remembered() ?? undefined));
(window as unknown as { setTheme?: typeof setTheme; THEMES?: typeof THEMES }).setTheme = setTheme;
(window as unknown as { THEMES?: typeof THEMES }).THEMES = THEMES;

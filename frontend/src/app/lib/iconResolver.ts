import type { ComponentType } from 'react';
import {
  Brain,
  Code,
  ExternalLink,
  Github,
  Lightbulb,
  Linkedin,
  Mail,
  Rocket,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { BehanceIcon } from '../components/SocialBrandIcons';

/**
 * The Lucide icons the site's content can name, resolved by string.
 *
 * This used to be `import * as LucideIcons from 'lucide-react'`, which pulled the
 * entire icon set (≈1500 icons) into the entry chunk. The reachable names are
 * bounded: relevant-experience JSON supplies Brain/Code/Lightbulb/Rocket/Shield,
 * and the social icons (Github/Linkedin/Mail/Behance) come from social-links.json.
 * `test:icon-coverage` fails the build if a content icon is not listed here.
 */
const ICONS: Record<string, LucideIcon> = {
  Brain,
  Code,
  Lightbulb,
  Rocket,
  Shield,
  Github,
  Linkedin,
  Mail,
};

/**
 * Dynamically resolve a Lucide icon by name from JSON config.
 * Handles icon name normalization and provides a fallback.
 *
 * @param iconName - The name of the Lucide icon (e.g., 'Rocket', 'Lightbulb')
 * @param fallback - The fallback icon to use if the name is not found (defaults to ExternalLink)
 * @returns The resolved LucideIcon component or fallback
 *
 * @example
 * const icon = resolveIcon('Rocket');  // Returns Rocket icon
 * const icon = resolveIcon('LinkedIn');  // Returns Linkedin icon (auto-aliased)
 * const icon = resolveIcon('NonExistent');  // Returns ExternalLink icon (fallback)
 */
export function resolveIcon(
  iconName: string | undefined,
  fallback: LucideIcon = ExternalLink,
): ComponentType<{ className?: string }> {
  if (!iconName) return fallback;

  const normalized = iconName.trim();

  if (normalized === 'Behance') return BehanceIcon;

  // Handle aliases (e.g., LinkedIn → Linkedin)
  const alias =
    normalized === 'LinkedIn'
      ? 'Linkedin'
      : normalized === 'GitHub'
        ? 'Github'
        : normalized;

  const resolved = ICONS[alias];
  if (resolved) return resolved;

  if (import.meta.env.DEV) {
    console.warn(
      `[iconResolver] "${normalized}" is not in the ICONS allowlist; rendering the fallback. ` +
        'Add it to the ICONS map in frontend/src/app/lib/iconResolver.ts (and check pnpm test:icon-coverage).',
    );
  }
  return fallback;
}

import type { ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';
import { ExternalLink, type LucideIcon } from 'lucide-react';
import { BehanceIcon } from '../components/SocialBrandIcons';

/**
 * Dynamically resolve a Lucide icon by name from JSON config.
 * Handles icon name normalization and provides a fallback.
 *
 * @param iconName - The name of the Lucide icon (e.g., 'Users', 'Lightbulb', 'Rocket')
 * @param fallback - The fallback icon to use if the name is not found (defaults to ExternalLink)
 * @returns The resolved LucideIcon component or fallback
 *
 * @example
 * const icon = resolveIcon('Users');  // Returns Users icon
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

  const resolvedIcon = LucideIcons[alias as keyof typeof LucideIcons] as LucideIcon | undefined;

  return resolvedIcon ?? fallback;
}

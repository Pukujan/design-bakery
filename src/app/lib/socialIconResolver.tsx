import type { ComponentType } from 'react';
import { Github, Linkedin, Mail, ExternalLink } from 'lucide-react';
import { BehanceIcon } from '../components/SocialBrandIcons';
import { resolveIcon } from './iconResolver';

type IconProps = { className?: string };

const footerIconMap: Record<string, ComponentType<IconProps>> = {
  Github,
  Linkedin,
  Behance: BehanceIcon,
  Mail,
};

export function resolveFooterSocialIcon(icon: string, label: string, href: string): ComponentType<IconProps> {
  const key = icon.trim();
  if (footerIconMap[key]) return footerIconMap[key];

  const combined = `${icon} ${label} ${href}`.toLowerCase();
  if (combined.includes('behance') || href.includes('behance.net')) return BehanceIcon;
  if (combined.includes('github')) return Github;
  if (combined.includes('linkedin')) return Linkedin;
  if (combined.includes('mail') || combined.includes('email')) return Mail;

  return resolveIcon(icon, ExternalLink);
}

export function resolveContactSocialIcon(
  name: string,
  icon: string,
  href: string,
): ComponentType<IconProps> {
  const combined = `${name} ${icon} ${href}`.toLowerCase();
  if (combined.includes('behance') || href.includes('behance.net')) return BehanceIcon;
  if (combined.includes('github')) return Github;
  if (combined.includes('linkedin')) return Linkedin;
  if (combined.includes('mail') || name.toLowerCase() === 'email') return Mail;

  return resolveIcon(icon, ExternalLink);
}

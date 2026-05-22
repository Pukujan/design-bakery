import type { FooterSocialLink, SocialLink } from './adminContentService';

const GITHUB_URL = 'https://github.com/pukujan';
const BEHANCE_URL = 'https://www.behance.net/pujan3645';
const LINKEDIN_URL = 'https://www.linkedin.com/in/pujan3645';
const EMAIL_URL = 'mailto:pujan3645@gmail.com';

function isInstagramEntry(name: string, icon: string, href: string): boolean {
  const lower = `${name} ${icon} ${href}`.toLowerCase();
  return lower.includes('instagram');
}

function isTwitterOrBehanceEntry(name: string, icon: string, href: string): boolean {
  const lower = `${name} ${icon} ${href}`.toLowerCase();
  return (
    lower.includes('twitter') ||
    lower.includes('behance') ||
    href.includes('behance.net')
  );
}

export function normalizeContactSocialLink(link: SocialLink): SocialLink {
  if (isInstagramEntry(link.name, link.icon, link.href)) {
    return {
      name: 'GitHub',
      icon: 'Github',
      href: GITHUB_URL,
      handle: 'github.com/pukujan',
      color: link.color || '#FF8C42',
    };
  }

  if (link.name === 'GitHub' || link.icon === 'Github' || link.icon === 'GitHub') {
    return {
      ...link,
      name: 'GitHub',
      icon: 'Github',
      href: link.href && link.href !== '#' ? link.href : GITHUB_URL,
      handle: link.handle || 'github.com/pukujan',
    };
  }

  if (isTwitterOrBehanceEntry(link.name, link.icon, link.href)) {
    return {
      ...link,
      name: 'Behance',
      icon: 'Behance',
      href: link.href && link.href !== '#' ? link.href : BEHANCE_URL,
      handle: link.handle || '/pujan3645',
    };
  }

  return link;
}

export function normalizeContactSocialLinks(links: SocialLink[]): SocialLink[] {
  return links.map(normalizeContactSocialLink);
}

export function normalizeFooterSocialLink(social: FooterSocialLink): FooterSocialLink {
  const href = social.href && social.href !== '#' ? social.href : '';
  const labelLower = social.label.toLowerCase();
  const iconLower = social.icon.toLowerCase();
  const hrefLower = href.toLowerCase();

  if (labelLower.includes('instagram') || iconLower.includes('instagram')) {
    return { icon: 'Github', label: 'GitHub', href: GITHUB_URL };
  }

  if (
    labelLower.includes('twitter') ||
    iconLower.includes('twitter') ||
    labelLower.includes('behance') ||
    iconLower.includes('behance') ||
    hrefLower.includes('behance.net')
  ) {
    return {
      icon: 'Behance',
      label: 'Behance',
      href: hrefLower.includes('behance.net') ? href : BEHANCE_URL,
    };
  }

  if (labelLower.includes('github') || iconLower.includes('github')) {
    return {
      icon: 'Github',
      label: 'GitHub',
      href: href || GITHUB_URL,
    };
  }

  if (labelLower.includes('linkedin') || iconLower.includes('linkedin')) {
    return {
      icon: 'Linkedin',
      label: 'LinkedIn',
      href: href || LINKEDIN_URL,
    };
  }

  if (labelLower.includes('email') || iconLower.includes('mail')) {
    return {
      icon: 'Mail',
      label: 'Email',
      href: href || EMAIL_URL,
    };
  }

  return {
    ...social,
    href:
      href ||
      (social.label === 'GitHub'
        ? GITHUB_URL
        : social.label === 'LinkedIn'
          ? LINKEDIN_URL
          : social.label === 'Email'
            ? EMAIL_URL
            : social.href),
  };
}

export function normalizeFooterSocialLinks(links: FooterSocialLink[]): FooterSocialLink[] {
  return links.map(normalizeFooterSocialLink);
}

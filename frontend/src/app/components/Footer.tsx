import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useFooterSection } from '../lib/contentHooks';
import { normalizeFooterSocialLink } from '../lib/normalizeSocialLinks';
import { resolveFooterSocialIcon } from '../lib/socialIconResolver';
import { TEMP_ETE_HOME_ONLY } from '../lib/siteMode';
import { usePortfolio } from '../portfolios/PortfolioContext';
import type { FooterNavLink } from '../lib/adminContentService';

function isExternalHref(href: string): boolean {
  return href.startsWith('http') || href.startsWith('mailto:');
}

function resolveRoutePath(href: string, pathTo: (segment?: string) => string): string {
  if (href === '/' || href === '') return pathTo('/');
  if (TEMP_ETE_HOME_ONLY) return pathTo('/');
  if (href === '/blogs') return pathTo('/blogs');
  if (
    href.startsWith('/case-studies') ||
    href === '/design' ||
    href.startsWith('/nav/')
  ) {
    return href;
  }
  if (href.startsWith('/') && !href.startsWith('//')) {
    return pathTo(href);
  }
  return href;
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const content = useFooterSection();
  const { pathTo } = usePortfolio();
  const navigate = useNavigate();
  const location = useLocation();
  const homePath = pathTo('/');

  const isOnHome = location.pathname === homePath || location.pathname === `${homePath}/`;

  const scrollToSection = (sectionId: string) => {
    const id = sectionId.replace(/^#/, '');
    if (isOnHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate({ pathname: homePath, hash: `#${id}` });
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const renderNavLink = (item: FooterNavLink) => {
    const className = 'text-gray-400 hover:text-white transition-colors';

    if (item.type === 'anchor') {
      const sectionId = item.href.replace(/^#/, '');
      return (
        <a
          href={`${homePath}#${sectionId}`}
          className={className}
          onClick={(event) => {
            event.preventDefault();
            scrollToSection(sectionId);
          }}
        >
          {item.label}
        </a>
      );
    }

    if (item.type === 'route') {
      return (
        <Link to={resolveRoutePath(item.href, pathTo)} className={className}>
          {item.label}
        </Link>
      );
    }

    return (
      <a
        href={item.href}
        className={className}
        target={isExternalHref(item.href) ? '_blank' : undefined}
        rel={isExternalHref(item.href) ? 'noopener noreferrer' : undefined}
      >
        {item.label}
      </a>
    );
  };

  return (
    <footer className="bg-gray-900 text-white py-16 px-6 border-t-6 border-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <motion.h3 className="text-3xl font-black mb-4" whileHover={{ scale: 1.05 }}>
              {content.brandTitle}
            </motion.h3>
            <p className="text-gray-400 mb-6 text-lg leading-relaxed">
              {content.brandDescription}
            </p>
            <div className="flex gap-4">
              {content.socialLinks.map((raw) => {
                const social = normalizeFooterSocialLink(raw);
                const Icon = resolveFooterSocialIcon(social.icon, social.label, social.href);
                const external = isExternalHref(social.href);

                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 flex items-center justify-center transition-all"
                    aria-label={social.label}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Navigation</h4>
            <ul className="space-y-2">
              {content.navigationLinks.map((item) => (
                <li key={item.label}>{renderNavLink(item)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {content.quickLinks.map((item) => (
                <li key={item.label}>{renderNavLink(item)}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-gray-400">
            © {currentYear} {content.copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}

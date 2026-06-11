import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { SECTION_SUBNAV } from './legalWorkflowCaseStudyData';

const TOP_NAV = [
  { href: '/', label: 'Home' },
  { href: '/blogs', label: 'Blogs' },
  { href: '/#projects', label: 'Projects' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
] as const;

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, '');
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function CaseStudySiteNav() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSectionNav = (href: string) => {
    setMobileOpen(false);
    scrollToHash(href);
  };

  const handleHomeSection = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('/#')) {
      const sectionId = href.slice(2);
      navigate('/');
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
      return;
    }
    navigate(href);
  };

  return (
    <>
      <nav className="lwr-nav">
        <div className="lwr-wrap lwr-nav-inner">
          <Link to="/" className="lwr-brand">
            <span className="lwr-logo">DB</span>
            <span>Design Baker</span>
          </Link>
          <div className="lwr-nav-links">
            {TOP_NAV.map((item) =>
              item.href.startsWith('/#') ? (
                <button
                  key={item.href}
                  type="button"
                  className="lwr-nav-link-btn"
                  onClick={() => handleHomeSection(item.href)}
                >
                  {item.label}
                </button>
              ) : (
                <Link key={item.href} to={item.href} className="lwr-nav-link">
                  {item.label}
                </Link>
              ),
            )}
          </div>
          <button
            type="button"
            className="lwr-nav-mobile-toggle"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="lwr-nav-mobile-panel lwr-wrap">
            {TOP_NAV.map((item) =>
              item.href.startsWith('/#') ? (
                <button
                  key={item.href}
                  type="button"
                  className="lwr-nav-mobile-link"
                  onClick={() => handleHomeSection(item.href)}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className="lwr-nav-mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        )}
      </nav>

      <div className="lwr-subnav">
        <div className="lwr-wrap lwr-subnav-inner">
          {SECTION_SUBNAV.map((item) => (
            <button
              key={item.href}
              type="button"
              className="lwr-subnav-link"
              onClick={() => handleSectionNav(item.href)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

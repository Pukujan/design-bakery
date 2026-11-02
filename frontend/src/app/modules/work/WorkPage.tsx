import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import rawProjects from '../../portfolios/endtoend-engineer/engineering/projects.json';
import { orderProjectsForShowcase, PROJECT_CATEGORY_LABEL, isProjectCategory } from '../../lib/projectOrder';
import { NotFoundPage } from '../../components/NotFoundPage';
import { PageSeo } from '@/seo/PageSeo';
import { copilot } from '../copilot/store';
import '../lab/lab.css';
import './work.css';

type Project = (typeof rawProjects)[number];

const EASE = [0.2, 0.7, 0.1, 1] as const;
const ordered = orderProjectsForShowcase(rawProjects, 'all');

const isExternal = (url: string) => /^https?:\/\//.test(url);

/** One presentation page per project: what it is, why, the evidence, and where to go next. */
export function WorkPage() {
  const { slug } = useParams();
  const project = rawProjects.find((p) => p.slug === slug);
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const artY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const artScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%']);
  const glowY = useTransform(scrollYProgress, [0, 1], ['0%', '45%']);

  if (!project) return <NotFoundPage />;

  const index = ordered.findIndex((p) => p.id === project.id);
  const next: Project = ordered[(index + 1) % ordered.length];
  const category =
    project.category && isProjectCategory(project.category) ? PROJECT_CATEGORY_LABEL[project.category] : null;
  const links = (project.links ?? []).filter((link) => link.url && link.url !== '#');
  const started = project.startedAt
    ? new Date(`${project.startedAt}-01`.slice(0, 10)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const ask = () => {
    copilot.setOpen(true);
    void copilot.send(`Tell me about ${project.title}.`, { path: window.location.pathname, title: document.title });
  };

  return (
    <div className="lab-root work-root" style={{ '--work-bg': project.color, '--work-accent': project.accentColor } as React.CSSProperties}>
      <PageSeo
        title={`${project.title} | Design Baker`}
        description={project.tagline}
        canonicalPath={`/work/${project.slug}`}
      />

      <header className="lab-bar">
        <Link to="/lab" className="lab-logo" aria-label="Design Baker, home">
          D<span className="lab-logo-glyph">B</span>
        </Link>
        <nav className="lab-nav lab-mono" aria-label="Project">
          <Link to="/lab#work">All work</Link>
          <Link to="/blogs">Writing</Link>
        </nav>
      </header>

      <main>
        <section ref={heroRef} className="work-hero">
          <motion.div className="work-glow" aria-hidden="true" style={reduceMotion ? undefined : { y: glowY }} />
          <div className="work-hero-copy">
            <p className="lab-mono work-kicker">
              {[category, started].filter(Boolean).join(' · ')}
            </p>
            <motion.h1
              className="work-title"
              style={reduceMotion ? undefined : { y: titleY }}
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE }}
            >
              {project.title}
            </motion.h1>
            <motion.p
              className="work-tagline"
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
            >
              {project.tagline}
            </motion.p>
          </div>
          <div className="work-art" aria-hidden="true">
            <motion.img
              src={`/lab/projects/${project.slug}.webp`}
              alt=""
              style={reduceMotion ? undefined : { y: artY, scale: artScale }}
              initial={reduceMotion ? false : { clipPath: 'inset(100% 0 0 0)' }}
              animate={{ clipPath: 'inset(0% 0 0 0)' }}
              transition={{ duration: 1.3, delay: 0.1, ease: EASE }}
            />
          </div>
        </section>

        <section className="work-body">
          <motion.div
            className="work-story"
            initial={reduceMotion ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <h2 className="lab-mono">What it is</h2>
            <p className="work-lede">{project.description}</p>
            <button type="button" className="lab-chip lab-chip--solid work-ask" onClick={ask} data-cursor="Ask">
              Ask the copilot about {project.title} →
            </button>
          </motion.div>

          <motion.aside
            className="work-facts"
            initial={reduceMotion ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
          >
            {project.stats?.length ? (
              <div>
                <h2 className="lab-mono">Highlights</h2>
                <ul role="list" className="work-list">
                  {project.stats.map((stat) => (
                    <li key={stat.label}>{stat.label}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <h2 className="lab-mono">Built with</h2>
              <ul role="list" className="work-tags">
                {project.tech.map((item) => (
                  <li key={item} className="lab-chip">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {links.length > 0 && (
              <div>
                <h2 className="lab-mono">Go deeper</h2>
                <ul role="list" className="work-links">
                  {links.map((link) => (
                    <li key={link.url}>
                      {isExternal(link.url) ? (
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.label} ↗
                        </a>
                      ) : (
                        <a href={link.url}>{link.label} →</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.aside>
        </section>

        <Link to={`/work/${next.slug}`} className="work-next" data-cursor="Next">
          <span className="lab-mono">Next project</span>
          <span className="work-next-title">{next.title} →</span>
        </Link>
      </main>

      <footer className="lab-footer lab-mono">
        <span>Design Baker · {new Date().getFullYear()}</span>
        <Link to="/lab">All work →</Link>
      </footer>
    </div>
  );
}

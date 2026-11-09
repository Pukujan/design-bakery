import { useRef, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useProjectRecords, type ProjectRecord } from '../../lib/portfolioDocs';
import { orderProjectsForShowcase, PROJECT_CATEGORY_LABEL, isProjectCategory } from '../../lib/projectOrder';

type Project = ProjectRecord;

const EASE = [0.2, 0.7, 0.1, 1] as const;

/**
 * Key art per project, generated as one series (TASK-DB-0098). A project
 * without an entry shows the typographic poster instead.
 */
const PROJECT_MEDIA: Record<number, string> = {
  16: 'website-copilot',
  7: 'study-os',
  1: 'cortex',
  6: 'fossil',
  2: 'oni-architecture',
  3: 'ekagajpatra',
  5: 'legal-workflow-research',
  8: 'fluffy-v4',
  9: 'eval-lab',
  10: 'project-continuity',
  11: 'inference-recommendation',
  12: 'agent-custom-setup',
  13: 'orbitgraph',
  14: 'voidfeed',
  15: 'precedent',
  17: 'nyc-map-agent',
  18: 'octo',
  19: 'maybe-home',
  20: 'riley',
};

const mediaSrc = (slug: string) => `/lab/projects/${slug}.webp`;

/** A card opens the project's description page; the live-platform links live on that page. */
const MotionLink = motion(Link);

function tagLine(project: Project): string {
  const category =
    project.category && isProjectCategory(project.category) ? PROJECT_CATEGORY_LABEL[project.category] : null;
  return [category, ...project.tech.slice(0, 2)].filter(Boolean).join(' · ');
}

function WorkTile({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const media = PROJECT_MEDIA[project.id];
  const posterWord = project.title.split(' ')[0];

  const trackSpotlight = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--px', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    event.currentTarget.style.setProperty('--py', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <MotionLink
      ref={ref}
      className="lab-tile"
      to={`/work/${project.slug}`}
      data-cursor="View"
      initial={reduceMotion ? false : { opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 1, ease: EASE }}
    >
      <motion.div
        className="lab-tile-media"
        style={{ '--tile-bg': project.color, '--tile-accent': project.accentColor } as React.CSSProperties}
        initial={reduceMotion ? false : { clipPath: 'inset(100% 0% 0% 0%)' }}
        whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 1.2, ease: EASE }}
      >
        <motion.div className="lab-tile-inner" style={reduceMotion ? undefined : { y: parallaxY }}>
          {media ? (
            <img src={mediaSrc(media)} alt="" loading="lazy" decoding="async" />
          ) : (
            <div className="lab-poster" onPointerMove={trackSpotlight} aria-hidden="true">
              <span className="lab-mono">{project.tagline}</span>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
                <span className="lab-poster-word">{posterWord}</span>
                <span className="lab-poster-dot" />
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      <div className="lab-tile-caption">
        <div>
          <h3 className="lab-tile-title">{project.title}</h3>
          <p className="lab-tile-tags lab-mono">{tagLine(project)}</p>
        </div>
        <span className="lab-tile-index lab-mono">{String(index + 1).padStart(2, '0')}</span>
      </div>
    </MotionLink>
  );
}

export function LabWork() {
  const projects = orderProjectsForShowcase(useProjectRecords(), 'all');

  return (
    <section className="lab-work" id="work" aria-labelledby="lab-work-title">
      <div className="lab-section-head lab-mono">
        <h2 id="lab-work-title" style={{ font: 'inherit', margin: 0 }}>
          Selected work
        </h2>
        <span>({projects.length})</span>
      </div>
      <div className="lab-grid">
        {projects.map((project, index) => (
          <WorkTile key={project.id} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}

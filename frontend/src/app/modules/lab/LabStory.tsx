import { useEngineeringAboutSection, useRelevantExperienceContent } from '../../lib/contentHooks';
import { FlowText } from './FlowText';
import './lab.css';
import './story.css';

type Highlight = { icon?: string; title: string; desc: string };
type Experience = {
  id: number | string;
  company: string;
  role: string;
  period: string;
  location?: string;
  collapsedSummary?: string;
  expandedSummary?: string;
  highlights?: string[];
  tags?: string[];
};

/** About: who I am and what I do, set large. Experience: the roles, newest first, in the same index layout. */
export function LabAbout() {
  const about = useEngineeringAboutSection();
  const highlights = (about.highlights ?? []) as Highlight[];
  return (
    <section className="story" id="about" aria-labelledby="story-about">
      <p className="story-kicker lab-mono">{about.headingLeft} {about.headingRight}</p>
      <h2 id="story-about" className="story-headline"><FlowText as="span" text={about.roleTitle ?? ''}>{about.roleTitle}</FlowText></h2>
      <div className="story-about-body">
        <div className="story-paragraphs">
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {about.callout ? <p className="story-callout">{about.callout}</p> : null}
        </div>
        <ul className="story-focus" role="list">
          {highlights.map((item) => (
            <li key={item.title}>
              <span className="story-focus-title">{item.title}</span>
              <span className="story-focus-desc">{item.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** What I can do with AI (TASK-DB-0161): sourced impact figures, then a short list backed by shipped work. */
export function LabCapabilities() {
  const about = useEngineeringAboutSection();
  const section = about.aiSection;
  const impact = about.impact ?? [];
  if (!section?.items?.length) return null;
  return (
    <section className="story" id="ai" aria-labelledby="story-ai">
      <p className="story-kicker lab-mono">{section.kicker}</p>
      <h2 id="story-ai" className="story-headline">{section.headline}</h2>
      {impact.length ? (
        <ul className="story-impact" role="list">
          {impact.map((item) => (
            <li key={item.label}>
              <span className="story-impact-value">{item.value}</span>
              <span className="story-impact-label">{item.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="story-focus story-ai-list" role="list">
        {section.items.map((item) => (
          <li key={item.title}>
            <span className="story-focus-title">{item.title}</span>
            <span className="story-focus-desc">{item.desc}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LabExperience() {
  const content = useRelevantExperienceContent();
  const roles = content.experiences as unknown as Experience[];
  return (
    <section className="story" id="experience" aria-labelledby="story-experience">
      <p className="story-kicker lab-mono">{content.headingLeft} {content.headingRight}</p>
      <h2 id="story-experience" className="story-headline">Roles</h2>
      {content.subtitle ? <p className="story-lede">{content.subtitle}</p> : null}
      <ol className="story-roles">
        {roles.map((role, index) => (
          <li key={role.id} className="story-role">
            <span className="story-index lab-mono">{String(index + 1).padStart(2, '0')}</span>
            <div className="story-role-main">
              <p className="story-role-period lab-mono">{role.period}</p>
              <h3 className="story-role-title">{role.role}</h3>
              <p className="story-role-company">
                {role.company}
                {role.location ? ` · ${role.location}` : ''}
              </p>
              {role.collapsedSummary ? <p className="story-role-summary">{role.collapsedSummary}</p> : null}
              {role.highlights?.length ? (
                <details className="story-more">
                  <summary>Details</summary>
                  {role.expandedSummary ? <p>{role.expandedSummary}</p> : null}
                  <ul role="list">
                    {role.highlights.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {role.tags?.length ? <p className="story-role-tags lab-mono">{role.tags.join(' · ')}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

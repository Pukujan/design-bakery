import { PageSeo } from '@/seo/PageSeo';
import { HOME_PAGE_SEO } from '@/seo/pageSeoConfig';
import { LabHero } from './LabHero';
import { LabWork } from './LabWork';
import { LabMarquee } from './LabMarquee';
import { LabAbout, LabExperience } from './LabStory';
import './lab.css';

/** The homepage (TASK-DB-0098), served at / and /lab. */
export function LabHome() {
  return (
    <div className="lab-root">
      <PageSeo {...HOME_PAGE_SEO} />

      <main>
        <LabHero />
        <LabMarquee>
          Software you can <em>trust</em> — built end to end —
        </LabMarquee>
        <LabAbout />
        <LabWork />
        <LabExperience />
      </main>

      <footer className="lab-footer lab-mono">
        <span>Design Baker · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

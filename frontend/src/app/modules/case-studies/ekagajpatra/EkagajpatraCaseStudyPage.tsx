import EkagajpatraCaseStudyApp from '@ekagajpatra-case-study/app/App';
import '@ekagajpatra-case-study/styles/index.css';
import { PageSeo } from '@/seo/PageSeo';
import { CASE_STUDY_SEO } from '@/seo/pageSeoConfig';

export function EkagajpatraCaseStudyPage() {
  const seo = CASE_STUDY_SEO.ekagajpatra;
  return (
    <div className="ekagajpatra-case-study min-h-screen">
      <PageSeo {...seo} />
      <EkagajpatraCaseStudyApp />
    </div>
  );
}

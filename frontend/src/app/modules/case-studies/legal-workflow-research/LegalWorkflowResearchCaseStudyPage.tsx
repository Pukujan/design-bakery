import { PageSeo } from '@/seo/PageSeo';
import { CASE_STUDY_SEO } from '@/seo/pageSeoConfig';
import { LegalWorkflowCaseStudyApp } from './LegalWorkflowCaseStudyApp';

export function LegalWorkflowResearchCaseStudyPage() {
  const seo = CASE_STUDY_SEO.legalWorkflowResearch;
  return (
    <>
      <PageSeo
        title={seo.title}
        description={seo.description}
        canonicalPath={seo.canonicalPath}
        ogImage={seo.ogImage}
        imageAlt={seo.imageAlt}
        ogTitle={seo.ogTitle}
        ogDescription={seo.ogDescription}
        ogType="article"
      />
      <LegalWorkflowCaseStudyApp />
    </>
  );
}

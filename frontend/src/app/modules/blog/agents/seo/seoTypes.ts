import type { BlogSeo } from '@/modules/blog/seo/blogSeo';

export type SeoFindingSeverity = 'error' | 'warn' | 'pass' | 'info';

export type SeoFinding = {
  id: string;
  severity: SeoFindingSeverity;
  message: string;
  field?: keyof BlogSeo | 'title' | 'excerpt' | 'content' | 'tags';
};

export type SeoAuditInput = {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  seo?: BlogSeo;
};

export type SeoAuditResult = {
  score: number;
  findings: SeoFinding[];
  suggested: Required<Pick<BlogSeo, 'metaTitle' | 'metaDescription'>>;
};

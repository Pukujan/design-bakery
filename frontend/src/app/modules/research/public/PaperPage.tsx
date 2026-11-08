import { Link, useParams } from 'react-router-dom';
import { getResearchPaper } from '../data/researchPapers';
import { Article } from '@/modules/lab/Article';
import { ArticleToc } from '@/modules/lab/ArticleToc';
import { PageSeo } from '@/seo/PageSeo';
import { SITE_NAME } from '@/seo/siteSeoDefaults';
import '@/modules/lab/lab.css';
import '@/modules/blog/public/list/writing.css';
import '@/modules/lab/post.css';

/** One research paper, from scratch in the lab's style: title, authors, abstract, and the body. */
export function ResearchPaperPage() {
  const { paperId } = useParams();
  const paper = paperId ? getResearchPaper(paperId) : undefined;

  if (!paper) {
    return (
      <div className="writing post">
        <Link to="/research" className="post-back lab-mono">
          ← Research
        </Link>
        <p className="writing-empty">This paper could not be found.</p>
      </div>
    );
  }

  return (
    <article className="writing post">
      <PageSeo
        title={`${paper.title} | Research | ${SITE_NAME}`}
        description={paper.abstract}
        canonicalPath={`/research/papers/${paper.id}`}
        ogType="article"
        author={paper.authors.join(', ')}
        publishedTime={paper.submitted}
      />
      <Link to="/research" className="post-back lab-mono">
        ← Research
      </Link>
      <p className="writing-kicker lab-mono">
        {paper.id} · {paper.submitted}
      </p>
      <h1 className="post-title">{paper.title}</h1>
      <p className="post-byline">{paper.authors.join(', ')}</p>
      <p className="post-lede">{paper.abstract}</p>
      <ArticleToc source={paper.content} />
      <div className="post-body">
        <Article source={paper.content} flow={false} />
      </div>
      {paper.tags.length ? <p className="post-tags lab-mono">{paper.tags.join(' · ')}</p> : null}
    </article>
  );
}

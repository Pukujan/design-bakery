import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getResearchPaper } from '../data/researchPapers';
import { Article } from '@/modules/lab/Article';
import { FlowText } from '@/modules/lab/FlowText';
import { ArticleToc } from '@/modules/lab/ArticleToc';
import '@/modules/lab/lab.css';
import '@/modules/blog/public/list/writing.css';
import '@/modules/lab/post.css';

/** One research paper, from scratch in the lab's style: title, authors, abstract, and the body. */
export function ResearchPaperPage() {
  const { paperId } = useParams();
  const paper = paperId ? getResearchPaper(paperId) : undefined;

  useEffect(() => {
    if (paper) document.title = `${paper.title} · Research`;
  }, [paper]);

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
      <Link to="/research" className="post-back lab-mono">
        ← Research
      </Link>
      <p className="writing-kicker lab-mono">
        {paper.id} · {paper.submitted}
      </p>
      <h1 className="post-title"><FlowText as="span" text={paper.title}>{paper.title}</FlowText></h1>
      <p className="post-byline">{paper.authors.join(', ')}</p>
      <FlowText className="post-lede" text={paper.abstract}>{paper.abstract}</FlowText>
      <ArticleToc source={paper.content} />
      <div className="post-body">
        <Article source={paper.content} />
      </div>
      {paper.tags.length ? <p className="post-tags lab-mono">{paper.tags.join(' · ')}</p> : null}
    </article>
  );
}

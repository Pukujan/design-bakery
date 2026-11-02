import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RESEARCH_PAPERS, type ResearchStatus } from '../data/researchPapers';
import { SupportingSources } from './SupportingSources';
import '@/modules/lab/lab.css';
import '@/modules/blog/public/list/writing.css';

type StatusFilter = 'all' | ResearchStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
];

/** The research index, in the same editorial layout as the writing index. */
export function ResearchListPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  useEffect(() => {
    document.title = 'Research · Design Bakery';
  }, []);

  const papers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESEARCH_PAPERS.filter((paper) => {
      if (status !== 'all' && paper.status !== status) return false;
      if (!q) return true;
      return [paper.title, paper.abstract, paper.id, ...paper.tags, ...paper.authors]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [query, status]);

  return (
    <div className="writing">
      <header className="writing-head">
        <p className="writing-kicker lab-mono">Research · {RESEARCH_PAPERS.length} papers</p>
        <h1 className="writing-title">
          Working <em>papers</em>.
        </h1>
      </header>

      <div className="writing-tools">
        <label className="sr-only" htmlFor="research-search">
          Search research
        </label>
        <input
          id="research-search"
          className="writing-search"
          type="search"
          placeholder="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <nav className="writing-topics" aria-label="Status">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="writing-topic"
              aria-pressed={status === option.value}
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </nav>
      </div>

      {papers.length === 0 ? (
        <p className="writing-empty">Nothing matches yet.</p>
      ) : (
        <ol className="writing-list">
          {papers.map((paper, index) => (
            <li key={paper.id}>
              <Link to={`/research/papers/${paper.id}`} className="writing-row">
                <span className="writing-index lab-mono">{String(index + 1).padStart(2, '0')}</span>
                <span className="writing-date lab-mono">{paper.submitted}</span>
                <span className="writing-name">{paper.title}</span>
                <span className="writing-excerpt">{paper.abstract}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <div className="writing-sources">
        <SupportingSources />
      </div>
    </div>
  );
}

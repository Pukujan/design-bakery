import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useBlogCategories, useBlogData } from '@/modules/blog/data/blogData';
import { filterBlogsBySearch } from '@/modules/blog/lib/blogListFilters';
import {
  buildBlogsPathWithCategory,
  resolveBlogCategoryId,
  resolveCategoryFromSearchParam,
} from '@/modules/blog/lib/blogCategoryNav';
import { usePortfolio } from '@/portfolios/PortfolioContext';
import { BlogListHead } from '@/seo/BlogListHead';
import '@/modules/lab/lab.css';
import './writing.css';

/** The writing index: a search line, text topic filters, and numbered rows. */
export function BlogListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pathTo } = usePortfolio();
  const categories = useBlogCategories();
  const { blogs, isLoading } = useBlogData();
  const blogsPath = pathTo('/blogs');
  const selected = useMemo(
    () => resolveCategoryFromSearchParam(searchParams.get('category'), categories),
    [searchParams, categories],
  );
  const [query, setQuery] = useState('');

  const topics = useMemo(() => categories.filter((c) => c.id !== 'all'), [categories]);
  const inTopic = useMemo(
    () =>
      selected === 'all'
        ? blogs
        : blogs.filter((blog) => resolveBlogCategoryId(blog.category, categories) === selected),
    [blogs, selected, categories],
  );
  const visible = useMemo(() => filterBlogsBySearch(inTopic, query), [inTopic, query]);

  return (
    <div className="writing">
      <BlogListHead />
      <header className="writing-head">
        <p className="writing-kicker lab-mono">Writing · {blogs.length} posts</p>
        <h1 className="writing-title">
          Notes from <em>building</em> it.
        </h1>
      </header>

      <div className="writing-tools">
        <label className="sr-only" htmlFor="writing-search">
          Search writing
        </label>
        <input
          id="writing-search"
          className="writing-search"
          type="search"
          placeholder="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <nav className="writing-topics" aria-label="Topics">
          {[{ id: 'all', label: 'All' }, ...topics].map((topic) => (
            <button
              key={topic.id}
              type="button"
              className="writing-topic"
              aria-pressed={selected === topic.id}
              onClick={() => navigate(buildBlogsPathWithCategory(blogsPath, topic.id))}
            >
              {topic.label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading && blogs.length === 0 ? (
        <p className="writing-empty lab-mono">Loading</p>
      ) : visible.length === 0 ? (
        <p className="writing-empty">Nothing matches yet.</p>
      ) : (
        <ol className="writing-list">
          {visible.map((blog, index) => {
            const id = blog.id;
            return (
              <li key={id}>
                <Link to={pathTo(`/blogs/${id}`)} className="writing-row">
                  <span className="writing-index lab-mono">{String(index + 1).padStart(2, '0')}</span>
                  <span className="writing-date lab-mono">{blog.date}</span>
                  <span className="writing-name">{blog.title}</span>
                  {blog.excerpt ? <span className="writing-excerpt">{blog.excerpt}</span> : null}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

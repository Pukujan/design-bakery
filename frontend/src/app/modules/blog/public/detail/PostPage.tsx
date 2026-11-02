import { Link, useParams } from 'react-router-dom';
import { useBlogCategories, useBlogData, useBlogPost } from '@/modules/blog/data/blogData';
import { resolveBlogCategoryId } from '@/modules/blog/lib/blogCategoryNav';
import { usePortfolio } from '@/portfolios/PortfolioContext';
import { Article } from '@/modules/lab/Article';
import { ArticleToc } from '@/modules/lab/ArticleToc';
import { PageSeo } from '@/seo/PageSeo';
import { resolveBlogMeta } from '@/modules/blog/seo/blogMeta';
import '@/modules/lab/lab.css';
import '@/modules/blog/public/list/writing.css';
import '@/modules/lab/post.css';

/** One blog post, from scratch in the lab's style: title, lede, the article, and the next post. */
export function BlogPostPage() {
  const { blogId } = useParams();
  const numericId = Number(blogId);
  const { blog, isLoading } = useBlogPost(Number.isFinite(numericId) && numericId > 0 ? numericId : undefined);
  const { blogs } = useBlogData();
  const categories = useBlogCategories();
  const { pathTo } = usePortfolio();

  if (!blog) {
    return (
      <div className="writing post">
        <Link to={pathTo('/blogs')} className="post-back lab-mono">
          ← Writing
        </Link>
        <p className="writing-empty">{isLoading ? 'Loading' : 'This post could not be found.'}</p>
      </div>
    );
  }

  const topic = categories.find((c) => c.id === resolveBlogCategoryId(blog.category, categories))?.label ?? blog.category;
  const index = blogs.findIndex((item) => item.id === blog.id);
  const next = index >= 0 && blogs.length > 1 ? blogs[(index + 1) % blogs.length] : undefined;
  const seo = resolveBlogMeta(blog);

  return (
    <article className="writing post">
      <PageSeo title={seo.pageTitle} description={seo.description} canonicalPath={`/blogs/${blog.id}`} ogImage={seo.imageUrl} imageAlt={blog.title} ogType="article" author={blog.author} publishedTime={blog.date} />
      <Link to={pathTo('/blogs')} className="post-back lab-mono">
        ← Writing
      </Link>
      <p className="writing-kicker lab-mono">{[topic, blog.date, blog.readTime].filter(Boolean).join(' · ')}</p>
      <h1 className="post-title">{blog.title}</h1>
      {blog.excerpt ? <p className="post-lede">{blog.excerpt}</p> : null}
      <ArticleToc source={blog.content ?? ''} />
      <div className="post-body">
        <Article source={blog.content ?? ''} flow={false} />
      </div>
      {blog.tags.length ? <p className="post-tags lab-mono">{blog.tags.join(' · ')}</p> : null}
      {next ? (
        <Link to={pathTo(`/blogs/${next.id}`)} className="post-next">
          <span className="lab-mono">Next</span>
          <span className="post-next-title">{next.title} →</span>
        </Link>
      ) : null}
    </article>
  );
}

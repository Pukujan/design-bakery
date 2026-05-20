/** Blog motion: guidelines/agent-devlog-blog-motion.md | Mermaid: guidelines/agent-devlog-mermaid.md */
import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Tag, Calendar, User } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Squiggle } from './GraphicElements';
import {
  BlogPageDecor,
  MotionSection,
  blogButtonMotion,
  blogCardMotion,
} from '@/components/BlogPageMotion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import { useBlogCategories, useBlogData } from '@/modules/engineering/blogData';
import { BlogDetailPageSkeleton } from '@/modules/engineering/BlogDetailPage/BlogDetailPageSkeleton';
import { useStickySidebar } from '@/modules/engineering/BlogDetailPage/useStickySidebar';
import { usePortfolio } from '@/portfolios/PortfolioContext';

const HEADING_SCROLL_MARGIN = 'scroll-mt-32';

function flattenMarkdownText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return String(child);
      }
      if (isValidElement(child) && child.props.children) {
        return flattenMarkdownText(child.props.children);
      }
      return '';
    })
    .join('');
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function scrollToHashTarget(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * MERMAID — read before changing init, render, or colors:
 * guidelines/agent-devlog-mermaid.md
 * (Also: .cursor/rules/blog-mermaid.mdc, globals.css `.blog-mermaid-chart`)
 */
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

const MERMAID_CHART_CLASS =
  'blog-mermaid-chart my-4 sm:my-5 md:my-6 p-2.5 sm:p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg md:rounded-xl border-2 sm:border-2 md:border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs sm:text-xs md:text-sm overflow-x-auto';

function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    const renderChart = async () => {
      try {
        const id = `blog-mmd-${Math.random().toString(36).slice(2, 11)}`;
        const { svg, bindFunctions } = await mermaid.render(id, chart);
        if (cancelled) return;
        el.innerHTML = svg;
        bindFunctions?.(el);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
        }
      }
    };

    void renderChart();

    return () => {
      cancelled = true;
      el.innerHTML = '';
    };
  }, [chart]);

  return (
    <div ref={containerRef} className={MERMAID_CHART_CLASS} role="img" aria-label="Diagram">
      {error ? <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p> : null}
    </div>
  );
}

// Custom markdown components
const MarkdownComponents = {
  code({ inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';

    if (!inline && lang === 'mermaid') {
      return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
    }

    return !inline ? (
      <div
        className="blog-fenced-code-wrap not-prose my-3 sm:my-3.5 md:my-4 rounded-lg md:rounded-xl overflow-hidden border-2 sm:border-2 md:border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        style={{ backgroundColor: 'var(--color-gray-900)' }}
      >
        <pre className="blog-fenced-code m-0 p-2.5 sm:p-3 md:p-4 overflow-x-auto text-xs sm:text-sm leading-relaxed bg-[var(--color-gray-900)]">
          <code className="blog-fenced-code__text font-mono" {...props}>
            {children}
          </code>
        </pre>
      </div>
    ) : (
      <code className="px-1 py-0.5 sm:px-1 md:px-1.5 bg-gray-100 dark:bg-gray-800 rounded border border-black sm:border md:border-2 text-xs font-mono" {...props}>
        {children}
      </code>
    );
  },
  a({ href, children, ...props }: any) {
    const isHashLink = typeof href === 'string' && href.startsWith('#');

    if (isHashLink) {
      return (
        <a
          href={href}
          className="text-blue-600 dark:text-blue-400 font-bold underline-offset-2 hover:underline"
          onClick={(event) => {
            event.preventDefault();
            scrollToHashTarget(href);
          }}
          {...props}
        >
          {children}
        </a>
      );
    }

    return (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 font-bold underline-offset-2 hover:underline break-words"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    );
  },
  h1({ children, ...props }: any) {
    const id = slugifyHeading(flattenMarkdownText(children));
    return (
      <h1
        id={id}
        className={`text-lg sm:text-xl md:text-2xl font-black mt-4 sm:mt-5 md:mt-6 mb-3 md:mb-4 border-l-4 sm:border-l-5 md:border-l-6 border-purple-500 pl-2 sm:pl-2.5 md:pl-3 ${HEADING_SCROLL_MARGIN}`}
        {...props}
      >
        {children}
      </h1>
    );
  },
  h2({ children, ...props }: any) {
    const id = slugifyHeading(flattenMarkdownText(children));
    return (
      <h2
        id={id}
        className={`text-base sm:text-lg md:text-xl font-black mt-5 sm:mt-6 md:mt-8 mb-2.5 sm:mb-3 md:mb-4 border-l-4 sm:border-l-5 md:border-l-6 border-blue-500 pl-2 sm:pl-2.5 md:pl-3 ${HEADING_SCROLL_MARGIN}`}
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3({ children, ...props }: any) {
    const id = slugifyHeading(flattenMarkdownText(children));
    return (
      <h3
        id={id}
        className={`text-sm sm:text-base md:text-lg font-black mt-4 sm:mt-5 md:mt-6 mb-2 md:mb-3 border-l-3 sm:border-l-3 md:border-l-4 border-purple-500 pl-2 md:pl-3 ${HEADING_SCROLL_MARGIN}`}
        {...props}
      >
        {children}
      </h3>
    );
  },
  h4({ children, ...props }: any) {
    const id = slugifyHeading(flattenMarkdownText(children));
    return (
      <h4
        id={id}
        className={`text-sm sm:text-sm md:text-base font-black mt-3 md:mt-4 mb-1.5 md:mb-2 text-gray-900 dark:text-gray-100 ${HEADING_SCROLL_MARGIN}`}
        {...props}
      >
        {children}
      </h4>
    );
  },
  table({ children, ...props }: any) {
    return (
      <div className="my-4 sm:my-5 md:my-6 overflow-x-auto -mx-2 sm:-mx-1 md:mx-0">
        <table className="min-w-full border-2 sm:border-2 md:border-3 border-black text-xs sm:text-xs md:text-sm" {...props}>
          {children}
        </table>
      </div>
    );
  },
  thead({ children, ...props }: any) {
    return (
      <thead className="bg-gray-100 dark:bg-gray-800" {...props}>
        {children}
      </thead>
    );
  },
  th({ children, ...props }: any) {
    return (
      <th className="px-2 py-1.5 sm:px-3 md:px-4 md:py-2 border border-black sm:border md:border-2 font-black text-left text-xs sm:text-xs md:text-sm" {...props}>
        {children}
      </th>
    );
  },
  td({ children, ...props }: any) {
    return (
      <td className="px-2 py-1.5 sm:px-3 md:px-4 md:py-2 border border-black sm:border md:border-2 text-xs sm:text-xs md:text-sm" {...props}>
        {children}
      </td>
    );
  },
  hr({ ...props }: any) {
    return (
      <hr className="my-4 sm:my-5 md:my-6 border-t-2 sm:border-t-2 md:border-t-3 border-black" {...props} />
    );
  },
  ul({ children, ...props }: any) {
    return (
      <ul className="my-2.5 sm:my-3 md:my-4 space-y-1 sm:space-y-1 md:space-y-1.5 list-none" {...props}>
        {children}
      </ul>
    );
  },
  li({ children, ...props }: any) {
    return (
      <li className="flex items-start gap-1.5 sm:gap-1.5 md:gap-2 text-sm sm:text-sm md:text-base" {...props}>
        <span className="text-blue-500 font-bold mt-0.5 text-xs sm:text-xs md:text-sm">▸</span>
        <span className="flex-1">{children}</span>
      </li>
    );
  },
  p({ children, ...props }: any) {
    return (
      <p className="my-2 sm:my-2.5 md:my-3 leading-relaxed text-sm sm:text-sm md:text-base" {...props}>
        {children}
      </p>
    );
  },
  blockquote({ children, ...props }: any) {
    return (
      <blockquote className="my-3 sm:my-3.5 md:my-4 border-l-4 sm:border-l-5 md:border-l-6 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-3.5 md:p-4 rounded-r-lg md:rounded-r-xl text-sm sm:text-sm md:text-base" {...props}>
        {children}
      </blockquote>
    );
  },
};

export function BlogDetailPage() {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const { pathTo } = usePortfolio();
  const { blogs, isLoading } = useBlogData();
  const categories = useBlogCategories();
  const blogsPath = pathTo('/blogs');

  const blog = blogs.find((b) => b.id === Number(blogId));
  const { columnRef, sidebarRef, sidebarStyle } = useStickySidebar();

  if (isLoading && !blog) {
    return <BlogDetailPageSkeleton />;
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">Blog not found</h1>
          <Button onClick={() => navigate(blogsPath)}>Back to Blogs</Button>
        </div>
      </div>
    );
  }

  const similarBlogs = blogs
    .filter((b) => b.category === blog.category && b.id !== blog.id)
    .slice(0, 3);

  const contentToRender = blog.content || 'No content available';

  return (
    <section className="min-h-screen pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-14 md:pb-16 px-4 sm:px-5 md:px-6 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 relative overflow-hidden">
      <BlogPageDecor variant="detail" seed={blogId ?? blog.id} />

      {/* Fixed Back Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.08, rotate: -4 }}
        whileTap={{ scale: 0.92 }}
        className="fixed top-[4.5rem] sm:top-24 left-3 sm:left-4 md:left-6 z-50"
      >
        <Button
          onClick={() => navigate(blogsPath)}
          size="icon"
          className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] bg-yellow-400 hover:bg-yellow-500 text-black font-black rounded-full transition-all"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </Button>
      </motion.div>

      <div className="max-w-6xl mx-auto relative z-10 pt-6 sm:pt-8 md:pt-10">
        {/* Grid gives sidebar column full row height so sticky can scroll with the article */}
        <div className="flex flex-col gap-4 sm:gap-5 min-[1020px]:grid min-[1020px]:grid-cols-[minmax(0,1fr)_260px] min-[1020px]:gap-6">
          {/* Main Content */}
          <div className="min-w-0">
            {/* Blog Header */}
            <MotionSection className="mb-5 sm:mb-6 md:mb-8">
              <div
                className="w-full h-2 sm:h-2.5 md:h-3 rounded-full mb-3 sm:mb-4 md:mb-6 border-2 sm:border-2 md:border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ml-11 sm:ml-12 md:ml-0"
                style={{ backgroundColor: blog.color }}
              />

              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl leading-tight mb-3 md:mb-4 font-black text-gray-900 dark:text-gray-100 ml-11 sm:ml-12 md:ml-0">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-2.5 sm:mb-3 md:mb-4 text-xs sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 ml-11 sm:ml-12 md:ml-0">
                <div className="flex items-center gap-1 sm:gap-1 md:gap-1.5">
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  <span className="font-bold">{blog.author}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1 md:gap-1.5">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  <span>{blog.date}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1 md:gap-1.5">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  <span>{blog.readTime}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-1.5 md:gap-2 mb-2.5 sm:mb-3 md:mb-4 ml-11 sm:ml-12 md:ml-0">
                {blog.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    className="border-2 border-black font-bold text-xs px-2 py-0.5"
                  >
                    <Tag className="w-2.5 h-2.5 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-0.5 sm:mr-0.5 md:mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="hidden md:block ml-11 sm:ml-12 md:ml-0">
                <Squiggle color={blog.color} />
              </div>
            </MotionSection>

            {/* Blog Content */}
            <MotionSection delay={0.15} className="w-full">
              <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
              <Card className="p-4 sm:p-5 md:p-6 lg:p-8 border-3 md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 overflow-hidden">
                <div className="blog-article-prose prose prose-sm sm:prose-sm md:prose-base max-w-none dark:prose-invert leading-relaxed break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={MarkdownComponents}
                  >
                    {contentToRender}
                  </ReactMarkdown>
                </div>
              </Card>
              </motion.div>
            </MotionSection>

            {/* Similar Blogs Section */}
            {similarBlogs.length > 0 && (
              <MotionSection delay={0.25} className="mt-6 sm:mt-8 md:mt-12">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black mb-4 sm:mb-5 md:mb-6 text-gray-900 dark:text-gray-100 border-l-4 sm:border-l-5 md:border-l-6 border-purple-500 pl-2 sm:pl-2.5 md:pl-3">
                  Similar Articles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                  {similarBlogs.map((similarBlog, idx) => (
                    <motion.div
                      key={similarBlog.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.08 }}
                      {...blogCardMotion}
                    >
                    <Card
                      className="p-4 sm:p-5 md:p-6 border-3 sm:border-4 md:border-6 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900 group cursor-pointer h-full"
                      onClick={() => {
                        navigate(pathTo(`/blogs/${similarBlog.id}`));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div
                        className="w-full h-2 sm:h-2.5 md:h-3 rounded-full mb-2.5 sm:mb-3 md:mb-4 border-2 border-black"
                        style={{ backgroundColor: similarBlog.color }}
                      />
                      <h3 className="text-sm sm:text-base md:text-xl font-black mb-2 sm:mb-2.5 md:mb-3 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {similarBlog.title}
                      </h3>
                      <p className="text-xs sm:text-xs md:text-sm text-gray-700 dark:text-gray-300 mb-2.5 sm:mb-3 md:mb-4 leading-relaxed line-clamp-3">
                        {similarBlog.excerpt}
                      </p>
                      <div className="flex items-center gap-1.5 sm:gap-1.5 md:gap-2 text-xs sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                        <span>{similarBlog.readTime}</span>
                      </div>
                    </Card>
                    </motion.div>
                  ))}
                </div>
              </MotionSection>
            )}
          </div>

          {/* Sidebar — hidden below 1020px (categories live in navbar menu) */}
          <aside ref={columnRef} className="hidden min-[1020px]:block relative min-h-full">
            <div ref={sidebarRef} style={sidebarStyle} className="w-[260px]">
              {/* Category Navigation */}
              <Card className="p-3 lg:p-4 border-3 lg:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 mb-3 lg:mb-4">
                <h3 className="text-base lg:text-lg font-black mb-3 lg:mb-4 text-gray-900 dark:text-gray-100">
                  Categories
                </h3>
                <div className="space-y-3">
                  {categories.filter((cat) => cat.id !== 'all').map((category) => {
                    const categoryCount = blogs.filter((b) => b.category === category.id).length;
                    const isActive = category.id === blog.category;

                    return (
                      <motion.div key={category.id} {...blogButtonMotion}>
                      <Button
                        onClick={() => navigate(blogsPath)}
                        className={`
                          w-full justify-between px-4 py-3 border-4 border-black
                          shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                          hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                          transition-all font-black text-sm
                          ${
                            isActive
                              ? 'bg-black text-white'
                              : 'bg-white dark:bg-gray-900 text-black dark:text-white'
                          }
                        `}
                        style={{
                          borderLeftColor: isActive ? category.color : undefined,
                          borderLeftWidth: isActive ? '8px' : undefined,
                        }}
                      >
                        <span>{category.label}</span>
                        <Badge
                          variant="outline"
                          className={`border-2 ${isActive ? 'border-white text-white' : 'border-black'}`}
                        >
                          {categoryCount}
                        </Badge>
                      </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-3 lg:p-4 border-3 lg:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900">
                <h3 className="text-base lg:text-lg font-black mb-3 lg:mb-4 text-gray-900 dark:text-gray-100">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <motion.div {...blogButtonMotion}>
                  <Button
                    onClick={() => navigate(blogsPath)}
                    className="w-full justify-start px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-blue-500 hover:bg-blue-600 text-white font-black text-sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    All Blogs
                  </Button>
                  </motion.div>
                  <motion.div {...blogButtonMotion}>
                  <Button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-full justify-start px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 text-black dark:text-white font-black text-sm"
                  >
                    ↑ Back to Top
                  </Button>
                  </motion.div>
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

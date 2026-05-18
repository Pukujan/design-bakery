import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Tag, Calendar, User, Menu, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Squiggle } from '../../../components/GraphicElements';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import { useBlogCategories, useBlogData } from '../blogData';
import { usePortfolio } from '../../../portfolios/PortfolioContext';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  themeVariables: {
    fontSize: '8px',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    nodeSpacing: 12,
    rankSpacing: 14,
    padding: 4,
    curve: 'basis',
  },
  sequence: {
    useMaxWidth: true,
  },
});

/** Drop leading # title so it is not duplicated under the page header. */
function stripLeadingMarkdownTitle(content: string): string {
  return content.replace(/^\s*#\s+[^\n]+\n+/, '');
}

function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      try {
        const id = `blog-mmd-${Math.random().toString(36).slice(2, 11)}`;
        const { svg: rendered } = await mermaid.render(id, chart.trim());
        const compactSvg = rendered.replace(
          /<svg\b([^>]*)>/i,
          '<svg$1 style="max-width:100%;height:auto;display:block;">'
        );
        if (!cancelled) {
          setSvg(compactSvg);
          setError('');
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        if (!cancelled) {
          setError('Could not render diagram');
          setSvg('');
        }
      }
    };

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return <p className="my-2 text-xs text-red-600 dark:text-red-400">{error}</p>;
  }

  if (!svg) {
    return <div className="my-3 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" aria-hidden />;
  }

  return (
    <div
      className="blog-mermaid-diagram my-3 rounded-lg border-2 border-black bg-gray-50 dark:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-x-auto p-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

const MarkdownComponents = {
  code({ inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';

    if (!inline && lang === 'mermaid') {
      return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
    }

    return !inline ? (
      <div className="my-2 rounded-lg overflow-hidden border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] max-w-full">
        <pre className="p-2 overflow-x-auto bg-gray-900 dark:bg-black text-[11px] leading-snug">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    ) : (
      <code
        className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-black text-[11px] font-mono break-all"
        {...props}
      >
        {children}
      </code>
    );
  },
  h1({ children, ...props }: any) {
    return (
      <h2 className="text-sm font-black mt-4 mb-2 border-l-4 border-blue-500 pl-2 break-words" {...props}>
        {children}
      </h2>
    );
  },
  h2({ children, ...props }: any) {
    return (
      <h2 className="text-sm font-black mt-4 mb-2 border-l-4 border-blue-500 pl-2 break-words" {...props}>
        {children}
      </h2>
    );
  },
  h3({ children, ...props }: any) {
    return (
      <h3 className="text-xs font-black mt-3 mb-1.5 border-l-2 border-purple-500 pl-2 break-words" {...props}>
        {children}
      </h3>
    );
  },
  ul({ children, ...props }: any) {
    return (
      <ul className="my-2 space-y-0.5 list-none" {...props}>
        {children}
      </ul>
    );
  },
  li({ children, ...props }: any) {
    return (
      <li className="flex items-start gap-1.5 text-xs leading-snug" {...props}>
        <span className="text-blue-500 font-bold shrink-0">▸</span>
        <span className="flex-1 min-w-0 break-words">{children}</span>
      </li>
    );
  },
  p({ children, ...props }: any) {
    return (
      <p className="my-1.5 text-xs leading-relaxed text-gray-800 dark:text-gray-200 break-words" {...props}>
        {children}
      </p>
    );
  },
  blockquote({ children, ...props }: any) {
    return (
      <blockquote
        className="my-2 border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-r-lg text-xs break-words"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
};

export function BlogDetailPage() {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const { pathTo } = usePortfolio();
  const blogsPath = pathTo('/blogs');
  const categories = useBlogCategories();
  const blogs = useBlogData();
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const blog = blogs.find((b) => b.id === Number(blogId));

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24">
        <div className="text-center max-w-md">
          <h1 className="text-lg font-black mb-2">Blog not found</h1>
          <Button onClick={() => navigate(blogsPath)} size="sm">
            Back to Blogs
          </Button>
        </div>
      </div>
    );
  }

  const sameCategoryBlogs = blogs
    .filter((b) => b.category === blog.category && b.id !== blog.id)
    .slice(0, 3);

  const fallbackBlogs = blogs
    .filter((b) => b.category !== blog.category && b.id !== blog.id)
    .slice(0, Math.max(0, 3 - sameCategoryBlogs.length));

  const similarBlogs = [...sameCategoryBlogs, ...fallbackBlogs].slice(0, 3);
  const articleContent = stripLeadingMarkdownTitle(blog.content);

  const renderSidebarContent = (onAction?: () => void) => (
    <>
      <Card className="p-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 mb-3">
        <h3 className="text-xs font-black mb-2 text-gray-900 dark:text-gray-100">Categories</h3>
        <div className="space-y-1">
          {categories.filter((cat) => cat.id !== 'all').map((category) => {
            const categoryCount = blogs.filter((b) => b.category === category.id).length;
            const isActive = category.id === blog.category;

            return (
              <Button
                key={category.id}
                onClick={() => {
                  navigate(blogsPath);
                  onAction?.();
                }}
                className={`
                  w-full justify-between px-2 py-1 h-auto min-h-0 border-2 border-black
                  shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                  hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                  transition-all font-bold text-[11px]
                  ${
                    isActive
                      ? 'bg-black text-white'
                      : 'bg-white dark:bg-gray-900 text-black dark:text-white'
                  }
                `}
                style={{
                  borderLeftColor: isActive ? category.color : undefined,
                  borderLeftWidth: isActive ? '4px' : undefined,
                }}
              >
                <span className="truncate text-left">{category.label}</span>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] px-1 py-0 border ${isActive ? 'border-white text-white' : 'border-black'}`}
                >
                  {categoryCount}
                </Badge>
              </Button>
            );
          })}
        </div>
      </Card>

      <Card className="p-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900">
        <h3 className="text-xs font-black mb-2 text-gray-900 dark:text-gray-100">Quick Actions</h3>
        <div className="space-y-1">
          <Button
            onClick={() => {
              navigate(blogsPath);
              onAction?.();
            }}
            className="w-full justify-start px-2 py-1 h-auto border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-blue-500 hover:bg-blue-600 text-white font-bold text-[11px]"
          >
            <ArrowLeft className="w-3 h-3 mr-1 shrink-0" />
            All Blogs
          </Button>
          <Button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              onAction?.();
            }}
            className="w-full justify-start px-2 py-1 h-auto border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 text-black dark:text-white font-bold text-[11px]"
          >
            ↑ Back to Top
          </Button>
        </div>
      </Card>
    </>
  );

  return (
    <section className="min-h-screen pt-24 pb-12 px-4 sm:px-6 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between gap-3 mb-5">
          <Button
            onClick={() => navigate(blogsPath)}
            variant="outline"
            size="sm"
            className="shrink-0 px-3 py-1 h-8 text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-full"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Back
          </Button>

          <div className="xl:hidden">
            <Button
              onClick={() => setIsMobileActionsOpen((prev) => !prev)}
              size="sm"
              className="h-8 w-8 p-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900"
              aria-label="Toggle sidebar"
            >
              {isMobileActionsOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {isMobileActionsOpen && (
          <div className="xl:hidden mb-5">{renderSidebarContent(() => setIsMobileActionsOpen(false))}</div>
        )}

        <div className="flex flex-col xl:flex-row xl:gap-6 xl:items-start">
          <article className="min-w-0 flex-1 w-full">
            <header className="mb-4">
              <div
                className="w-full h-1.5 rounded-full mb-3 border-2 border-black"
                style={{ backgroundColor: blog.color }}
              />

              <h1 className="text-xl sm:text-2xl leading-snug mb-2 font-black text-gray-900 dark:text-gray-100 break-words">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-[11px] text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="font-semibold">{blog.author}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {blog.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  {blog.readTime}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {blog.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    className="border border-black font-semibold text-[10px] px-1.5 py-0 h-5"
                  >
                    <Tag className="w-2 h-2 mr-0.5" />
                    {tag}
                  </Badge>
                ))}
              </div>

              <Squiggle color={blog.color} />
            </header>

            <Card className="p-4 sm:p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 w-full overflow-hidden">
              <div className="blog-article-body text-xs leading-relaxed break-words overflow-x-hidden [&_*]:max-w-full [&_img]:h-auto [&_table]:block [&_table]:overflow-x-auto [&_table]:text-[11px]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={MarkdownComponents}
                >
                  {articleContent}
                </ReactMarkdown>
              </div>
            </Card>

            {similarBlogs.length > 0 && (
              <section className="mt-6">
                <h2 className="text-sm font-black mb-3 text-gray-900 dark:text-gray-100 border-l-4 border-purple-500 pl-2">
                  Similar Articles
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {similarBlogs.map((similarBlog) => (
                    <Card
                      key={similarBlog.id}
                      className="p-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow bg-white dark:bg-gray-900 cursor-pointer min-w-0"
                      onClick={() => {
                        navigate(pathTo(`/blogs/${similarBlog.id}`));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div
                        className="w-full h-1 rounded-full mb-2 border border-black"
                        style={{ backgroundColor: similarBlog.color }}
                      />
                      <h3 className="text-xs font-black mb-1 text-gray-900 dark:text-gray-100 line-clamp-2">
                        {similarBlog.title}
                      </h3>
                      <p className="text-[11px] text-gray-700 dark:text-gray-300 mb-2 line-clamp-2 leading-snug">
                        {similarBlog.excerpt}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock className="w-2.5 h-2.5" />
                        {similarBlog.readTime}
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="hidden xl:block w-52 shrink-0 sticky top-24">
            {renderSidebarContent()}
          </aside>
        </div>
      </div>
    </section>
  );
}

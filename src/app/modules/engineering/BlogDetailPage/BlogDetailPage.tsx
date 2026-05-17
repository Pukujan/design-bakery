import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, Tag, Calendar, User, Menu, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Squiggle, Star, BlobShape } from '../../../components/GraphicElements';
import { FlowerCharacter } from '../../../components/FlowerCharacter';
import { Cupcake, Donut } from '../../../components/BakeryItems';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import { useBlogCategories, useBlogData } from '../blogData';
import { usePortfolio } from '../../../portfolios/PortfolioContext';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});

// Mermaid diagram component
function MermaidDiagram({ chart }: { chart: string }) {
  useEffect(() => {
    mermaid.contentLoaded();
  }, [chart]);

  return (
    <div className="mermaid my-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {chart}
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
      <div className="my-6 rounded-2xl overflow-hidden border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <pre className="p-6 overflow-x-auto bg-gray-900 dark:bg-black">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    ) : (
      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border-2 border-black text-sm font-mono" {...props}>
        {children}
      </code>
    );
  },
  h2({ children, ...props }: any) {
    return (
      <h2 className="text-3xl font-black mt-12 mb-6 border-l-8 border-blue-500 pl-4" {...props}>
        {children}
      </h2>
    );
  },
  h3({ children, ...props }: any) {
    return (
      <h3 className="text-2xl font-black mt-8 mb-4 border-l-6 border-purple-500 pl-4" {...props}>
        {children}
      </h3>
    );
  },
  ul({ children, ...props }: any) {
    return (
      <ul className="my-6 space-y-2 list-none" {...props}>
        {children}
      </ul>
    );
  },
  li({ children, ...props }: any) {
    return (
      <li className="flex items-start gap-3" {...props}>
        <span className="text-blue-500 font-bold mt-1">▸</span>
        <span className="flex-1">{children}</span>
      </li>
    );
  },
  p({ children, ...props }: any) {
    return (
      <p className="my-4 leading-relaxed text-lg" {...props}>
        {children}
      </p>
    );
  },
  blockquote({ children, ...props }: any) {
    return (
      <blockquote className="my-6 border-l-8 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-r-2xl" {...props}>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black mb-4">Blog not found</h1>
          <Button onClick={() => navigate(blogsPath)}>Back to Blogs</Button>
        </div>
      </div>
    );
  }

  // Prefer same-category posts, then backfill with other categories so the section is always useful.
  const sameCategoryBlogs = blogs
    .filter((b) => b.category === blog.category && b.id !== blog.id)
    .slice(0, 3);

  const fallbackBlogs = blogs
    .filter((b) => b.category !== blog.category && b.id !== blog.id)
    .slice(0, Math.max(0, 3 - sameCategoryBlogs.length));

  const similarBlogs = [...sameCategoryBlogs, ...fallbackBlogs].slice(0, 3);

  const renderSidebarContent = (onAction?: () => void) => (
    <>
      <Card className="p-6 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 mb-6">
        <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-gray-100">
          Categories
        </h3>
        <div className="space-y-3">
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
            );
          })}
        </div>
      </Card>

      <Card className="p-6 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900">
        <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-gray-100">
          Quick Actions
        </h3>
        <div className="space-y-3">
          <Button
            onClick={() => {
              navigate(blogsPath);
              onAction?.();
            }}
            className="w-full justify-start px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-blue-500 hover:bg-blue-600 text-white font-black text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Blogs
          </Button>
          <Button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              onAction?.();
            }}
            className="w-full justify-start px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 text-black dark:text-white font-black text-sm"
          >
            ↑ Back to Top
          </Button>
        </div>
      </Card>
    </>
  );

  return (
    <section className="min-h-screen py-24 px-6 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 relative overflow-hidden">
      {/* Decorative Elements */}
      <BlobShape color="#9B6DD6" size={400} className="absolute -top-32 -right-40 opacity-20" />
      <BlobShape color="#4169E1" size={350} className="absolute bottom-20 -left-32 opacity-20" />

      <motion.div
        className="absolute top-32 right-20 hidden lg:block"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Cupcake size={70} animate={false} />
      </motion.div>

      <motion.div
        className="absolute bottom-40 left-20 hidden lg:block"
        animate={{ y: [0, 15, 0], rotate: [0, 360, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <Donut size={80} animate={false} />
      </motion.div>

      <motion.div
        className="absolute top-20 left-32"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <Star color="#9B6DD6" size={50} />
      </motion.div>

      <div className="absolute top-40 left-10 hidden md:block">
        <FlowerCharacter color="#4169E1" size={70} animate />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Mobile side actions menu (below navbar) */}
        <div className="lg:hidden fixed top-28 right-10 mb-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setIsMobileActionsOpen((prev) => !prev)}
              className="h-12 w-12 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 text-black dark:text-white p-0"
              aria-label="Toggle categories and quick actions"
            >
              {isMobileActionsOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {isMobileActionsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3"
            >
              {renderSidebarContent(() => setIsMobileActionsOpen(false))}
            </motion.div>
          )}
        </div>

        {/* Sticky Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-28 md:top-28 mb-8"
        >
          <Button
            onClick={() => navigate(blogsPath)}
            className="px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-yellow-400 hover:bg-yellow-500 text-black font-black rounded-full"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </motion.div>

        <div className="grid max-w-7xl lg:grid-cols-[1fr_200px] gap-8">
          {/* Main Content */}
          <div>
            {/* Blog Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="my-30"
            >
              <div
                className="w-full h-4 rounded-full mb-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                style={{ backgroundColor: blog.color }}
              />

              <h1 className="text-[clamp(3rem,6vw,5rem)] leading-none mb-6 font-black text-gray-900 dark:text-gray-100">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span className="font-bold">{blog.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{blog.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{blog.readTime}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    className="border-3 border-black font-bold text-sm px-3 py-1"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              <Squiggle color={blog.color} />
            </motion.div>

            {/* Blog Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-8 md:p-12 border-6 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900">
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={MarkdownComponents}
                  >
                    {blog.content}
                  </ReactMarkdown>
                </div>
              </Card>
            </motion.div>

            {/* Similar Blogs Section */}
            {similarBlogs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-16"
              >
                <h2 className="text-4xl font-black mb-8 text-gray-900 dark:text-gray-100 border-l-8 border-purple-500 pl-4">
                  Similar Articles
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {similarBlogs.map((similarBlog) => (
                    <Card
                      key={similarBlog.id}
                      className="p-6 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900 group cursor-pointer"
                      onClick={() => {
                        navigate(pathTo(`/blogs/${similarBlog.id}`));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div
                        className="w-full h-3 rounded-full mb-4 border-2 border-black"
                        style={{ backgroundColor: similarBlog.color }}
                      />
                      <h3 className="text-xl font-black mb-3 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {similarBlog.title}
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed line-clamp-3">
                        {similarBlog.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{similarBlog.readTime}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Fixed Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="sticky top-36">
              {renderSidebarContent()}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

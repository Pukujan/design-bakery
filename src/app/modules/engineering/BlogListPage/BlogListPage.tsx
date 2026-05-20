/** Blog motion: guidelines/agent-devlog-blog-motion.md — decor via BlogPageMotion */
import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Squiggle } from '../../../components/GraphicElements';
import {
  BlogPageDecor,
  PlayfulBlogTitle,
  blogButtonMotion,
  blogCardMotion,
} from '../../../components/BlogPageMotion';
import { useBlogCategories, useBlogData } from '../blogData';
import { usePortfolio } from '../../../portfolios/PortfolioContext';

export function BlogListPage() {
  const navigate = useNavigate();
  const { pathTo, config } = usePortfolio();
  const categories = useBlogCategories();
  const { blogs } = useBlogData();
  const [selectedCategory, setSelectedCategory] = useState(config.defaultBlogCategory);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const dragStartRef = useRef(false);

  const filteredBlogs =
    selectedCategory === 'all'
      ? blogs
      : blogs.filter((blog) => blog.category === selectedCategory);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    dragStartRef.current = false;
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    if (Math.abs(walk) > 5) {
      dragStartRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => {
      dragStartRef.current = false;
    }, 50);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 relative overflow-hidden min-h-screen">
      <BlogPageDecor variant="list" seed={`blogs-${selectedCategory}`} />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none mb-4 font-black">
            <PlayfulBlogTitle
              text="BLOGS"
              className="text-purple-600 dark:text-purple-400"
            />
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Deep dives into systems thinking, AI workflows, and engineering
            decision-making
          </p>
          <Squiggle color="#4169E1" className="mx-auto" />
        </motion.div>

        {/* Swipable Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="relative overflow-hidden">
            <div
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              className="flex gap-4 overflow-x-auto p-2 scrollbar-hide snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none"
            >
              {categories.map((category) => (
                <motion.div key={category.id} {...blogButtonMotion} className="snap-start">
                  <Button
                    onClick={(e) => {
                      if (dragStartRef.current) {
                        e.preventDefault();
                        return;
                      }
                      setSelectedCategory(category.id);
                    }}
                    className={`
                      px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                      hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                      transition-all font-black text-base rounded-full whitespace-nowrap
                      ${
                        selectedCategory === category.id
                          ? 'text-white'
                          : 'bg-white dark:bg-gray-900 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                    style={{
                      backgroundColor:
                        selectedCategory === category.id
                          ? category.color
                          : undefined,
                    }}
                  >
                    {category.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Blogs Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {filteredBlogs.map((blog, idx) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              {...blogCardMotion}
            >
              <Card
                onClick={() => navigate(pathTo(`/blogs/${blog.id}`))}
                className="h-full p-6 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900 group cursor-pointer"
              >
                <div
                  className="w-full h-3 rounded-full mb-6 border-2 border-black"
                  style={{ backgroundColor: blog.color }}
                />

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{blog.readTime}</span>
                  </div>
                  <span>•</span>
                  <span>{blog.date}</span>
                </div>

                <h3 className="text-2xl font-black mb-4 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {blog.title}
                </h3>

                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  {blog.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {blog.tags.map((tag, tIdx) => (
                    <Badge
                      key={tIdx}
                      variant="outline"
                      className="border-2 border-black font-bold text-xs"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  className="group/btn p-0 h-auto font-bold text-blue-600 dark:text-blue-400 hover:bg-transparent w-full justify-start"
                >
                  Read Full Article
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

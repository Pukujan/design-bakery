import { motion } from "motion/react";
import {
  ArrowRight,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Squiggle, Star, BlobShape } from "../../../components/GraphicElements";
import { FlowerCharacter } from "../../../components/FlowerCharacter";
import { Cupcake, IceCream } from "../../../components/BakeryItems";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useBlogCategories, useBlogData } from "../blogData";
import { usePortfolio } from "../../../portfolios/PortfolioContext";

const ITEMS_PER_PAGE = 3;

export function EngineeringInsights() {
  const { pathTo } = usePortfolio();
  const categories = useBlogCategories();
  const insights = useBlogData();
  const [selectedCategory, setSelectedCategory] =
    useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const dragStartRef = useRef(false);

  const filteredInsights =
    selectedCategory === "all"
      ? insights
      : insights.filter(
          (insight) => insight.category === selectedCategory,
        );

  const totalPages = Math.ceil(
    filteredInsights.length / ITEMS_PER_PAGE,
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedInsights = filteredInsights.slice(
    startIndex,
    endIndex,
  );

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

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
    <section
      id="insights"
      className="py-24 px-6 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 relative overflow-hidden"
    >
      {/* Decorative Elements */}
      <BlobShape
        color="#9B6DD6"
        size={400}
        className="absolute -top-32 -right-40 opacity-20"
      />
      <BlobShape
        color="#4169E1"
        size={350}
        className="absolute bottom-20 -left-32 opacity-20"
      />
      <BlobShape
        color="#FF6B9D"
        size={300}
        className="absolute top-1/2 left-1/4 opacity-15"
      />

      {/* Floating Items */}
      <motion.div
        className="absolute top-32 right-32 hidden lg:block"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Cupcake size={80} animate={false} />
      </motion.div>

      <motion.div
        className="absolute bottom-40 left-32 hidden lg:block"
        animate={{ y: [0, 20, 0], rotate: [-5, 5, -5] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <IceCream size={85} animate={false} />
      </motion.div>

      {/* Stars */}
      <motion.div
        className="absolute top-20 left-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity }}
      >
        <Star color="#9B6DD6" size={50} />
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-20"
        animate={{ rotate: -360, scale: [1, 1.2, 1] }}
        transition={{ duration: 15, repeat: Infinity }}
      >
        <Star color="#4169E1" size={45} />
      </motion.div>

      {/* Flowers */}
      <div className="absolute top-40 left-10 hidden md:block">
        <FlowerCharacter color="#9B6DD6" size={70} animate />
      </div>
      <div className="absolute bottom-20 right-10 hidden md:block">
        <FlowerCharacter color="#4169E1" size={75} animate />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none mb-4 font-black">
            <span className="text-purple-600 dark:text-purple-400">
              BLOGS
            </span>
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Deep technical write-ups, research papers, and
            comprehensive guides
          </p>
          <Squiggle color="#4169E1" className="mx-auto" />
        </motion.div>

        {/* Category Filter with View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-center mb-12"
        >
          {/* View All Button - Always Visible */}
          <Link to={pathTo('/blogs')}>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="text-white px-6 py-3 bg-purple-400 hover:bg-purple-500 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-md group w-full lg:w-auto whitespace-nowrap">
                View All Blogs
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </Link>

          {/* Scrollable Category Buttons */}
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
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="snap-start"
                >
                  <Button
                    onClick={(e) => {
                      if (dragStartRef.current) {
                        e.preventDefault();
                        return;
                      }
                      handleCategoryChange(category.id);
                    }}
                    className={`
                      px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                      hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                      transition-all font-black text-base rounded-full whitespace-nowrap
                      ${
                        selectedCategory === category.id
                          ? "text-white"
                          : "bg-white dark:bg-gray-900 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
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

        {/* Insights Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {paginatedInsights.map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <Card className="h-full p-6 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900 group">
                <div
                  className="w-full h-3 rounded-full mb-6 border-2 border-black"
                  style={{ backgroundColor: insight.color }}
                />

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{insight.readTime}</span>
                  </div>
                  <span>•</span>
                  <span>{insight.date}</span>
                </div>

                <h3 className="text-2xl font-black mb-4 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {insight.title}
                </h3>

                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  {insight.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {insight.tags.map((tag, tIdx) => (
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

                <Link to={pathTo(`/blogs/${insight.id}`)}>
                  <Button
                    variant="ghost"
                    className="group/btn p-0 h-auto font-bold text-blue-600 dark:text-blue-400 hover:bg-transparent"
                  >
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-4"
          >
            <Button
              onClick={() =>
                setCurrentPage((p) => Math.max(1, p - 1))
              }
              disabled={currentPage === 1}
              className="px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed font-black rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from(
                { length: totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`
                    w-12 h-12 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-black
                    ${
                      currentPage === page
                        ? "bg-purple-600 text-white"
                        : "bg-white dark:bg-gray-900 text-black dark:text-white"
                    }
                  `}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(totalPages, p + 1),
                )
              }
              disabled={currentPage === totalPages}
              className="px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed font-black rounded-full"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
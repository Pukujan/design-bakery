import { motion, AnimatePresence } from "motion/react";
import {
  ExternalLink,
  Users,
  TrendingUp,
  Award,
  Github,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Squiggle, Star, BlobShape } from "./GraphicElements";
import { FlowerCharacter } from "./FlowerCharacter";
import { Cupcake, Donut, Cookie, IceCream } from "./BakeryItems";
import { useState, useRef, useEffect } from "react";

const allProjects = [
  {
    id: 1,
    title: "Ekagajpatra",
    tagline: "Civic Tech Platform",
    description: "Architected and built a scalable platform serving 35,000+ users, transforming complex documentation into guided workflows with validation, PDF generation, and multi-role dashboards.",
    tech: ["Next.js", "React", "TypeScript", "PostgreSQL"],
    color: "#4169E1",
    accentColor: "#FFD93D",
    stats: [
      { label: "35K+ Users", icon: Users },
      { label: "99% Cost Cut", icon: TrendingUp },
      { label: "5 Awards", icon: Award },
    ],
    links: [
      { label: "Live Platform", url: "https://www.ekagajpatra.com" },
      { label: "Case Study", url: "https://follow-smog-96608767.figma.site" },
      { label: "Frontend Study", url: "https://mock-flee-81526355.figma.site" },
    ],
  },
  {
    id: 2,
    title: "InvestAI",
    tagline: "AI Financial Platform",
    description: "Built a working MVP financial learning platform using AI for sentiment analysis and market credibility evaluation, tested by 10+ financial experts.",
    tech: ["AI/ML", "Next.js", "Python", "OpenAI"],
    color: "#A8CC00",
    accentColor: "#FF6B9D",
    stats: [
      { label: "Live MVP", icon: Sparkles },
      { label: "10+ Experts", icon: Users },
      { label: "AI-Powered", icon: TrendingUp },
    ],
    links: [
      { label: "View Demo", url: "https://financial-investment-with-gemini-in.vercel.app/" },
      { label: "GitHub", url: "https://github.com/Pukujan/financial-investment-with-gemini-insights" },
      { label: "Case Study", url: "https://portal-genre-93680338.figma.site" },
    ],
  },
  {
    id: 3,
    title: "AI Workflow System",
    tagline: "Agentic AI Orchestration",
    description: "Multi-agent orchestration with RAG pipelines and real-time streaming for complex automation tasks.",
    tech: ["OpenAI", "OpenRouter", "React", "TypeScript"],
    color: "#9B6DD6",
    accentColor: "#FF8C42",
    stats: [
      { label: "Multi-Agent", icon: Sparkles },
      { label: "RAG Pipeline", icon: TrendingUp },
      { label: "Real-time", icon: Award },
    ],
    links: [],
  },
  {
    id: 4,
    title: "SaaS Dashboard",
    tagline: "Multi-Tenant Platform",
    description: "Enterprise admin system for legal, financial, and business clients with role-based access and advanced analytics.",
    tech: ["Next.js", "PostgreSQL", "Redux", "TailwindCSS"],
    color: "#FF6B9D",
    accentColor: "#A8CC00",
    stats: [
      { label: "Multi-Tenant", icon: Users },
      { label: "Analytics", icon: TrendingUp },
      { label: "RBAC", icon: Award },
    ],
    links: [],
  },
];

export function EngineeringProjects() {
  const [startIndex, setStartIndex] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [shouldScroll, setShouldScroll] = useState(false);
  const featuredCardRef = useRef<HTMLDivElement>(null);

  const visibleProjects = allProjects.slice(startIndex, startIndex + 4);
  const canGoPrev = startIndex > 0;
  const canGoNext = startIndex + 4 < allProjects.length;

  useEffect(() => {
    if (shouldScroll && featuredCardRef.current) {
      setTimeout(() => {
        featuredCardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        setShouldScroll(false);
      }, 350);
    }
  }, [shouldScroll, featuredIndex, startIndex]);

  const handlePrev = () => {
    if (canGoPrev) {
      setStartIndex(startIndex - 4);
      setFeaturedIndex(0);
      setShouldScroll(true);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setStartIndex(startIndex + 4);
      setFeaturedIndex(0);
      setShouldScroll(true);
    }
  };

  const handleProjectClick = (index: number) => {
    setFeaturedIndex(index);
    setShouldScroll(true);
  };

  const featuredProject = visibleProjects[featuredIndex];
  const otherProjects = visibleProjects.filter((_, idx) => idx !== featuredIndex);

  return (
    <section
      id="projects"
      className="py-24 px-6 bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 dark:from-yellow-950 dark:via-pink-950 dark:to-purple-950 relative overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <BlobShape color="#FFD93D" size={400} className="absolute top-20 -left-32 opacity-20" />
      <BlobShape color="#FF6B9D" size={350} className="absolute bottom-40 -right-20 opacity-20" />
      <BlobShape color="#9B6DD6" size={300} className="absolute top-1/2 right-1/4 opacity-15" />

      {/* Floating Bakery Items */}
      <motion.div
        className="absolute top-32 right-20 hidden lg:block"
        animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Cupcake size={80} animate={false} />
      </motion.div>

      <motion.div
        className="absolute bottom-32 left-20 hidden lg:block"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Donut size={90} animate={false} />
      </motion.div>

      <motion.div
        className="absolute top-1/3 left-1/4 hidden lg:block"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Cookie size={70} animate={false} />
      </motion.div>

      <motion.div
        className="absolute bottom-1/4 right-1/3 hidden lg:block"
        animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <IceCream size={75} animate={false} />
      </motion.div>

      {/* Stars */}
      <motion.div
        className="absolute top-20 right-1/4"
        animate={{ rotate: 360, y: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <Star color="#FFD93D" size={50} />
      </motion.div>

      <motion.div
        className="absolute bottom-40 left-1/3"
        animate={{ rotate: -360, scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      >
        <Star color="#FF6B9D" size={40} />
      </motion.div>

      {/* Flowers */}
      <div className="absolute top-40 left-10 hidden md:block">
        <FlowerCharacter color="#FF6B9D" size={70} animate />
      </div>
      <div className="absolute bottom-20 right-16 hidden md:block">
        <FlowerCharacter color="#A8CC00" size={80} animate />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none mb-4 font-black">
            <span className="text-pink-600 dark:text-pink-400">ENGINEERING</span>{' '}
            <span className="text-purple-600 dark:text-purple-400">PROJECTS</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Systems built for scale, reliability, and real-world impact
          </p>
          <Squiggle color="#FF6B9D" className="mx-auto" />
        </motion.div>

        {/* Project Cards */}
        <div className="relative">
          {/* Featured Active Project */}
          <AnimatePresence mode="wait">
            <motion.div
              key={featuredProject.id}
              initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: -50, scale: 0.9, rotateX: 15 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
              className="mb-8"
            >
              {(() => {
                const Icon = featuredProject.stats[0].icon;
                return (
                  <motion.div
                    ref={featuredCardRef}
                    className="rounded-[40px] p-8 md:p-12 border-6 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
                    style={{ backgroundColor: featuredProject.color }}
                    whileHover={{ scale: 1.02, rotate: 0.5 }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="w-16 h-16 rounded-full border-4 border-black flex items-center justify-center"
                          style={{ backgroundColor: featuredProject.accentColor }}
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          <Icon className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                          <h3 className="text-3xl md:text-4xl font-black text-white">
                            {featuredProject.title}
                          </h3>
                          <p className="text-lg font-bold text-white/90">
                            {featuredProject.tagline}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, 0]
                        }}
                        transition={{
                          scale: { duration: 2, repeat: Infinity },
                          rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="bg-white/90 px-4 py-2 rounded-full border-3 border-black hidden md:block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <p className="text-sm font-black text-gray-900">⭐ FEATURED</p>
                      </motion.div>
                    </div>

                    <p className="text-white/90 text-lg mb-8 leading-relaxed">
                      {featuredProject.description}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {featuredProject.stats.map((stat, idx) => {
                        const StatIcon = stat.icon;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border-3 border-white/40 text-center"
                          >
                            <StatIcon className="w-6 h-6 text-white mx-auto mb-2" />
                            <p className="text-sm font-bold text-white">{stat.label}</p>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      {featuredProject.tech.map((tech, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + idx * 0.05, type: "spring" }}
                          whileHover={{ scale: 1.15, rotate: Math.random() * 10 - 5 }}
                        >
                          <Badge className="px-4 py-2 bg-white/90 text-gray-900 text-sm font-bold border-3 border-black rounded-full">
                            {tech}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    {featuredProject.links.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {featuredProject.links.map((link, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + idx * 0.1 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              asChild
                              className={`
                                px-6 py-3 rounded-full border-3 border-black
                                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                                transition-all group font-black
                                ${idx === 0 ? 'bg-white text-gray-900' : 'bg-white/20 text-white border-white/40'}
                              `}
                            >
                              <a href={link.url} target="_blank" rel="noopener noreferrer">
                                {link.label.includes('GitHub') ? (
                                  <Github className="mr-2 h-4 w-4" />
                                ) : (
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                )}
                                {link.label}
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                              </a>
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })()}
            </motion.div>
          </AnimatePresence>

          {/* Inactive Projects Carousel */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`${startIndex}-${featuredIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              {otherProjects.map((project, index) => {
                const Icon = project.stats[0].icon;
                const actualIndex = visibleProjects.findIndex(p => p.id === project.id);
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 30, scale: 0.8, rotate: -10 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                    transition={{ delay: index * 0.15, type: "spring", bounce: 0.4 }}
                    whileHover={{ y: -15, scale: 1.08, rotate: 2 }}
                    whileTap={{ scale: 0.92, rotate: 5 }}
                    className="cursor-pointer"
                    onClick={() => handleProjectClick(actualIndex)}
                  >
                    <motion.div
                      className="h-full rounded-[32px] p-6 border-5 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden"
                      style={{ backgroundColor: project.color }}
                      whileHover="hover"
                    >
                      {/* Shine effect on hover */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: "-100%" }}
                        variants={{
                          hover: {
                            x: "100%",
                            transition: { duration: 0.6 }
                          }
                        }}
                      />
                      <div className="flex items-center gap-3 mb-4 relative z-10">
                        <motion.div
                          className="w-12 h-12 rounded-full border-3 border-black flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: project.accentColor }}
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-black text-white truncate">
                            {project.title}
                          </h3>
                          <p className="text-sm font-bold text-white/90 truncate">
                            {project.tagline}
                          </p>
                        </div>
                      </div>

                      <p className="text-white/80 text-sm line-clamp-2 mb-4 relative z-10">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap gap-2 relative z-10">
                        {project.tech.slice(0, 3).map((tech, idx) => (
                          <Badge
                            key={idx}
                            className="px-2 py-1 bg-white/20 text-white text-xs font-bold border-2 border-white/40 rounded-full"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {project.tech.length > 3 && (
                          <Badge className="px-2 py-1 bg-white/20 text-white text-xs font-bold border-2 border-white/40 rounded-full">
                            +{project.tech.length - 3}
                          </Badge>
                        )}
                      </div>

                      <motion.div
                        className="mt-4 text-center relative z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.p
                          className="text-xs font-black text-white/70"
                          animate={{ y: [0, -3] }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                        >
                          Click to Expand
                        </motion.p>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.2, rotate: -10, x: -5 }}
              whileTap={{ scale: 0.85 }}
              animate={canGoPrev ? {
                x: [-3, -3],
                rotate: [0, -5]
              } : {}}
              transition={{
                x: { duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" },
                rotate: { duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }
              }}
            >
              <Button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="w-16 h-16 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-br from-yellow-400 to-pink-400 text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-black transition-all"
              >
                <motion.div
                  animate={{ x: [-2, -2] }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                >
                  <ChevronLeft className="w-7 h-7" />
                </motion.div>
              </Button>
            </motion.div>

            <motion.div
              key={startIndex}
              initial={{ scale: 0.8, rotate: -180 }}
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, 5, 0]
              }}
              whileHover={{ scale: 1.15, rotate: 10 }}
              transition={{
                scale: { duration: 2, repeat: Infinity },
                rotate: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-white text-lg bg-[length:200%_100%] animate-[gradient_3s_ease_infinite]"
            >
              {Math.floor(startIndex / 4) + 1} / {Math.ceil(allProjects.length / 4)}
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.2, rotate: 10, x: 5 }}
              whileTap={{ scale: 0.85 }}
              animate={canGoNext ? {
                x: [3, 3],
                rotate: [0, 5]
              } : {}}
              transition={{
                x: { duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" },
                rotate: { duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }
              }}
            >
              <Button
                onClick={handleNext}
                disabled={!canGoNext}
                className="w-16 h-16 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-br from-pink-400 to-purple-400 text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-black transition-all"
              >
                <motion.div
                  animate={{ x: [2, 2] }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                >
                  <ChevronRight className="w-7 h-7" />
                </motion.div>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

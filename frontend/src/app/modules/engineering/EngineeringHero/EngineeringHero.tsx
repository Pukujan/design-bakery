import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Code, Terminal, Cpu } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { BlobShape, Star } from '../../../components/GraphicElements';
import { useEngineeringHeroSection } from '../../../lib/contentHooks';
import { usePortfolio } from '../../../portfolios/PortfolioContext';
import { openExperience } from '../../../lib/openExperience';
import { openFeaturedProject } from '../../../lib/openFeaturedProject';

export function EngineeringHero() {
  const content = useEngineeringHeroSection();
  const { portfolioId } = usePortfolio();

  useEffect(() => {
    console.log('[hero:render]', {
      portfolioId,
      badge: content.badge,
      titleLine1: content.titleLine1,
      titleLine2: content.titleLine2,
    });
  }, [content.badge, content.titleLine1, content.titleLine2, portfolioId]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 pt-20">
      {/* Animated Background Shapes */}
      <BlobShape color="#4169E1" size={350} className="absolute top-10 -left-20 opacity-20" />
      <BlobShape color="#9B6DD6" size={280} className="absolute bottom-20 -right-10 opacity-30" />
      <BlobShape color="#FFD93D" size={220} className="absolute top-1/3 right-1/4 opacity-15" />
      
      {/* Decorative Elements */}
      <motion.div
        className="absolute top-32 left-20 hidden lg:block"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Star color="#FFD93D" size={50} />
      </motion.div>

      <motion.div
        className="absolute bottom-40 left-1/4 hidden lg:block"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Code className="w-16 h-16 text-blue-300" />
      </motion.div>

      <motion.div
        className="absolute top-1/3 right-20 hidden lg:block"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Terminal className="w-14 h-14 text-purple-300" />
      </motion.div>

      <motion.div
        className="absolute bottom-1/3 right-1/3 hidden lg:block"
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <Cpu className="w-12 h-12 text-indigo-300" />
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className="inline-block mb-6 px-6 py-3 bg-yellow-400 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-black font-bold text-sm tracking-wide">
              {content.badge}
            </p>
          </motion.div>

          <h1 className="text-[clamp(2.5rem,3vw,5.5rem)] leading-[1.1] mb-8 text-white">
            {content.titleLine1}
            <br />
            <span className="text-yellow-300">
              {content.titleLine2}
            </span>
          </h1>

          <p className="text-lg md:text-lg mb-4 text-white/95 max-w-4xl mx-auto leading-relaxed">
            {content.description}
          </p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Button
              size="lg"
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-6 rounded-full group border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-lg font-bold"
            >
              {content.primaryCtaLabel}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
           
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            {content.stats.map((stat, idx) => {
              const isExperienceLink =
                typeof stat.experienceId === 'number' && stat.experienceId > 0;
              const isProjectLink =
                typeof stat.projectId === 'number' && stat.projectId > 0;
              const isClickable = isExperienceLink || isProjectLink;
              const StatWrapper = isClickable ? 'button' : 'div';
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  className={isClickable ? 'cursor-pointer' : ''}
                >
                  <StatWrapper
                    type={isClickable ? 'button' : undefined}
                    className={`w-full text-left bg-white/10 backdrop-blur-md border-4 border-white/30 rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transition-colors ${
                      isClickable
                        ? 'hover:bg-white/20 hover:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300'
                        : ''
                    }`}
                    onClick={
                      isExperienceLink
                        ? () => openExperience(stat.experienceId!)
                        : isProjectLink
                          ? () => openFeaturedProject(stat.projectId!)
                          : undefined
                    }
                    aria-label={
                      isExperienceLink
                        ? `${stat.value} ${stat.label} — view experience details`
                        : isProjectLink
                          ? `${stat.value} ${stat.label} — view featured project`
                          : undefined
                    }
                  >
                    <p className="text-3xl md:text-4xl font-black text-yellow-300 mb-2">
                      {stat.value}
                    </p>
                    <p className="text-white/90 font-medium">{stat.label}</p>
                  </StatWrapper>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

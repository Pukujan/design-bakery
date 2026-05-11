import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, ChevronDown, Zap, Sparkles, Rocket } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Squiggle, Star, BlobShape } from './GraphicElements';
import { FlowerCharacter } from './FlowerCharacter';
import { Cupcake, Cookie } from './BakeryItems';
import { useRelevantExperienceContent } from '../lib/contentHooks';
import { resolveIcon } from '../lib/iconResolver';

/**
 * Create a gradient string from two hex colors at 135 degrees
 */
function createGradient(color: string, accentColor: string): string {
  return `linear-gradient(135deg, ${color} 0%, ${accentColor} 100%)`;
}

export function RelevantExperience() {
  const content = useRelevantExperienceContent();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const expandedRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Smooth scroll to expanded card
  useEffect(() => {
    if (expandedId !== null && expandedRefs.current[expandedId]) {
      setTimeout(() => {
        expandedRefs.current[expandedId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [expandedId]);

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-blue-100 via-purple-100 to-green-100 dark:from-blue-950 dark:via-purple-950 dark:to-green-950 relative overflow-hidden">
      {/* Decorative Elements */}
      <BlobShape
        color="#A8C5FF"
        size={400}
        className="absolute -top-32 -right-40 opacity-20"
      />
      <BlobShape
        color="#B5A8FF"
        size={350}
        className="absolute bottom-20 -left-32 opacity-20"
      />
      <BlobShape
        color="#A8FFD4"
        size={300}
        className="absolute top-1/2 right-1/4 opacity-15"
      />

      {/* Floating Items */}
      <motion.div
        className="absolute top-32 right-32 hidden lg:block"
        animate={{ y: [0, -15] }}
        transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      >
        <Cupcake size={80} animate={false} />
      </motion.div>

      <motion.div
        className="absolute bottom-40 left-32 hidden lg:block"
        animate={{ y: [0, 20], rotate: [0, 5] }}
        transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      >
        <Cookie size={85} animate={false} />
      </motion.div>

      {/* Stars */}
      <motion.div
        className="absolute top-20 left-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      >
        <Star color="#A8C5FF" size={50} />
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-20"
        animate={{ rotate: -360, scale: [1, 1.2] }}
        transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
      >
        <Star color="#B5A8FF" size={45} />
      </motion.div>

      {/* Flowers */}
      <div className="absolute top-40 left-10 hidden md:block">
        <FlowerCharacter color="#A8FFD4" size={70} animate />
      </div>
      <div className="absolute bottom-20 right-10 hidden md:block">
        <FlowerCharacter color="#FFB8E8" size={75} animate />
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
            <span className="text-blue-600 dark:text-blue-400">
              {content.headingLeft}
            </span>{' '}
            <span className="text-purple-600 dark:text-purple-400">
              {content.headingRight}
            </span>
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            {content.subtitle}
          </p>
          <Squiggle color="#A8C5FF" className="mx-auto mb-6" />
        </motion.div>

        {/* Experience Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {content.experiences.map((experience) => {
            const isExpanded = expandedId === experience.id;
            const gradient = createGradient(experience.color, experience.accentColor);
            const IconComponent = resolveIcon(experience.icon, Rocket);

            return (
              <motion.div
                key={experience.id}
                ref={(el) => {
                  if (el) expandedRefs.current[experience.id] = el;
                }}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={isExpanded ? 'md:col-span-2' : ''}
              >
                <Card className="p-6 md:p-8 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900 relative overflow-hidden h-full">
                  {/* Color Bar with Gradient */}
                  <div
                    className="w-full h-4 rounded-full mb-6 border-3 border-black"
                    style={{ background: gradient }}
                  />

                  {/* Sparkle Decoration */}
                  <motion.div
                    className="absolute top-8 right-8"
                    animate={{ rotate: [0, 360], scale: [1, 1.3] }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                  >
                    <Zap className="w-10 h-10 opacity-20" style={{ color: experience.color }} />
                  </motion.div>

                  {/* Header */}
                  <div className="flex flex-col gap-4 mb-4">
                    <div className="flex-1">
                      <motion.div
                        className="flex items-center gap-4 mb-3"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.div
                          className="p-3 rounded-2xl border-4 border-black"
                          style={{ background: gradient }}
                          animate={{ rotate: [0, 5], scale: [1, 1.05] }}
                          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        >
                          <IconComponent className="w-8 h-8 text-black" />
                        </motion.div>
                        <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100">
                          {experience.company}
                        </h3>
                      </motion.div>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 ml-1">
                        {experience.role}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 ml-1">
                        <motion.div
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black bg-gray-50 dark:bg-gray-800"
                          whileHover={{ scale: 1.08, y: -2 }}
                        >
                          <Calendar className="w-4 h-4" />
                          <span className="font-bold text-sm">{experience.period}</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black bg-gray-50 dark:bg-gray-800"
                          whileHover={{ scale: 1.08, y: -2 }}
                        >
                          <MapPin className="w-4 h-4" />
                          <span className="font-bold text-sm">{experience.location}</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Collapsed Summary */}
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-6">
                    {experience.collapsedSummary}
                  </p>

                  {/* Expand Button */}
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full"
                  >
                    <Button
                      onClick={() => toggleExpanded(experience.id)}
                      className="w-full px-6 py-5 border-5 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black font-black text-base rounded-2xl transition-all relative overflow-hidden"
                      style={{
                        background: gradient,
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div
                        animate={{ y: isExpanded ? [0, -3] : [0, 3] }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                        className="inline-block"
                      >
                        <ChevronDown
                          className={`w-6 h-6 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </motion.div>
                      <span className="mx-3 relative z-10">
                        {isExpanded ? 'Hide Details' : 'Show Full Details'}
                      </span>
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.3] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        className="inline-block"
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                    </Button>
                  </motion.div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, maxHeight: 0 }}
                        animate={{ opacity: 1, maxHeight: 800 }}
                        exit={{ opacity: 0, maxHeight: 0 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 border-t-4 border-black mt-6">
                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-800 dark:text-gray-200 leading-relaxed text-base mb-6 font-medium"
                          >
                            {experience.expandedSummary}
                          </motion.p>

                          {/* Highlights */}
                          <div className="mb-6">
                            <motion.h4
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                              className="text-xl font-black mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2"
                            >
                              <Sparkles className="w-5 h-5" style={{ color: experience.color }} />
                              Key Highlights
                            </motion.h4>
                            <ul className="space-y-3">
                              {experience.highlights.map((highlight, hIdx) => (
                                <motion.li
                                  key={hIdx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.4 + hIdx * 0.1 }}
                                  className="flex items-start gap-3 p-3 rounded-xl border-3 border-black bg-gray-50 dark:bg-gray-800"
                                  whileHover={{ x: 5, scale: 1.02 }}
                                >
                                  <motion.span
                                    className="font-bold mt-0.5 text-2xl"
                                    style={{ color: experience.color }}
                                    animate={{ scale: [1, 1.2] }}
                                    transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                                  >
                                    ✦
                                  </motion.span>
                                  <span className="text-gray-700 dark:text-gray-300 leading-relaxed flex-1 text-sm">
                                    {highlight}
                                  </span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {experience.tags.map((tag, tIdx) => (
                              <motion.div
                                key={tIdx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.1, y: -2 }}
                                transition={{ delay: 0.6 + tIdx * 0.03 }}
                              >
                                <Badge
                                  className="border-3 border-black font-bold text-sm px-4 py-2"
                                  style={{
                                    background: gradient,
                                  }}
                                >
                                  {tag}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

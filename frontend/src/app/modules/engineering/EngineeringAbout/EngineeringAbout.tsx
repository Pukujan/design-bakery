import { motion } from 'motion/react';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { Squiggle, Star, BlobShape } from '../../../components/GraphicElements';
import { Code, Zap, Shield } from 'lucide-react';
import { useEngineeringAboutSection } from '../../../lib/contentHooks';

const iconMap = {
  Code,
  Shield,
  Zap,
} as const;

export function EngineeringAbout() {
  const content = useEngineeringAboutSection();

  return (
    <section
      id="about"
      className="py-24 px-6 bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 dark:from-indigo-950 dark:via-blue-950 dark:to-purple-950 relative overflow-hidden"
    >
      {/* Decorative blobs */}
      <BlobShape
        color="#4169E1"
        size={250}
        className="absolute top-0 -left-20 opacity-20"
      />
      <BlobShape
        color="#9B6DD6"
        size={200}
        className="absolute bottom-0 -right-20 opacity-20"
      />

      {/* Floating stars */}
      <motion.div
        className="absolute top-20 right-1/4"
        animate={{ rotate: 360, y: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
      >
        <Star color="#FFD93D" size={40} />
      </motion.div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none mb-4 font-black">
            <span className="text-blue-600 dark:text-blue-400">{content.headingLeft}</span>{' '}
            <span className="text-purple-600 dark:text-purple-400">{content.headingRight}</span>
          </h2>
          <Squiggle color="#4169E1" className="mx-auto" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Portrait with playful styling */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border-6 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-blue-200 transform hover:rotate-2 transition-all">
              <ImageWithFallback
                src={content.portraitUrl}
                alt="Portrait"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              {content.brandLine ? (
                <p className="text-3xl font-black mb-2 text-gray-900 dark:text-gray-100">
                  {content.brandLine}
                </p>
              ) : null}
              <h3
                className={`font-black text-gray-900 dark:text-gray-100 ${
                  content.brandLine
                    ? 'text-2xl mb-6 text-purple-700 dark:text-purple-300'
                    : 'text-3xl mb-6'
                }`}
              >
                {content.roleTitle}
              </h3>
              {content.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-xl leading-relaxed mb-6 text-gray-700 dark:text-gray-300">
                  {paragraph}
                </p>
              ))}

              <div className="space-y-4">
                {content.highlights.map((item, idx) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Code;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ x: 5 }}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-black"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-black"
                        style={{ backgroundColor: item.color }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-white leading-relaxed text-lg">
                {content.callout}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
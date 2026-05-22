import { motion } from 'motion/react';
import { Squiggle, Star, BlobShape } from '../../../components/GraphicElements';
import { FlowerCharacter } from '../../../components/FlowerCharacter';
import { Cupcake, Cookie } from '../../../components/BakeryItems';
import { Code, Cpu, Layers, Palette } from 'lucide-react';
import { useEngineeringSkillsContent, useEngineeringSkillsMetaSection } from '../../../lib/contentHooks';

const skillIconMap = {
  Code,
  Cpu,
  Layers,
  Palette,
} as const;

export function EngineeringSkills() {
  const skillCategoriesRaw = useEngineeringSkillsContent();
  const skillsMeta = useEngineeringSkillsMetaSection();

  const skillCategories = skillCategoriesRaw.map((category) => ({
    ...category,
    icon: skillIconMap[category.icon as keyof typeof skillIconMap] ?? Code,
  }));

  return (
    <section
      id="skills"
      className="py-24 px-6 bg-gradient-to-br from-blue-100 via-violet-100 to-fuchsia-100 dark:from-blue-950 dark:via-violet-950 dark:to-fuchsia-950 relative overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <BlobShape color="#4169E1" size={450} className="absolute -top-40 -right-40 opacity-20" />
      <BlobShape color="#9B6DD6" size={400} className="absolute bottom-20 -left-32 opacity-20" />
      <BlobShape color="#FF6B9D" size={350} className="absolute top-1/2 right-1/4 opacity-15" />

      {/* Floating Bakery Items */}
      <motion.div
        className="absolute top-32 left-32 hidden lg:block"
        animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Cupcake size={85} animate={false} />
      </motion.div>

      <motion.div
        className="absolute bottom-40 right-32 hidden lg:block"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <Cookie size={80} animate={false} />
      </motion.div>

      {/* Stars */}
      <motion.div
        className="absolute top-20 left-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <Star color="#4169E1" size={50} />
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-20"
        animate={{ rotate: -360, scale: [1, 1.2, 1] }}
        transition={{ duration: 15, repeat: Infinity }}
      >
        <Star color="#FF6B9D" size={45} />
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
            <span className="text-blue-600 dark:text-blue-400">{skillsMeta.headingLeft}</span>{' '}
            <span className="text-violet-600 dark:text-violet-400">{skillsMeta.headingMiddle}</span>{' '}
            <span className="text-fuchsia-600 dark:text-fuchsia-400">
              {skillsMeta.headingRight}
            </span>
          </h2>
          <Squiggle color="#9B6DD6" className="mx-auto" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {skillCategories.map((category, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{ backgroundColor: category.color }}
                >
                  <category.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100">
                  {category.title}
                </h3>
              </div>

              <div className="flex flex-wrap gap-3">
                {category.skills.map((skill, sIdx) => (
                  <motion.div
                    key={sIdx}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: idx * 0.1 + sIdx * 0.05,
                      type: 'spring',
                    }}
                    whileHover={{
                      scale: 1.1,
                      rotate: Math.random() * 10 - 5,
                    }}
                  >
                    <div
                      className="px-4 py-2 rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all"
                      style={{
                        backgroundColor: `${category.color}20`,
                        borderColor: 'black'
                      }}
                    >
                      <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {skill}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

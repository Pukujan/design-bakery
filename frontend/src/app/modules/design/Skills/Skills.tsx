import { motion } from 'motion/react';
import { FlowerCharacter } from '../../../components/FlowerCharacter';
import { Star } from '../../../components/GraphicElements';
import { Zap } from 'lucide-react';
import skillsData from './skills.json';

export function Skills() {
  return (
    <section id="skills" className="py-24 px-6 bg-gradient-to-br from-pink-100 via-yellow-100 to-blue-100 dark:from-pink-950 dark:via-yellow-950 dark:to-blue-950 relative overflow-hidden">
      {/* Decorative flowers */}
      <div className="absolute top-10 left-10 hidden lg:block">
        <FlowerCharacter color="#4169E1" size={100} showFace animate />
      </div>
      <div className="absolute bottom-20 right-20 hidden lg:block">
        <FlowerCharacter color="#FF6B9D" size={90} showFace showArms animate />
      </div>

      {/* Scattered stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:block"
          style={{
            top: `${15 + i * 15}%`,
            left: `${10 + i * 15}%`,
          }}
          animate={{
            y: [0, -15, 0],
            rotate: 360,
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        >
          <Star color={['#FF6B9D', '#FFD93D', '#4169E1'][i % 3]} size={25} />
        </motion.div>
      ))}

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Zap className="w-12 h-12 text-yellow-500 dark:text-yellow-400" />
            <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none font-black">
              <span className="text-pink-500 dark:text-pink-400">SKILLS</span>{' '}
              <span className="text-blue-600 dark:text-blue-400">&</span>{' '}
              <span className="text-yellow-500 dark:text-yellow-400">TOOLS</span>
            </h2>
            <Zap className="w-12 h-12 text-pink-500 dark:text-pink-400" />
          </div>
        </motion.div>

        {/* Playful skill bubbles */}
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto mb-12">
          {skillsData.map((skill, index) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.05,
                duration: 0.5,
                type: "spring",
                stiffness: 150,
              }}
              whileHover={{
                scale: 1.15,
                rotate: Math.random() * 20 - 10,
                transition: { duration: 0.2 },
              }}
            >
              <div
                className="px-8 py-4 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                style={{
                  backgroundColor: skill.color,
                  transform: `rotate(${Math.random() * 6 - 3}deg)`,
                }}
              >
                <span className="text-white font-black whitespace-nowrap text-lg">
                  {skill.name}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Central message card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            {/* Decorative flowers in corners */}
            <div className="absolute -top-6 -right-6">
              <FlowerCharacter color="#FFD93D" size={80} showFace />
            </div>
            <div className="absolute -bottom-6 -left-6">
              <FlowerCharacter color="#4169E1" size={70} showFace />
            </div>
            
            <p className="text-2xl text-center relative z-10 leading-relaxed text-gray-900 dark:text-gray-100">
              Bridging creativity and technology to build <span className="text-pink-500 font-black">meaningful experiences</span>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

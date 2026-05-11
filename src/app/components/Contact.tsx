import { motion } from 'motion/react';
import { Heart, ExternalLink } from 'lucide-react';
import { FlowerCharacter } from './FlowerCharacter';
import { Star, Squiggle } from './GraphicElements';
import { useContactSection, useSocialLinksContent } from '../lib/contentHooks';
import { resolveIcon } from '../lib/iconResolver';

export function Contact() {
  const content = useContactSection();
  const socialLinksData = useSocialLinksContent();

  return (
    <section id="contact" className="py-24 px-6 relative overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400">
      {/* Animated flowers */}
      <motion.div
        className="absolute top-20 left-20 hidden lg:block"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, 0],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <FlowerCharacter color="#FF6B9D" size={120} showFace showArms animate />
      </motion.div>

      <motion.div
        className="absolute bottom-20 right-20 hidden lg:block"
        animate={{
          y: [0, 20, 0],
          rotate: [0, -10, 0],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <FlowerCharacter color="#4169E1" size={130} showFace animate />
      </motion.div>

      <motion.div
        className="absolute top-1/2 left-10 hidden lg:block"
        animate={{
          x: [0, 15, 0],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <FlowerCharacter color="#FFD93D" size={90} showFace animate />
      </motion.div>

      {/* Scattered stars */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: `${10 + i * 12}%`,
            left: `${5 + i * 12}%`,
          }}
          animate={{
            rotate: 360,
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          <Star color={['#FF6B9D', '#FFD93D', '#4169E1', '#FF8C42'][i % 4]} size={40} />
        </motion.div>
      ))}

      <div className="max-w-4xl mx-auto relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(3rem,8vw,7rem)] leading-none mb-8 text-white drop-shadow-lg font-black whitespace-pre-line">
            {content.heading}
          </h2>
          
          <Squiggle color="#FFD93D" className="mx-auto mb-8 w-80" />

          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto mb-12 relative"
          >
            <Heart className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 text-pink-500 fill-pink-500" />
            <p className="text-3xl text-gray italic leading-relaxed">
              "{content.quote}"
            </p>
          </motion.blockquote>
        </motion.div>

        {/* Social links with bold cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16"
        >
          {socialLinksData.map((link, index) => {
            const Icon = resolveIcon(link.icon);
            return (
              <motion.a
                key={link.name}
                href={link.href}
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                whileHover={{ 
                  scale: 1.08, 
                  rotate: Math.random() * 6 - 3,
                  transition: { duration: 0.2 }
                }}
                className="group block"
              >
                <div
                  className="flex items-center gap-4 p-6 bg-white dark:bg-gray-900 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div 
                    className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl border-4 border-black"
                    style={{ backgroundColor: link.color }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-lg text-gray-900 dark:text-gray-100">{link.name}</p>
                    <p className="text-sm opacity-70 font-mono truncate text-gray-700 dark:text-gray-300">
                      {link.handle}
                    </p>
                  </div>

                  <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-gray-900 dark:text-gray-100" />
                </div>
              </motion.a>
            );
          })}
        </motion.div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-block bg-white dark:bg-gray-900 px-8 py-4 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-black text-gray-900 dark:text-gray-100">
              {content.footerNote}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

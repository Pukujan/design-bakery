import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { FlowerCharacter } from './FlowerCharacter';
import { Star, Squiggle } from './GraphicElements';
import { Palette } from 'lucide-react';

const artPieces = [
  {
    src: 'https://images.unsplash.com/photo-1733006955710-9a68ff104684?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNvbGxhZ2UlMjBhcnR8ZW58MXx8fHwxNzYxNzgzNTA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: 'Abstract Collage',
    color: '#FF6B9D',
    id: 'abstract-collage',
  },
  {
    src: 'https://images.unsplash.com/photo-1622249504895-5b2e35c5ef85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc3RpYyUyMGlsbHVzdHJhdGlvbiUyMG1peGVkfGVufDF8fHx8MTc2MTc4MzUxMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: 'Mixed Media',
    color: '#4169E1',
    id: 'mixed-media',
  },
  {
    src: 'https://images.unsplash.com/photo-1636955779321-819753cd1741?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHBvc3RlciUyMGFydHxlbnwxfHx8fDE3NjE3ODM1MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: 'Poster Art',
    color: '#FFD93D',
    id: 'poster-art',
  },
  {
    src: 'https://images.unsplash.com/photo-1553989577-14e950184619?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmlkZSUyMGNlbGVicmF0aW9uJTIwY29tbXVuaXR5fGVufDF8fHx8MTc2MTc4MzUxMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: 'Pride Month',
    color: '#FF8C42',
    id: 'pride-month',
  },
  {
    src: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBldmVudCUyMHdvcmtzaG9wfGVufDF8fHx8MTc2MTc4MzUxMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: 'Community Events',
    color: '#A8CC00',
    id: 'community-events',
  },
];

interface ArtGalleryProps {
  onGalleryClick?: (galleryId: string) => void;
}

export function ArtGallery({ onGalleryClick }: ArtGalleryProps) {
  return (
    <section id="gallery" className="py-24 px-6 bg-gradient-to-br from-purple-100 via-blue-100 to-green-100 dark:from-purple-950 dark:via-blue-950 dark:to-green-950 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-20 hidden lg:block">
        <FlowerCharacter color="#9B6DD6" size={110} showFace showArms animate />
      </div>
      
      {/* Scattered stars */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:block"
          style={{
            top: `${30 + i * 20}%`,
            right: `${15 + i * 15}%`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }}
        >
          <Star color={['#FF6B9D', '#FFD93D', '#4169E1', '#FF8C42'][i]} size={35} />
        </motion.div>
      ))}

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Palette className="w-12 h-12 text-pink-500 dark:text-pink-400" />
            <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none font-black">
              <span className="text-purple-600 dark:text-purple-400">ART</span>{' '}
              <span className="text-blue-500 dark:text-blue-400">&</span>{' '}
              <span className="text-pink-500 dark:text-pink-400">CULTURE</span>
            </h2>
            <Palette className="w-12 h-12 text-blue-500 dark:text-blue-400" />
          </div>
          <Squiggle color="#FFD93D" className="mx-auto mb-4" />
          <p className="text-2xl opacity-90 text-gray-900 dark:text-gray-100">Visual Stories & Cultural Expression</p>
        </motion.div>

        {/* Bento-style grid - Blurred with Coming Soon */}
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 blur-md pointer-events-none">
            {artPieces.map((piece, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`
                  group relative
                  ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}
                  ${index === 3 ? 'md:col-span-2' : ''}
                `}
              >
                <div 
                  className="relative overflow-hidden rounded-3xl border-6 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] h-full"
                  style={{ 
                    backgroundColor: piece.color,
                    minHeight: index === 0 ? '400px' : '200px'
                  }}
                >
                  <ImageWithFallback
                    src={piece.src}
                    alt={piece.caption}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Bold caption badge */}
                  <div className="absolute bottom-4 left-4 px-6 py-3 rounded-full border-4 border-black bg-white dark:bg-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="font-black text-gray-900 dark:text-gray-100">{piece.caption}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add a special "More Art" card */}
            <div className="relative group">
              <div className="h-full min-h-[200px] flex items-center justify-center bg-gradient-to-br from-yellow-400 to-pink-500 rounded-3xl border-6 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-center p-6">
                  <FlowerCharacter color="#FF6B9D" size={80} showFace animate />
                  <p className="text-white text-xl mt-4 font-black">More Coming Soon!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 p-12 md:p-20 rounded-[3rem] border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
              <motion.h3 
                className="text-[clamp(3rem,10vw,8rem)] leading-none font-black text-white text-center"
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                COMING<br />SOON
              </motion.h3>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="flex justify-center mt-6"
              >
                <Star color="#FFD93D" size={60} />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Quote - Also blurred */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16 blur-sm opacity-50"
        >
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] inline-block max-w-2xl">
            <p className="text-2xl italic text-gray-900 dark:text-gray-100">
              "Art is where culture breathes and equality speaks"
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

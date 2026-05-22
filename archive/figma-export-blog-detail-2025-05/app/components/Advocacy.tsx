import { motion } from 'motion/react';
import { Heart, Users, Sparkles } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { FlowerCharacter } from './FlowerCharacter';
import { Star } from './GraphicElements';

const advocacyImages = [
  {
    src: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBldmVudCUyMHdvcmtzaG9wfGVufDF8fHx8MTc2MTc4MzUxMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: 'Community Workshops',
    color: '#4169E1',
    id: 'community-workshops',
  },
  {
    src: 'https://images.unsplash.com/photo-1553989577-14e950184619?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmlkZSUyMGNlbGVicmF0aW9uJTIwY29tbXVuaXR5fGVufDF8fHx8MTc2MTc4MzUxMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: 'Pride & Community',
    color: '#FF6B9D',
    id: 'pride-community',
  },
];

interface AdvocacyProps {
  onGalleryClick?: (galleryId: string) => void;
}

export function Advocacy({ onGalleryClick }: AdvocacyProps) {
  return (
    <section id="advocacy" className="py-24 px-6 bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-200 dark:from-yellow-950 dark:via-pink-950 dark:to-purple-950 relative overflow-hidden">
      {/* Decorative flowers */}
      <div className="absolute top-10 left-10 hidden lg:block">
        <FlowerCharacter color="#FF6B9D" size={90} showFace showArms animate />
      </div>
      <div className="absolute bottom-10 right-10 hidden lg:block">
        <FlowerCharacter color="#4169E1" size={100} showFace animate />
      </div>
      
      {/* Floating stars */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:block"
          style={{
            top: `${20 + i * 15}%`,
            left: `${10 + i * 20}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        >
          <Star color={['#FF6B9D', '#4169E1', '#FFD93D', '#FF8C42', '#A8CC00'][i]} size={30} />
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
          <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none mb-6 font-black">
            <span className="text-pink-500 dark:text-pink-400">DESIGNING</span>
            <br />
            <span className="text-blue-600 dark:text-blue-400">for EQUALITY</span>
          </h2>
        </motion.div>

        {/* Image Grid with Playful Styling */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {advocacyImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="relative group cursor-pointer"
              onClick={() => onGalleryClick?.(image.id)}
            >
              <div 
                className="aspect-[4/3] overflow-hidden rounded-3xl border-6 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all"
                style={{ backgroundColor: image.color }}
              >
                <ImageWithFallback
                  src={image.src}
                  alt={image.caption}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Caption with bold styling */}
                <div 
                  className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl border-4 border-black"
                  style={{ backgroundColor: image.color }}
                >
                  <p className="text-white text-xl font-black">{image.caption}</p>
                </div>
                {/* Click indicator */}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity flex items-center justify-center">
                  <span className="text-white text-2xl font-black opacity-0 group-hover:opacity-100">Click to View Gallery →</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Text Content with Bold Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white dark:bg-gray-900 p-10 md:p-14 rounded-3xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            {/* Decorative corner flowers */}
            <div className="absolute -top-8 -right-8">
              <FlowerCharacter color="#FFD93D" size={100} showFace />
            </div>
            
            <p className="text-2xl leading-relaxed mb-10 relative z-10 text-gray-900 dark:text-gray-100">
              Through mentorship and visual storytelling, I support inclusive communities where creativity has no gender.
            </p>

            {/* Values Grid */}
            <div className="grid sm:grid-cols-3 gap-6 relative z-10">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -2 }}
                className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <Heart className="w-12 h-12 mb-3 text-white fill-white" />
                <p className="text-white">Empathy First</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <Users className="w-12 h-12 mb-3 text-white" />
                <p className="text-white">Community Driven</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, rotate: -2 }}
                className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <Sparkles className="w-12 h-12 mb-3 text-white" />
                <p className="text-white">Creative Power</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

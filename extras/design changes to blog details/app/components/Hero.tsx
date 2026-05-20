import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Cupcake, Donut, Cookie, Croissant, IceCream } from './BakeryItems';
import { Squiggle, Star, BlobShape } from './GraphicElements';

interface HeroProps {
  onNavigate: (section: string) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 pt-20">
      {/* Animated Background Shapes */}
      <BlobShape color="#FFD93D" size={300} className="absolute top-10 -left-20 opacity-30" />
      <BlobShape color="#FF6B9D" size={250} className="absolute bottom-20 -right-10 opacity-40" />
      <BlobShape color="#4169E1" size={200} className="absolute top-1/3 right-1/4 opacity-20" />
      
      {/* Decorative Elements */}
      <motion.div
        className="absolute top-20 left-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Star color="#FFD93D" size={60} />
      </motion.div>

      <motion.div
        className="absolute bottom-32 left-1/4"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Star color="#FF8C42" size={40} />
      </motion.div>

      {/* Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-8 mb-8 flex-wrap">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <Cupcake size={110} />
          </motion.div>

          <motion.div
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          >
            <Donut size={130} />
          </motion.div>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
          >
            <IceCream size={100} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h1 className="text-[clamp(3rem,10vw,8rem)] leading-none mb-6 text-white drop-shadow-lg">
            <span className="playful-text block" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {['D','E','S','I','G','N'].map((letter, i) => (
                <span key={i} style={{ '--index': i } as any} className="inline-block">
                  {letter}
                </span>
              ))}
            </span>
            <span className="playful-text block text-yellow-300" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {['B','A','K','E','R'].map((letter, i) => (
                <span key={i} style={{ '--index': i + 6 } as any} className="inline-block">
                  {letter}
                </span>
              ))}
            </span>
          </h1>

          <div className="flex justify-center mb-6">
            <Squiggle color="#FFD93D" className="w-64" />
          </div>

          <p className="text-2xl md:text-3xl mb-4 text-white max-w-3xl mx-auto font-medium">
            Designing with empathy, culture, and purpose.
          </p>

          <p className="text-lg md:text-xl mb-12 text-white/90 max-w-2xl mx-auto">
            I'm a designer and advocate creating human-centered experiences rooted in art and equality.
          </p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <Button
              size="lg"
              onClick={() => onNavigate('showcase')}
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-8 py-6 rounded-full group border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              View Projects
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate('advocacy')}
              className="bg-white hover:bg-pink-100 text-black border-4 border-black px-8 py-6 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Advocacy Work
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating decorative bakery items */}
      <motion.div
        className="absolute top-1/4 right-20 hidden lg:block"
        animate={{ 
          y: [0, -15, 0],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Cookie size={80} />
      </motion.div>

      <motion.div
        className="absolute bottom-1/4 left-16 hidden lg:block"
        animate={{ 
          y: [0, 15, 0],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <Croissant size={90} />
      </motion.div>
      
      <motion.div
        className="absolute top-1/3 left-1/4 hidden lg:block"
        animate={{ 
          y: [0, -10, 0],
        }}
        transition={{ duration: 3.5, repeat: Infinity }}
      >
        <Donut size={60} />
      </motion.div>
    </section>
  );
}
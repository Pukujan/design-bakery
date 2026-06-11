import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { FlowerCharacter } from './FlowerCharacter';
import { Star } from './GraphicElements';

interface BlogPostPageProps {
  id: number;
  title: string;
  date: string;
  category: string;
  color: string;
  content: string;
  onBack: () => void;
}

export function BlogPostPage({ title, date, category, color, content, onBack }: BlogPostPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 hidden lg:block">
        <FlowerCharacter color={color} size={90} showFace animate />
      </div>
      
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:block"
          style={{
            top: `${20 + i * 25}%`,
            left: `${10 + i * 30}%`,
          }}
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 8 + i, repeat: Infinity }}
        >
          <Star color={color} size={30} />
        </motion.div>
      ))}

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reflections
          </Button>

          {/* Category badge */}
          <div className="flex items-center gap-4 mb-6">
            <span
              className="px-6 py-3 rounded-full border-4 border-black font-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              style={{ backgroundColor: color }}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              {category}
            </span>
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Calendar className="w-5 h-5" />
              <span>{date}</span>
            </div>
          </div>

          <h1 className="text-[clamp(2.5rem,6vw,4rem)] leading-tight mb-8 font-black text-gray-900 dark:text-gray-100">
            {title}
          </h1>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 p-10 md:p-14 rounded-3xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="prose prose-lg max-w-none">
            <p className="text-xl leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-line">
              {content}
            </p>
          </div>
        </motion.div>

        {/* Related Posts suggestion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Button
            onClick={onBack}
            size="lg"
            className="bg-black hover:bg-purple-600 text-white border-4 border-black px-10 py-6 rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            View More Reflections
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'motion/react';
import { blogButtonMotion } from '@/modules/blog/shared/BlogPageMotion';

type BlogDetailQuickActionsProps = {
  blogsPath: string;
  className?: string;
};

export function BlogDetailQuickActions({ blogsPath, className = '' }: BlogDetailQuickActionsProps) {
  const navigate = useNavigate();

  return (
    <Card
      className={`p-3 lg:p-4 border-3 lg:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] lg:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 ${className}`}
    >
      <h3 className="text-base lg:text-lg font-black mb-3 lg:mb-4 text-gray-900 dark:text-gray-100">
        Quick Actions
      </h3>
      <div className="space-y-3">
        <motion.div {...blogButtonMotion}>
          <Button
            type="button"
            onClick={() => navigate(blogsPath)}
            className="w-full justify-start px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-blue-500 hover:bg-blue-600 text-white font-black text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Blogs
          </Button>
        </motion.div>
        <motion.div {...blogButtonMotion}>
          <Button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-full justify-start px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 text-black dark:text-white font-black text-sm"
          >
            ↑ Back to Top
          </Button>
        </motion.div>
      </div>
    </Card>
  );
}

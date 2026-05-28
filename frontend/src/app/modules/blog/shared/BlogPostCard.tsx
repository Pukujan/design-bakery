import { ArrowRight, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlogCoverImage } from '@/modules/blog/shared/BlogCoverImage';
import type { BlogSummary } from '@/modules/blog/data/blogData';

type BlogPostCardProps = {
  blog: BlogSummary;
  onOpen: () => void;
};

export function BlogPostCard({ blog, onOpen }: BlogPostCardProps) {
  return (
    <Card
      onClick={onOpen}
      className="flex h-full cursor-pointer flex-col rounded-xl border-6 border-black bg-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:bg-gray-900 md:p-5"
    >
      <BlogCoverImage blog={blog} variant="card" coverFit="cover" className="mb-4 shrink-0" />

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="mb-4 h-2 w-full shrink-0 rounded-full border-2 border-black"
          style={{ backgroundColor: blog.color }}
        />

        <div className="mb-3 flex shrink-0 items-center gap-4 text-xs text-gray-600 md:text-sm dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{blog.readTime}</span>
          </div>
          <span aria-hidden>•</span>
          <span>{blog.date}</span>
        </div>

        <h3 className="mb-4 line-clamp-2 shrink-0 text-lg font-black text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400 md:text-xl">
          {blog.title}
        </h3>

        <div className="mt-auto flex flex-col gap-3 pt-1">
          <div className="flex flex-wrap gap-2">
            {blog.tags.slice(0, 4).map((tag, tIdx) => (
              <Badge
                key={tIdx}
                variant="outline"
                className="border-2 border-black text-xs font-bold"
              >
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>

          <Button
            variant="ghost"
            className="group/btn h-auto w-full justify-start p-0 font-bold text-blue-600 hover:bg-transparent dark:text-blue-400"
          >
            Read Full Article
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

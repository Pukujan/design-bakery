import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BLOG_AGENTS_ENABLED } from './config';
import { BlogSeoPanel } from './seo/BlogSeoPanel';

/**
 * Admin blog agents hub — SEO rules (Slice 2) + AI agents gate (Slice 3).
 * guidelines/agent-devlog-blog-agents.md
 */
export function BlogAgentsPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <div className="mb-2 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-black">Blog agents</h1>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          Rule-based SEO is live below. Promo and Agent Council require Firebase Functions (Slice 3).
        </p>
      </header>

      <BlogSeoPanel />

      {!BLOG_AGENTS_ENABLED && (
        <Card className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="mb-2 text-lg font-black">AI agents (coming soon)</h2>
          <p className="mb-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Set{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">
              VITE_ENABLE_BLOG_AGENTS=true
            </code>{' '}
            after Firebase Functions + OpenRouter are deployed.
          </p>
          <Button asChild variant="outline" className="border-2 border-black font-bold">
            <Link to="../blog">Back to blog posts</Link>
          </Button>
        </Card>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BLOG_AGENTS_ENABLED } from './config';

/**
 * Admin blog agents hub — Phase 1 scaffold.
 * guidelines/agent-devlog-blog-agents.md
 */
export function BlogAgentsPage() {
  if (!BLOG_AGENTS_ENABLED) {
    return (
      <div className="max-w-2xl">
        <Card className="border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-4 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-black">Blog agents</h1>
          </div>
          <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
            Promo, SEO, and Agent Council modules are scaffolded but disabled. Set{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">
              VITE_ENABLE_BLOG_AGENTS=true
            </code>{' '}
            after Phase 4 (Firebase Functions + OpenRouter) is deployed.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            See <code>guidelines/agent-devlog-blog-agents.md</code> and phased plan in the repo.
          </p>
          <Button asChild variant="outline" className="mt-6 border-2 border-black font-bold">
            <Link to="../blog">Back to blog posts</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-2xl font-black">Blog agents</h1>
      <p className="text-gray-700 dark:text-gray-300">Agents enabled — UI phases 2–7 pending.</p>
    </div>
  );
}

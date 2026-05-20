import { Sparkles } from 'lucide-react';
import { BLOG_AGENTS_ENABLED } from './config';
import { BlogSeoPanel } from './seo/BlogSeoPanel';
import { BlogPromoPanel } from './promo/BlogPromoPanel';

/**
 * Admin blog agents hub — SEO rules (Slice 2) + AI promo (Slice 3).
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
          Rule-based SEO is always available. Enable AI promo with{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm dark:bg-gray-800">
            VITE_ENABLE_BLOG_AGENTS=true
          </code>{' '}
          after deploying Functions and setting the OpenRouter secret.
        </p>
      </header>

      <BlogSeoPanel />

      {BLOG_AGENTS_ENABLED ? (
        <BlogPromoPanel />
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 rounded-lg border-2 border-dashed border-gray-400 px-4 py-3">
          Promo agent is hidden until <code>VITE_ENABLE_BLOG_AGENTS=true</code>. Deploy{' '}
          <code>invokeBlogAgent</code> and set <code>OPENROUTER_API_KEY</code> first.
        </p>
      )}
    </div>
  );
}

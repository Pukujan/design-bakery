import { Sparkles } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BLOG_AGENTS_ENABLED } from './config';
import { BlogAgentsGuide } from './components/BlogAgentsGuide';
import { BlogSeoPanel } from './seo/BlogSeoPanel';
import { BlogPromoPanel } from './promo/BlogPromoPanel';

/**
 * Admin blog agents hub — SEO rules (Slice 2) + AI promo (Slice 3).
 * guidelines/agent-devlog-blog-agents.md
 */
export function BlogAgentsPage() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-4xl space-y-8">
        <header>
          <div className="mb-2 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-black">Blog agents</h1>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
            Improve how posts appear in Google and social. SEO uses free rules; Promo uses AI only
            when Functions + OpenRouter are configured.
          </p>
        </header>

        <BlogAgentsGuide />

        <BlogSeoPanel />

        {BLOG_AGENTS_ENABLED ? (
          <BlogPromoPanel />
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-400 bg-gray-50 px-4 py-4 text-sm text-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
            <p className="font-bold mb-1">Promo agent is off</p>
            <p className="leading-relaxed">
              Local dev: set <code className="text-xs">VITE_ENABLE_BLOG_AGENTS=true</code> in root{' '}
              <code className="text-xs">frontend/.env</code> and restart Vite. Production builds enable this by
              default unless you set the flag to <code className="text-xs">false</code> on Vercel. Deploy{' '}
              <code className="text-xs">invokeBlogAgent</code> and set{' '}
              <code className="text-xs">OPENROUTER_API_KEY</code> in Firebase Functions config.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

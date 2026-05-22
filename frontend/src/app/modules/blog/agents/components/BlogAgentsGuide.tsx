import { useState } from 'react';
import { ChevronDown, ChevronUp, CircleHelp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { BLOG_AGENTS_ENABLED } from '../config';

export function BlogAgentsGuide() {
  const [open, setOpen] = useState(true);

  return (
    <Card className="border-4 border-black bg-gradient-to-br from-yellow-50 to-purple-50 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:from-yellow-950/30 dark:to-purple-950/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 text-left"
      >
        <CircleHelp className="mt-0.5 h-6 w-6 shrink-0 text-purple-700" />
        <div className="flex-1">
          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">
            How Blog Agents works
          </h2>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Two tools on this page: free SEO checks (always on) and optional AI promo copy.
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0" aria-hidden />
        )}
      </button>

      {open && (
        <div className="mt-4 grid gap-4 text-sm text-gray-800 dark:text-gray-200 sm:grid-cols-2">
          <section className="rounded-lg border-2 border-black bg-white/80 p-4 dark:bg-gray-900/80">
            <h3 className="mb-2 font-black text-purple-800 dark:text-purple-300">
              1 · SEO audit (rules, not AI)
            </h3>
            <ol className="list-decimal space-y-2 pl-4 leading-relaxed">
              <li>Choose a post — the yellow <strong>Live preview</strong> shows tab title &amp; meta description.</li>
              <li>
                <strong>Use suggestions</strong> copies trimmed title + excerpt into the fields
                (not AI; does not set share image).
              </li>
              <li>
                <strong>Apply to post</strong> saves — a <strong>before / after</strong> box shows
                exactly which meta fields were added or updated.
              </li>
              <li>
                <strong>Open public post</strong> — confirm the browser tab and meta tags changed.
              </li>
            </ol>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <strong>OG / share image</strong> = thumbnail when the link is pasted on social apps.
              Optional; add a public image URL yourself.
            </p>
          </section>

          <section className="rounded-lg border-2 border-black bg-white/80 p-4 dark:bg-gray-900/80">
            <h3 className="mb-2 font-black text-indigo-800 dark:text-indigo-300">
              2 · Promo agent (AI)
            </h3>
            {BLOG_AGENTS_ENABLED ? (
              <>
                <p className="mb-2 leading-relaxed">
                  Outputs: <strong>LinkedIn post</strong>, <strong>3 hooks</strong>,{' '}
                  <strong>hashtags</strong>. <strong>Regenerate</strong> = new draft.{' '}
                  <strong>Refine instructions</strong> = steer the next run (not a chat yet).
                </p>
                <ol className="list-decimal space-y-2 pl-4 leading-relaxed">
                  <li>
                    Keep <code className="text-xs">pnpm run functions:serve</code> running.
                  </li>
                  <li>Pick post + tone → <strong>Generate</strong> (~10–30s).</li>
                  <li>Read the indigo “Generated just now” summary + draft box.</li>
                  <li>
                    <strong>Regenerate</strong> or edit refine instructions and generate again.
                  </li>
                  <li>
                    <strong>Copy post + hashtags</strong> → paste into LinkedIn. Share link only
                    adds the blog URL.
                  </li>
                </ol>
              </>
            ) : (
              <p className="leading-relaxed">
                Hidden until <code className="text-xs">VITE_ENABLE_BLOG_AGENTS=true</code> in root{' '}
                <code className="text-xs">frontend/.env</code>, OpenRouter key in{' '}
                <code className="text-xs">backend/.env</code>, and the Functions emulator is
                running. Restart Vite after changing env.
              </p>
            )}
          </section>
        </div>
      )}
    </Card>
  );
}

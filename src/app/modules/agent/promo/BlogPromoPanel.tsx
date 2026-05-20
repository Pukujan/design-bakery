import { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, Loader2, Megaphone, RefreshCw } from 'lucide-react';
import { PromoCapabilities } from './PromoCapabilities';
import { PromoOutputGuide } from './PromoOutputGuide';
import { getBlogs, type BlogPost } from '@/lib/adminContentService';
import { useAdminPortfolio } from '@/modules/admin/AdminPortfolioContext';
import { getPortfolioConfig, portfolioPath } from '@/portfolios/registry';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldLabel } from '../components/FieldLabel';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { invokeBlogAgent } from '../agentClient';
import type { PromoAgentData } from './promoTypes';
import {
  PROMO_THEMES,
  buildLinkedInShareUrl,
  formatPostWithHashtags,
  type PromoTheme,
} from './promoTypes';

export function BlogPromoPanel() {
  const portfolioId = useAdminPortfolio();
  const portfolioConfig = getPortfolioConfig(portfolioId);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [theme, setTheme] = useState<PromoTheme>('professional');
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromoAgentData | null>(null);
  const [remaining, setRemaining] = useState<{ calls?: number; tokens?: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = posts.find((p) => p.id === selectedId) ?? null;

  const publicUrl = useMemo(() => {
    if (!selected?.numericId) return '';
    const path = portfolioPath(portfolioConfig.basePath, `/blogs/${selected.numericId}`);
    return `${window.location.origin}${path}`;
  }, [selected?.numericId, portfolioConfig.basePath]);

  const shareUrl = publicUrl ? buildLinkedInShareUrl(publicUrl) : '';
  const formattedPost = result
    ? formatPostWithHashtags(result.linkedInPost, result.hashtags)
    : '';

  useEffect(() => {
    let active = true;
    void getBlogs().then((items) => {
      if (!active) return;
      setPosts(items);
      setLoading(false);
      setSelectedId((prev) => {
        if (prev) return prev;
        const first = items.find((p) => p.id && p.numericId != null);
        return first?.id ?? '';
      });
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleGenerate() {
    if (!selected?.numericId) return;
    setGenerating(true);
    setError(null);
    setCopied(false);

    const response = await invokeBlogAgent({
      action: 'promo',
      blogId: selected.numericId,
      theme,
      customInstructions: instructions.trim() || undefined,
      publicUrl: publicUrl || undefined,
      blogSnapshot: {
        title: selected.title,
        excerpt: selected.excerpt,
        content: selected.content,
        tags: selected.tags ?? [],
        category: selected.category,
        author: selected.author,
      },
    });

    setGenerating(false);

    if (!response.ok) {
      setError(response.message);
      return;
    }

    const data = response.data as PromoAgentData;
    if (!data?.linkedInPost) {
      setError('Agent returned an empty promo draft.');
      return;
    }

    setResult({
      linkedInPost: data.linkedInPost,
      hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
      hooks: Array.isArray(data.hooks) ? data.hooks : [],
    });
    setRemaining({
      calls: response.remainingDailyCalls,
      tokens: response.remainingDailyTokens,
    });
  }

  async function handleCopy() {
    if (!formattedPost) return;
    try {
      await navigator.clipboard.writeText(formattedPost);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading posts…</p>;
  }

  return (
    <Card className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Megaphone className="h-6 w-6 text-indigo-600 shrink-0" />
        <div>
          <h2 className="text-xl font-black">Promo agent</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
            <strong>One-shot AI</strong> — reads your blog, returns a LinkedIn draft + hooks +
            hashtags. Use <strong>Regenerate</strong> for a new version. No chat thread yet — use
            extra instructions to steer the next run.
          </p>
        </div>
      </div>

      <PromoCapabilities />

      {!result && <PromoOutputGuide variant="before" />}

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel
            htmlFor="promo-post-select"
            label="Post"
            tip="The article content sent to the AI. Uses numeric blog ID (#) from Firestore."
          />
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger id="promo-post-select" className="border-2 border-black font-medium">
              <SelectValue placeholder="Select a post" />
            </SelectTrigger>
            <SelectContent>
              {posts.map((post) => (
                <SelectItem key={post.id ?? post.title} value={post.id ?? ''} disabled={!post.id}>
                  {post.title}
                  {post.numericId != null ? ` (#${post.numericId})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <FieldLabel
            htmlFor="promo-theme"
            label="Tone"
            tip="Steers voice: professional (default), playful, technical, or leadership. Regenerate to try another tone."
          />
          <Select value={theme} onValueChange={(v) => setTheme(v as PromoTheme)}>
            <SelectTrigger id="promo-theme" className="border-2 border-black font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROMO_THEMES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {publicUrl && (
        <p className="mb-4 text-xs text-gray-500 break-all" title="Included in the AI prompt and used by LinkedIn share link.">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Public URL</span>{' '}
          (embedded in draft + share link):{' '}
          <span className="font-mono">{publicUrl}</span>
        </p>
      )}

      <div className="mb-4 space-y-2">
        <FieldLabel
          htmlFor="promo-instructions"
          label="Refine instructions (optional) — not a chat yet"
          tip="Included in the next Generate/Regenerate call only. Example: shorter, mention hiring, fewer emojis. For back-and-forth edits, use Regenerate after changing this box (full chat UI is planned)."
          hint="v1 substitute for a chatbot: edit this, then Regenerate."
        />
        <Textarea
          id="promo-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={2}
          placeholder="e.g. Under 800 chars, mention the Mermaid diagrams, CTA: read the full post"
          className="border-2 border-black"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={generating || !selected?.numericId}
          onClick={() => void handleGenerate()}
          title="Calls Firebase Function → OpenRouter (Qwen). Needs functions emulator running."
          className="border-2 border-black bg-indigo-600 font-black text-white hover:bg-indigo-700"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {result ? 'Regenerating…' : 'Generating…'}
            </>
          ) : result ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate draft
            </>
          ) : (
            'Generate LinkedIn promo'
          )}
        </Button>
        {!result && !generating && selected?.numericId && (
          <p className="self-center text-xs text-gray-500 max-w-xs">
            Nothing generated yet — click Generate (10–30s).
          </p>
        )}
      </div>

      {remaining && (
        <p
          className="mb-4 text-xs text-gray-500"
          title="Daily limits per admin account to control OpenRouter cost."
        >
          Remaining today — API calls: {remaining.calls ?? '—'}, token budget:{' '}
          {remaining.tokens ?? '—'}
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-lg border-2 border-red-500 bg-red-50 px-3 py-3 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-100">
          <p className="font-bold mb-1">Generation failed</p>
          <p className="whitespace-pre-wrap break-words">{error}</p>
          <ul className="mt-2 list-disc pl-4 text-xs space-y-1 opacity-90">
            <li>
              Terminal 2: <code className="font-mono">pnpm run functions:serve</code> must be
              running (port 5001)
            </li>
            <li>
              <code className="font-mono">functions/.env</code> — save the file (⌘S) with{' '}
              <code className="font-mono">OPENROUTER_API_KEY=sk-or-…</code> (empty on disk =
              failure)
            </li>
            <li>
              Root <code className="font-mono">.env</code>:{' '}
              <code className="font-mono">VITE_USE_FUNCTIONS_EMULATOR=true</code>
            </li>
            <li>Check the Functions terminal for the full error line after “invokeBlogAgent error:”</li>
          </ul>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <PromoOutputGuide variant="after" result={result} />

          {result.hooks.length > 0 && (
            <div className="rounded-lg border-2 border-black bg-white/60 p-3 dark:bg-gray-900/60">
              <p className="mb-2 text-sm font-bold">Hook options (opening lines — optional)</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
                {result.hooks.map((hook) => (
                  <li key={hook}>{hook}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <FieldLabel
              label="LinkedIn post draft (copy this)"
              tip="This is the main deliverable. Paste into LinkedIn’s post composer. Hashtags are added at the bottom when you click Copy."
            />
            <Textarea
              readOnly
              value={formattedPost}
              rows={12}
              className="border-2 border-black font-medium"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-2 border-black font-bold"
              onClick={() => void handleCopy()}
              title="Copies the draft box to your clipboard so you can paste into LinkedIn."
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Copied!' : 'Copy post + hashtags'}
            </Button>
            {shareUrl && (
              <Button
                type="button"
                variant="outline"
                className="border-2 border-black font-bold"
                asChild
                title="Opens LinkedIn with your blog URL — you still paste the copied text into the post body."
              >
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  LinkedIn share link
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Check, RefreshCw, Search } from 'lucide-react';
import { getBlogs, saveBlog, type BlogPost } from '@/lib/adminContentService';
import { useAdminPortfolio } from '@/modules/admin/AdminPortfolioContext';
import { getPortfolioConfig, portfolioPath } from '@/portfolios/registry';
import { SeoLivePreview } from './SeoLivePreview';
import type { BlogSeo } from '@/modules/engineering/blogSeo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FieldLabel } from '../components/FieldLabel';
import { runSeoAudit } from './seoRules';
import type { SeoFinding } from './seoTypes';

function findingStyles(severity: SeoFinding['severity']) {
  switch (severity) {
    case 'error':
      return 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100';
    case 'warn':
      return 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100';
    case 'pass':
      return 'border-green-600 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100';
    default:
      return 'border-gray-400 bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

const EMPTY_SEO: BlogSeo = { metaTitle: '', metaDescription: '', ogImage: '' };

export function BlogSeoPanel() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [seo, setSeo] = useState<BlogSeo>(EMPTY_SEO);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [suggestionsNotice, setSuggestionsNotice] = useState<string | null>(null);

  const portfolioId = useAdminPortfolio();
  const portfolioConfig = getPortfolioConfig(portfolioId);
  const selected = posts.find((p) => p.id === selectedId) ?? null;

  const publicUrl =
    selected?.numericId != null
      ? `${window.location.origin}${portfolioPath(portfolioConfig.basePath, `/blogs/${selected.numericId}`)}`
      : '';

  useEffect(() => {
    let active = true;
    void getBlogs().then((items) => {
      if (!active) return;
      setPosts(items);
      setLoading(false);
      setSelectedId((prev) => {
        if (prev) return prev;
        const first = items.find((p) => p.id);
        return first?.id ?? '';
      });
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) {
      setSeo(EMPTY_SEO);
      return;
    }
    setSeo({
      metaTitle: selected.seo?.metaTitle ?? '',
      metaDescription: selected.seo?.metaDescription ?? '',
      ogImage: selected.seo?.ogImage ?? '',
    });
    setMessage(null);
    setSuggestionsNotice(null);
  }, [selected?.id, selected?.seo?.metaTitle, selected?.seo?.metaDescription, selected?.seo?.ogImage]);

  const audit = useMemo(() => {
    if (!selected) return null;
    return runSeoAudit({
      title: selected.title,
      excerpt: selected.excerpt,
      content: selected.content,
      tags: selected.tags,
      seo,
    });
  }, [selected, seo]);

  async function handleApply() {
    if (!selected?.id) return;
    setSaving(true);
    setMessage(null);
    try {
      const nextSeo: BlogSeo = {
        metaTitle: seo.metaTitle?.trim() || undefined,
        metaDescription: seo.metaDescription?.trim() || undefined,
        ogImage: seo.ogImage?.trim() || undefined,
      };
      const hasAny = Boolean(nextSeo.metaTitle || nextSeo.metaDescription || nextSeo.ogImage);
      await saveBlog({
        ...selected,
        seo: hasAny ? nextSeo : undefined,
      });
      const refreshed = await getBlogs();
      setPosts(refreshed);
      setSuggestionsNotice(null);
      setMessage(
        `Saved. Open the public post (button in yellow preview) and check the browser tab title — or DevTools → Elements → <meta name="description">.`
      );
    } catch {
      setMessage('Save failed — check console and Firestore rules.');
    } finally {
      setSaving(false);
    }
  }

  function applySuggestions() {
    if (!audit || !selected) return;
    setSeo({
      ...seo,
      metaTitle: audit.suggested.metaTitle,
      metaDescription: audit.suggested.metaDescription,
    });
    setSuggestionsNotice(
      `Filled meta title (${audit.suggested.metaTitle.length} chars) and description (${audit.suggested.metaDescription.length} chars) from your post text — rule-based trim, not AI. OG image is never auto-filled. Review the yellow preview, then click Apply to post.`
    );
    setMessage(null);
  }

  if (loading) {
    return <p className="text-gray-500">Loading posts…</p>;
  }

  if (posts.length === 0) {
    return <p className="text-gray-500">No blog posts yet. Create one under Blog Posts first.</p>;
  }

  return (
    <Card className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Search className="h-6 w-6 text-purple-600 shrink-0" />
        <div>
          <h2 className="text-xl font-black">SEO audit (rules)</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
            <strong>Not AI</strong> — free rules trim your title/excerpt into meta tags.{' '}
            <strong>Use suggestions</strong> only fills the two text fields below;{' '}
            <strong>Apply to post</strong> saves them. The yellow box shows what the live blog
            will use. AI meta suggestions are planned later (Promo agent is separate).
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel
            htmlFor="seo-post-select"
            label="Post"
            tip="Which blog post to audit and update. Changes apply only after you click Apply to post."
            hint="Same posts as Admin → Blog Posts."
          />
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger id="seo-post-select" className="border-2 border-black font-medium">
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

        {audit && (
          <div className="flex items-end gap-3">
            <div
              className="rounded-xl border-3 border-black bg-yellow-300 px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              title="0–100 from rule checks. Warnings lower the score; passes keep it high."
            >
              <p className="text-xs font-bold uppercase tracking-wide">Score</p>
              <p className="text-3xl font-black tabular-nums">{audit.score}</p>
              <p className="text-[10px] font-medium text-gray-800">out of 100</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-black font-bold"
              onClick={applySuggestions}
              title="Fill meta title and description with recommended lengths (you can still edit before saving)."
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Use suggestions
            </Button>
          </div>
        )}
      </div>

      {suggestionsNotice && (
        <p className="mb-4 rounded-lg border-2 border-indigo-500 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-100">
          {suggestionsNotice}
        </p>
      )}

      {selected && audit && (
        <>
          <SeoLivePreview
            post={selected}
            draftSeo={seo}
            siteLabel={portfolioConfig.label}
            publicUrl={publicUrl}
          />

          <ul className="mb-6 grid gap-2">
            {audit.findings.map((f) => (
              <li
                key={f.id}
                className={`rounded-lg border-2 px-3 py-2 text-sm font-medium ${findingStyles(f.severity)}`}
              >
                {f.message}
              </li>
            ))}
          </ul>

          <div className="mb-6 grid gap-4">
            <div className="space-y-2">
              <FieldLabel
                htmlFor="meta-title"
                label="Meta title"
                tip="Shown in the browser tab and Google results. Leave empty to use the post title on the live site."
                hint="Aim for 50–60 characters."
              />
              <Input
                id="meta-title"
                value={seo.metaTitle ?? ''}
                onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                placeholder={selected.title}
                className="border-2 border-black"
              />
              <p className="text-xs text-gray-500">
                {(seo.metaTitle ?? selected.title).length} chars · aim 50–60
              </p>
            </div>
            <div className="space-y-2">
              <FieldLabel
                htmlFor="meta-description"
                label="Meta description"
                tip="Short summary for search engines and link previews. Leave empty to use the post excerpt."
                hint="Aim for 120–160 characters."
              />
              <Textarea
                id="meta-description"
                value={seo.metaDescription ?? ''}
                onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                placeholder={selected.excerpt}
                rows={3}
                className="border-2 border-black min-h-[5rem]"
              />
              <p className="text-xs text-gray-500">
                {(seo.metaDescription ?? selected.excerpt).length} chars · aim 120–160
              </p>
            </div>
            <div className="space-y-2">
              <FieldLabel
                htmlFor="og-image"
                label="Share image URL (optional)"
                tip="Open Graph (OG) image: the large thumbnail when someone pastes your blog link on LinkedIn, Slack, Discord, or iMessage. Must be a public https:// URL (e.g. hosted on Firebase Storage or your CDN). Rules do not suggest this — add manually if you have an image."
                hint="Leave empty if you don't have a share image yet."
              />
              <Input
                id="og-image"
                value={seo.ogImage ?? ''}
                onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                placeholder="https://…"
                className="border-2 border-black"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void handleApply()}
              disabled={saving}
              title="Writes seo fields to Firestore for this post. Open the public blog URL to verify the tab title and meta tags."
              className="border-2 border-black bg-purple-600 font-black text-white hover:bg-purple-700"
            >
              <Check className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Apply to post'}
            </Button>
            {message && (
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">{message}</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

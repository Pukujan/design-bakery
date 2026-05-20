import { useEffect, useMemo, useState } from 'react';
import { Check, RefreshCw, Search } from 'lucide-react';
import { getBlogs, saveBlog, type BlogPost } from '@/lib/adminContentService';
import type { BlogSeo } from '@/modules/engineering/blogSeo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const selected = posts.find((p) => p.id === selectedId) ?? null;

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
      setMessage('SEO saved. View the public post and check page title / meta in devtools.');
    } catch {
      setMessage('Save failed — check console and Firestore rules.');
    } finally {
      setSaving(false);
    }
  }

  function applySuggestions() {
    if (!audit) return;
    setSeo({
      ...seo,
      metaTitle: audit.suggested.metaTitle,
      metaDescription: audit.suggested.metaDescription,
    });
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Free checks — apply updates via <code className="text-xs">saveBlog()</code> only.
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="seo-post-select">Post</Label>
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
            <div className="rounded-xl border-3 border-black bg-yellow-300 px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xs font-bold uppercase tracking-wide">Score</p>
              <p className="text-3xl font-black tabular-nums">{audit.score}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-black font-bold"
              onClick={applySuggestions}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Use suggestions
            </Button>
          </div>
        )}
      </div>

      {selected && audit && (
        <>
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
              <Label htmlFor="meta-title">Meta title</Label>
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
              <Label htmlFor="meta-description">Meta description</Label>
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
              <Label htmlFor="og-image">OG image URL (optional)</Label>
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

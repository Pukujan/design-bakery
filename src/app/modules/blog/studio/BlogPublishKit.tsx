import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { BlogPost } from '@/lib/adminContentService';
import { MAX_BLOG_TAGS } from '@/modules/blog/lib/parseBlogTags';
import {
  formatPublishKitMetaNote,
  formatPublishKitTagsNote,
} from './applyPublishKitSeo';
import { invokeBlogPublishKit } from './publishKitClient';
import { PublishImagePreview } from './PublishImagePreview';
import {
  formatPublishKitError,
  getPublishKitReadiness,
} from './publishKitReadiness';
import type {
  MetaTonePreset,
  PublishKitAction,
  PublishKitEditorDraft,
  PublishKitSnapshot,
  VisualMode,
  VisualStylePreset,
} from './types';

type Props = {
  post: BlogPost;
  categoryLabel?: string;
  publicUrl?: string;
  mirrorCoverToOg: boolean;
  kitDraft: PublishKitEditorDraft;
  onKitDraftChange: (patch: Partial<PublishKitEditorDraft>) => void;
  onApplySeo: (result: {
    meta?: {
      excerpt: string;
      metaTitle: string;
      metaDescription: string;
      rationale?: string;
    };
    tags?: { tags: string[]; rationale?: string };
  }) => void;
  onApplyVisual: (visual: { ogImageUrl: string; coverImageUrl: string }) => void;
  variant?: 'card' | 'panel';
};

function toSnapshot(post: BlogPost, categoryLabel?: string): PublishKitSnapshot {
  return {
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    tags: post.tags,
    category: post.category,
    categoryLabel,
    author: post.author,
    color: post.color || '#6366f1',
    numericId: post.numericId,
  };
}

const WORKFLOW_STEPS = [
  {
    n: 1,
    title: 'Draft',
    body: 'Title, excerpt, and markdown content. Save once so this post has a numeric ID.',
  },
  {
    n: 2,
    title: 'SEO text',
    body: 'Generate excerpt, meta title, description, and tags (applied to the form).',
  },
  {
    n: 3,
    title: 'Cover images',
    body: 'Generate previews → Apply to post → Save uploads to Storage.',
  },
] as const;

export function BlogPublishKit({
  post,
  categoryLabel,
  publicUrl,
  mirrorCoverToOg,
  kitDraft,
  onKitDraftChange,
  onApplySeo,
  onApplyVisual,
  variant = 'card',
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    visualStyle,
    visualMode,
    metaTone,
    variationOffset,
    stagedVisual,
    appliedToForm,
    lastTemplate,
    lastMetaNote,
    lastTagsNote,
  } = kitDraft;

  const textReadiness = useMemo(
    () => getPublishKitReadiness(post, 'meta_and_tags'),
    [post],
  );
  const visualReadiness = useMemo(
    () => getPublishKitReadiness(post, 'visual'),
    [post],
  );

  async function run(action: PublishKitAction) {
    const readiness = getPublishKitReadiness(post, action);
    if (!readiness.ready || readiness.blogId == null) {
      setError(readiness.hint ? `${readiness.message} ${readiness.hint}` : readiness.message);
      return;
    }

    setError(null);
    setBusy(action);
    try {
      const res = await invokeBlogPublishKit({
        action,
        blogId: readiness.blogId,
        blogSnapshot: toSnapshot(post, categoryLabel),
        publicUrl,
        preferences: {
          visualStyle,
          visualMode,
          metaTone,
          sameImageForCoverAndOg: mirrorCoverToOg,
          variationOffset,
        },
      });
      if (res.meta || res.tags) {
        onApplySeo({ meta: res.meta, tags: res.tags });
        onKitDraftChange({
          ...(res.meta ? { lastMetaNote: formatPublishKitMetaNote(res.meta) } : {}),
          ...(res.tags
            ? {
                lastTagsNote: formatPublishKitTagsNote({
                  tags: res.tags.tags.slice(0, MAX_BLOG_TAGS),
                  rationale: res.tags.rationale,
                }),
              }
            : {}),
        });
      }
      if (res.visual) {
        const og = res.visual.ogPreviewDataUrl;
        const cover = res.visual.coverPreviewDataUrl || og;
        const art = res.visual.usedAiArt
          ? `AI hero${res.visual.imageModel ? ` (${res.visual.imageModel})` : ''} + overlay`
          : 'template SVG';
        onKitDraftChange({
          stagedVisual: { ogPreviewDataUrl: og, coverPreviewDataUrl: cover },
          appliedToForm: false,
          lastTemplate: `${art} · ${res.visual.templateFamily} · layout ${res.visual.layoutVariant}`,
        });
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Publish kit failed';
      setError(formatPublishKitError(raw, readiness));
    } finally {
      setBusy(null);
    }
  }

  function applyStagedToForm() {
    if (!stagedVisual) return;
    onApplyVisual({
      ogImageUrl: stagedVisual.ogPreviewDataUrl,
      coverImageUrl: stagedVisual.coverPreviewDataUrl,
    });
    onKitDraftChange({ appliedToForm: true });
  }

  const statusChip =
    textReadiness.status === 'ready'
      ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
      : textReadiness.status === 'needs_save'
        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

  const shell =
    variant === 'panel'
      ? 'min-w-0 space-y-4'
      : 'min-w-0 space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30';

  return (
    <div className={shell}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">AI publish kit</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 max-w-prose">
            Follow the steps below. SEO text uses your markdown; images are previews until you{' '}
            <strong>Save post</strong>.
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusChip}`}>
          {textReadiness.message}
        </span>
      </div>

      <ol className="grid gap-2 sm:grid-cols-3">
        {WORKFLOW_STEPS.map((step) => (
          <li
            key={step.n}
            className="rounded-md border border-indigo-200/70 bg-white/60 px-3 py-2 text-xs dark:border-indigo-800 dark:bg-indigo-950/40"
          >
            <span className="font-bold text-indigo-800 dark:text-indigo-200">
              {step.n}. {step.title}
            </span>
            <p className="mt-0.5 text-gray-600 dark:text-gray-400">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 space-y-1">
          <Label className="text-xs">Cover art</Label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={visualMode}
            onChange={(e) => onKitDraftChange({ visualMode: e.target.value as VisualMode })}
          >
            <option value="hybrid">Hybrid (AI hero + text)</option>
            <option value="template">Template only (fast)</option>
            <option value="ai">AI only (no text)</option>
          </select>
        </div>
        <div className="min-w-0 space-y-1">
          <Label className="text-xs">Visual style</Label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={visualStyle}
            onChange={(e) => onKitDraftChange({ visualStyle: e.target.value as VisualStylePreset })}
          >
            <option value="auto">Auto</option>
            <option value="minimal">Minimal stripe</option>
            <option value="bold">Bold stripe</option>
            <option value="line_art">Line art decor</option>
          </select>
        </div>
        <div className="min-w-0 space-y-1">
          <Label className="text-xs">Meta tone</Label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={metaTone}
            onChange={(e) => onKitDraftChange({ metaTone: e.target.value as MetaTonePreset })}
          >
            <option value="auto">Auto</option>
            <option value="technical">Technical</option>
            <option value="friendly">Friendly</option>
            <option value="bold">Bold</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-indigo-300/50 bg-white/70 p-3 dark:border-indigo-800 dark:bg-indigo-950/50">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-900 dark:text-indigo-100">
          Step 2 — SEO text
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!!busy || !textReadiness.ready}
            title={textReadiness.ready ? undefined : textReadiness.message}
            onClick={() => run('meta_and_tags')}
          >
            {busy === 'meta_and_tags' ? 'Generating…' : 'Generate SEO text + tags'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!!busy || !getPublishKitReadiness(post, 'meta').ready}
            onClick={() => run('meta')}
          >
            {busy === 'meta' ? 'Generating…' : 'Meta only'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!!busy || !getPublishKitReadiness(post, 'tags').ready}
            onClick={() => run('tags')}
          >
            {busy === 'tags' ? 'Generating…' : 'Tags only'}
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-indigo-300/50 bg-white/70 p-3 dark:border-indigo-800 dark:bg-indigo-950/50">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-900 dark:text-indigo-100">
          Step 3 — Cover images
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!!busy || !visualReadiness.ready}
            title={visualReadiness.ready ? undefined : visualReadiness.message}
            onClick={() => run('visual')}
          >
            {busy === 'visual' ? 'Rendering…' : 'Generate images'}
          </Button>
          {stagedVisual && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!!busy}
              onClick={applyStagedToForm}
              title="Copy preview into OG / cover fields (still uploads on Save)"
            >
              {appliedToForm ? 'Applied — save post to upload' : 'Apply to post'}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!!busy}
            onClick={() => onKitDraftChange({ variationOffset: variationOffset + 1 })}
            title="Next layout variant on next image run"
          >
            Shuffle layout (+{variationOffset})
          </Button>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          One hero is cropped to cover (3:2) and social (wide). After Apply, click <strong>Save post</strong>{' '}
          to upload HTTPS URLs.
        </p>
      </div>

      <button
        type="button"
        className="text-xs font-medium text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? 'Hide' : 'Show'} advanced actions
      </button>

      {showAdvanced && (
        <div className="flex flex-wrap gap-2 border-t border-indigo-200/60 pt-2 dark:border-indigo-800">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!!busy || !textReadiness.ready || !visualReadiness.ready}
            onClick={() => run('visual_and_meta')}
          >
            {busy === 'visual_and_meta' ? 'Working…' : 'Everything (SEO + images)'}
          </Button>
        </div>
      )}

      {lastMetaNote && (
        <p className="text-xs text-gray-600 dark:text-gray-400">Last meta: {lastMetaNote}</p>
      )}
      {lastTagsNote && (
        <p className="text-xs text-gray-600 dark:text-gray-400">Last tags: {lastTagsNote}</p>
      )}
      {lastTemplate && (
        <p className="text-xs text-gray-600 dark:text-gray-400">Last render: {lastTemplate}</p>
      )}

      {stagedVisual && (
        <div className="grid min-w-0 grid-cols-1 gap-3 border-t border-indigo-200/60 pt-3 dark:border-indigo-800">
          <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">
            Preview {appliedToForm ? '(applied — save post to upload)' : '(apply before save)'}
          </p>
          <PublishImagePreview
            url={stagedVisual.ogPreviewDataUrl}
            label="Social / OG card"
            size="large"
          />
          {stagedVisual.coverPreviewDataUrl !== stagedVisual.ogPreviewDataUrl && (
            <PublishImagePreview
              url={stagedVisual.coverPreviewDataUrl}
              label="Cover card"
              size="large"
            />
          )}
        </div>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

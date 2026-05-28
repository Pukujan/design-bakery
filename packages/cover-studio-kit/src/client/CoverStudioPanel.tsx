import { useMemo, useState } from 'react';
import {
  COVER_STUDIO_STANDALONE_BLOG_ID,
  DEFAULT_COVER_STUDIO_DRAFT,
  MAX_COVER_STUDIO_TAGS,
  type CoverStudioDraft,
  type CoverStudioPreferences,
  type CoverStudioSnapshot,
  type StagedVisual,
  type VisualMode,
  type VisualStylePreset,
} from '../types.js';
import type { CoverStudioClient } from './api.js';
import type { GalleryClient } from './galleryApi.js';
import { SocialAppPreview } from './SocialAppPreview.js';
import { getCoverStudioReadiness, getCoverStudioTagReadiness } from './readiness.js';

export type CoverStudioInput = {
  title: string;
  description: string;
  selectedTags: string[];
  color: string;
};

export type CoverStudioPanelProps = {
  client: CoverStudioClient;
  galleryClient?: GalleryClient;
  blogId?: number;
  value: CoverStudioInput;
  onChange: (patch: Partial<CoverStudioInput>) => void;
  draft?: CoverStudioDraft;
  onDraftChange?: (patch: Partial<CoverStudioDraft>) => void;
  mirrorCoverToOg?: boolean;
  onMirrorCoverToOgChange?: (value: boolean) => void;
  onGallerySaved?: () => void;
  className?: string;
};

const LAYOUT_VARIANTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'] as const;

function layoutForOffset(seed: number, offset: number): string {
  return LAYOUT_VARIANTS[(Math.abs(seed) + offset) % LAYOUT_VARIANTS.length];
}

function randomTemplateSalt(): number {
  return Math.floor(Math.random() * 2_147_483_647);
}

function shuffleVariationJump(): number {
  return 1 + Math.floor(Math.random() * 15);
}

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toSnapshot(input: CoverStudioInput, blogId: number): CoverStudioSnapshot {
  return {
    title: input.title,
    excerpt: input.description,
    content: input.description,
    tags: input.selectedTags.slice(0, MAX_COVER_STUDIO_TAGS),
    color: input.color || '#6366f1',
    numericId: blogId,
    coverStudioMode: true,
  };
}

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';
const selectClass = inputClass;
const btnClass =
  'inline-flex items-center justify-center rounded-md border border-gray-800 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700';
const btnPrimaryClass =
  'inline-flex items-center justify-center rounded-md border border-indigo-700 bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50';
const tagChipClass =
  'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer';
const tagChipOn =
  'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-500';
const tagChipOff =
  'border-gray-300 bg-white text-gray-700 hover:border-indigo-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200';

export function CoverStudioPanel({
  client,
  galleryClient,
  blogId = COVER_STUDIO_STANDALONE_BLOG_ID,
  value,
  onChange,
  draft: controlledDraft,
  onDraftChange,
  mirrorCoverToOg = true,
  onMirrorCoverToOgChange,
  onGallerySaved,
  className = '',
}: CoverStudioPanelProps) {
  const [internalDraft, setInternalDraft] = useState<CoverStudioDraft>(DEFAULT_COVER_STUDIO_DRAFT);
  const draft = controlledDraft ?? internalDraft;
  const patchDraft = (p: Partial<CoverStudioDraft>) => {
    if (onDraftChange) onDraftChange(p);
    else setInternalDraft((d) => ({ ...d, ...p }));
  };

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [staged, setStaged] = useState<StagedVisual | null>(null);
  const [galleryNote, setGalleryNote] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [tagRationale, setTagRationale] = useState<string | null>(null);

  const snapshot = useMemo(() => toSnapshot(value, blogId), [value, blogId]);
  const fieldReady = useMemo(() => getCoverStudioReadiness(snapshot), [snapshot]);
  const generateReady = useMemo(() => getCoverStudioTagReadiness(snapshot), [snapshot]);

  const { visualStyle, visualMode, variationOffset, templateIconPool } = draft;
  const nextLayout = layoutForOffset(blogId, variationOffset);

  function toggleTag(tag: string) {
    const key = tag.toLowerCase();
    const current = value.selectedTags;
    const has = current.some((t) => t.toLowerCase() === key);
    if (has) {
      onChange({ selectedTags: current.filter((t) => t.toLowerCase() !== key) });
      return;
    }
    if (current.length >= MAX_COVER_STUDIO_TAGS) return;
    onChange({ selectedTags: [...current, tag] });
  }

  async function runSuggestTags() {
    if (!fieldReady.ready) {
      setError(fieldReady.hint ? `${fieldReady.message} ${fieldReady.hint}` : fieldReady.message);
      return;
    }
    setError(null);
    setBusy('suggest_tags');
    try {
      const res = await client.invoke({
        action: 'suggest_tags',
        blogId,
        blogSnapshot: snapshot,
      });
      const list = res.suggestTags?.suggestedTags ?? [];
      setSuggestedTags(list);
      setTagRationale(res.suggestTags?.rationale ?? null);
      if (list.length > 0 && value.selectedTags.length === 0) {
        onChange({ selectedTags: list.slice(0, MAX_COVER_STUDIO_TAGS) });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tag suggestion failed');
    } finally {
      setBusy(null);
    }
  }

  async function runVisual(prefOverrides?: Partial<CoverStudioPreferences>) {
    if (!generateReady.ready) {
      setError(
        generateReady.hint ? `${generateReady.message} ${generateReady.hint}` : generateReady.message,
      );
      return;
    }
    const runOffset = prefOverrides?.variationOffset ?? variationOffset;
    const prefs: CoverStudioPreferences = {
      visualStyle,
      visualMode,
      sameImageForCoverAndOg: mirrorCoverToOg,
      variationOffset: runOffset,
      ...(templateIconPool && templateIconPool.length >= 2 ? { templateIconPool } : {}),
      ...prefOverrides,
    };
    if (prefOverrides?.variationOffset !== undefined) {
      patchDraft({ variationOffset: prefOverrides.variationOffset });
    }

    setError(null);
    setGalleryNote(null);
    setBusy('visual');
    try {
      const res = await client.invoke({
        action: 'visual',
        blogId,
        blogSnapshot: snapshot,
        preferences: prefs,
      });
      if (res.normalizedCopy?.changed) {
        onChange({
          title: res.normalizedCopy.title,
          description: res.normalizedCopy.description,
        });
      }
      if (res.visual?.socialVariants?.length) {
        const art = res.visual.usedAiArt
          ? `AI hero${res.visual.imageModel ? ` (${res.visual.imageModel})` : ''}`
          : 'template SVG';
        setStaged({
          socialVariants: res.visual.socialVariants,
          usedAiArt: res.visual.usedAiArt,
          lastTemplate: `${art} · ${res.visual.templateFamily} · layout ${res.visual.layoutVariant}`,
        });
        patchDraft({
          variationOffset: runOffset + 1,
          ...(res.visual.templateIconPool?.length
            ? { templateIconPool: res.visual.templateIconPool }
            : { templateIconPool: null }),
        });
        if (res.gallerySave?.ok) {
          const mediaNote =
            res.mediaLibrarySave?.ok === true
              ? ' Text-free hero (1024×1024) saved to Media Library.'
              : res.mediaLibrarySave?.ok === false
                ? ` Media Library save failed: ${res.mediaLibrarySave.message ?? 'unknown error'}.`
                : '';
          setGalleryNote(
            `Saved ${res.gallerySave.assetCount ?? res.visual.socialVariants.length} export(s) to Cover Studio gallery.${mediaNote}`,
          );
          onGallerySaved?.();
        } else if (res.gallerySave?.ok === false) {
          setGalleryNote(null);
          setError(
            res.gallerySave.message
              ? `Gallery save failed: ${res.gallerySave.message}`
              : 'Gallery save failed. Use Save to Cover Studio library or run Supabase migrations 006–008.',
          );
        } else {
          setGalleryNote(
            'Previews ready. Gallery auto-save status unknown — click Save to Cover Studio library if needed.',
          );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image generation failed');
    } finally {
      setBusy(null);
    }
  }

  async function saveToGallery() {
    if (!galleryClient || !staged) return;
    setError(null);
    setGalleryNote(null);
    setBusy('gallery');
    try {
      const base = slugify(value.title) || `cover-${Date.now()}`;
      const ts = Date.now();
      const tags = value.selectedTags.slice(0, MAX_COVER_STUDIO_TAGS);
      const files = staged.socialVariants.map((v) => ({
        filename: `${base}-${v.id}-${ts}.png`,
        slug: `${base}-${v.id}-${ts}`,
        dataUrl: v.previewDataUrl,
        tags: [...tags, v.platform.toLowerCase(), v.id],
        altText: `${value.title} — ${v.label}`,
        notes: `Cover Studio · ${v.width}×${v.height}`,
        formatId: v.id,
        platform: v.platform,
      }));
      const assets = await galleryClient.upload(files, {
        packTitle: value.title.trim() || undefined,
      });
      setGalleryNote(`Saved ${assets.length} platform export(s) to Cover Studio library.`);
      onGallerySaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gallery save failed');
    } finally {
      setBusy(null);
    }
  }

  function downloadDataUrl(dataUrl: string, filename: string) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  const allTagOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const t of [...suggestedTags, ...value.selectedTags]) {
      const key = t.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
    return out;
  }, [suggestedTags, value.selectedTags]);

  return (
    <div
      className={`min-w-0 space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30 ${className}`}
    >
      <div className="space-y-1">
        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Cover &amp; social studio</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 max-w-prose">
          One generation → nine platform-sized exports (Instagram, LinkedIn, Facebook, TikTok, X) with
          typography scaled per size. Live in-app previews below; auto-saved to Cover Studio library.
        </p>
      </div>

      <div className="grid gap-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium">Title</span>
          <input
            className={inputClass}
            value={value.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="What is this cover for?"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium">Description</span>
          <textarea
            className={`${inputClass} min-h-[5rem]`}
            value={value.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Short summary — drives the card text and image mood"
          />
        </label>
        <label className="block space-y-1 max-w-[12rem]">
          <span className="text-xs font-medium">Accent color</span>
          <input
            type="color"
            className="h-9 w-full cursor-pointer rounded border border-gray-300 dark:border-gray-700"
            value={value.color}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </label>
      </div>

      <div className="space-y-2 rounded-lg border border-indigo-200/80 bg-white/70 p-3 dark:border-indigo-800 dark:bg-indigo-950/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">
            Visual tags ({value.selectedTags.length}/{MAX_COVER_STUDIO_TAGS})
          </p>
          <button
            type="button"
            className={btnClass}
            disabled={!!busy || !fieldReady.ready}
            onClick={() => void runSuggestTags()}
          >
            {busy === 'suggest_tags' ? 'Suggesting…' : 'Suggest tags'}
          </button>
        </div>
        {tagRationale ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">{tagRationale}</p>
        ) : null}
        {allTagOptions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allTagOptions.map((tag) => {
              const selected = value.selectedTags.some((t) => t.toLowerCase() === tag.toLowerCase());
              const disabled = !selected && value.selectedTags.length >= MAX_COVER_STUDIO_TAGS;
              return (
                <button
                  key={tag}
                  type="button"
                  disabled={disabled}
                  className={`${tagChipClass} ${selected ? tagChipOn : tagChipOff} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Add title and description, then suggest tags to pick visual themes for the image.
          </p>
        )}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium">Cover art</span>
          <select
            className={selectClass}
            value={visualMode}
            onChange={(e) => patchDraft({ visualMode: e.target.value as VisualMode })}
          >
            <option value="hybrid">Hybrid (AI hero + text)</option>
            <option value="template">Template only (fast)</option>
            <option value="ai">AI only (no text)</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium">Visual style</span>
          <select
            className={selectClass}
            value={visualStyle}
            onChange={(e) => patchDraft({ visualStyle: e.target.value as VisualStylePreset })}
          >
            <option value="auto">Auto</option>
            <option value="minimal">Minimal stripe</option>
            <option value="bold">Bold stripe</option>
            <option value="line_art">Line art decor</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btnPrimaryClass}
          disabled={!!busy || !generateReady.ready}
          title={generateReady.ready ? undefined : generateReady.message}
          onClick={() => void runVisual({ templateSalt: randomTemplateSalt() })}
        >
          {busy === 'visual'
            ? 'Rendering 9 sizes…'
            : visualMode === 'template'
              ? `Generate 9 social sizes (layout ${nextLayout})`
              : 'Generate 9 social sizes'}
        </button>
        {visualMode === 'template' && (
          <button
            type="button"
            className={btnClass}
            disabled={!!busy || !generateReady.ready}
            onClick={() =>
              void runVisual({
                refreshTemplateIcons: true,
                templateSalt: randomTemplateSalt(),
              })
            }
          >
            Pick icons (AI)
          </button>
        )}
        <button
          type="button"
          className={btnClass}
          disabled={!!busy || !generateReady.ready}
          onClick={() =>
            void runVisual({
              variationOffset: variationOffset + shuffleVariationJump(),
              templateSalt: randomTemplateSalt(),
            })
          }
        >
          Shuffle layout
        </button>
        {galleryClient && staged ? (
          <button
            type="button"
            className={btnClass}
            disabled={!!busy}
            onClick={() => void saveToGallery()}
          >
            {busy === 'gallery' ? 'Saving…' : 'Save to Cover Studio library'}
          </button>
        ) : null}
      </div>

      {staged?.socialVariants?.length ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">
            In-app previews ({staged.socialVariants.length} sizes)
          </p>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {staged.socialVariants.map((variant) => (
              <SocialAppPreview
                key={variant.id}
                variant={variant}
                onDownload={() =>
                  downloadDataUrl(
                    variant.previewDataUrl,
                    `${slugify(value.title) || 'export'}-${variant.id}.png`,
                  )
                }
              />
            ))}
          </div>
          {staged.lastTemplate ? (
            <p className="text-xs text-gray-600 dark:text-gray-400">{staged.lastTemplate}</p>
          ) : null}
        </div>
      ) : null}

      {galleryNote ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">{galleryNote}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}

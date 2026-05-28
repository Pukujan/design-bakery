export const PUBLISH_KIT_API_VERSION = 1 as const;

export type PublishKitAction =
  | 'meta'
  | 'visual'
  | 'visual_and_meta'
  | 'tags'
  | 'meta_and_tags'
  | 'commit_visual'
  | 'suggest_tags';

export type VisualStylePreset = 'auto' | 'minimal' | 'bold' | 'line_art';
export type MetaTonePreset = 'auto' | 'technical' | 'friendly' | 'bold';
/** hybrid = OpenRouter hero art + readable text overlay (default). */
export type VisualMode = 'hybrid' | 'template' | 'ai';

export type PublishKitSnapshot = {
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  category: string;
  /** Human label for template (e.g. "AI & ML"); falls back to category id map. */
  categoryLabel?: string;
  author: string;
  color: string;
  numericId?: number;
  /** Existing SEO fields (used for contextual template icons). */
  metaTitle?: string;
  metaDescription?: string;
  /** Cover Studio: title + description only; no markdown body required. */
  coverStudioMode?: boolean;
};

export type PublishKitPreferences = {
  visualStyle?: VisualStylePreset;
  metaTone?: MetaTonePreset;
  visualMode?: VisualMode;
  /** Override OPENROUTER_IMAGE_MODEL (e.g. google/gemini-2.5-flash-image). */
  imageModel?: string;
  sameImageForCoverAndOg?: boolean;
  variationOffset?: number;
  /** Extra entropy for shuffle / remix (client random int). */
  templateSalt?: number;
  /** Reuse agent-picked icons on shuffle (omit to refresh from content). */
  templateIconPool?: string[];
  /** When true, call the icon agent (costs tokens). Omit/false on layout shuffle. */
  refreshTemplateIcons?: boolean;
  /**
   * When true (default), hybrid tries Supabase hero cache by tag/category slugs before OpenRouter.
   * Set false to force a fresh image model call.
   */
  preferHeroCache?: boolean;
};

export type PublishKitVisualCommit = {
  ogPreviewDataUrl: string;
  coverPreviewDataUrl?: string;
  sameImageForCoverAndOg?: boolean;
};

export type PublishKitRequest = {
  version: typeof PUBLISH_KIT_API_VERSION;
  action: PublishKitAction;
  blogId: number;
  blogSnapshot?: PublishKitSnapshot;
  preferences?: PublishKitPreferences;
  publicUrl?: string;
  /** Used with action commit_visual — uploads on save, not at generate time. */
  visualCommit?: PublishKitVisualCommit;
};

export type PublishKitMetaResult = {
  /** Short summary for blog list cards (max ~200 chars). */
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  rationale?: string;
};

export type PublishKitTagsResult = {
  tags: string[];
  rationale?: string;
};

export type PublishKitSuggestTagsResult = {
  suggestedTags: string[];
  rationale?: string;
};

export type PublishKitNormalizedCopy = {
  title: string;
  description: string;
  changed: boolean;
};

/** Preview-only result from visual / visual_and_meta (no Storage upload). */
export type PublishKitVisualResult = {
  ogPreviewDataUrl: string;
  coverPreviewDataUrl: string;
  templateFamily: string;
  layoutVariant: string;
  panelMode: 'light' | 'dark';
  imageModel?: string;
  usedAiArt?: boolean;
  /** HTTPS URLs after commit_visual */
  ogImageUrl?: string;
  coverImageUrl?: string;
  /** 640×360 list card (from cover) */
  thumbnailImageUrl?: string;
  /** 800×420 admin / preview variant (full OG stays in ogImageUrl for meta tags) */
  ogImageThumbUrl?: string;
  /** JPEG unfurl for Slack/Discord/LinkedIn (from commit_visual). */
  socialOgImageUrl?: string;
  /** Colorful flat sticker ids chosen for this post (template mode). */
  templateIconPool?: string[];
  templateIconRationale?: string;
  /** Text-free hero source before title overlay (hybrid / ai). */
  heroSource?: 'cache' | 'openrouter';
  heroCacheId?: string;
  heroCacheScore?: number;
};

export type PublishKitSocialVariant = {
  id: string;
  label: string;
  platform: string;
  width: number;
  height: number;
  previewFrame: string;
  previewDataUrl: string;
};

export type PublishKitGallerySaveResult = {
  ok: boolean;
  packId?: string;
  assetCount?: number;
  message?: string;
};

export type PublishKitResponse = {
  ok: true;
  action: PublishKitAction;
  meta?: PublishKitMetaResult;
  tags?: PublishKitTagsResult;
  suggestTags?: PublishKitSuggestTagsResult;
  normalizedCopy?: PublishKitNormalizedCopy;
  gallerySave?: PublishKitGallerySaveResult;
  mediaLibrarySave?: PublishKitGallerySaveResult;
  visual?: PublishKitVisualResult & {
    /** Cover Studio: nine platform exports with in-app preview metadata. */
    socialVariants?: PublishKitSocialVariant[];
  };
};

export const PUBLISH_KIT_API_VERSION = 1 as const;

export type PublishKitAction =
  | 'meta'
  | 'visual'
  | 'visual_and_meta'
  | 'tags'
  | 'meta_and_tags'
  | 'commit_visual';

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
};

export type PublishKitPreferences = {
  visualStyle?: VisualStylePreset;
  metaTone?: MetaTonePreset;
  visualMode?: VisualMode;
  /** Override OPENROUTER_IMAGE_MODEL (e.g. google/gemini-2.5-flash-image). */
  imageModel?: string;
  sameImageForCoverAndOg?: boolean;
  variationOffset?: number;
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
};

export type PublishKitResponse = {
  ok: true;
  action: PublishKitAction;
  meta?: PublishKitMetaResult;
  tags?: PublishKitTagsResult;
  visual?: PublishKitVisualResult;
};

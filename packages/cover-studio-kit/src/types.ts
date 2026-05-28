/** API contract version — must match backend publish kit handler. */
export const COVER_STUDIO_API_VERSION = 1 as const;

/** Snapshot-only publish-kit id (no CMS post required). */
export const COVER_STUDIO_STANDALONE_BLOG_ID = 900_001;

export const MAX_COVER_STUDIO_TAGS = 5;

export type CoverStudioAction =
  | 'visual'
  | 'suggest_tags'
  | 'commit_visual';

export type VisualStylePreset = 'auto' | 'minimal' | 'bold' | 'line_art';
export type VisualMode = 'hybrid' | 'template' | 'ai';

export type CoverStudioSnapshot = {
  title: string;
  /** Short description — used for card blurb and image prompts (no markdown body). */
  excerpt: string;
  content?: string;
  tags?: string[];
  category?: string;
  author?: string;
  color: string;
  numericId?: number;
  coverStudioMode?: boolean;
};

export type CoverStudioPreferences = {
  visualStyle?: VisualStylePreset;
  visualMode?: VisualMode;
  imageModel?: string;
  sameImageForCoverAndOg?: boolean;
  variationOffset?: number;
  templateSalt?: number;
  templateIconPool?: string[];
  refreshTemplateIcons?: boolean;
};

export type CoverStudioVisualCommit = {
  ogPreviewDataUrl: string;
  coverPreviewDataUrl?: string;
  sameImageForCoverAndOg?: boolean;
};

export type SocialVariantPreview = {
  id: string;
  label: string;
  platform: string;
  width: number;
  height: number;
  previewFrame: string;
  previewDataUrl: string;
};

export type StagedVisual = {
  socialVariants: SocialVariantPreview[];
  lastTemplate?: string | null;
  usedAiArt?: boolean;
  /** @deprecated use socialVariants */
  ogPreviewDataUrl?: string;
  coverPreviewDataUrl?: string;
};

export type CoverStudioDraft = {
  visualStyle: VisualStylePreset;
  visualMode: VisualMode;
  variationOffset: number;
  templateIconPool: string[] | null;
};

export const DEFAULT_COVER_STUDIO_DRAFT: CoverStudioDraft = {
  visualStyle: 'auto',
  visualMode: 'hybrid',
  variationOffset: 0,
  templateIconPool: null,
};

export type CoverStudioResponse = {
  ok: true;
  action: CoverStudioAction | string;
  suggestTags?: {
    suggestedTags: string[];
    rationale?: string;
  };
  normalizedCopy?: NormalizedCoverCopy;
  gallerySave?: GallerySaveResult;
  mediaLibrarySave?: GallerySaveResult;
  visual?: {
    ogPreviewDataUrl?: string;
    coverPreviewDataUrl?: string;
    socialVariants?: SocialVariantPreview[];
    templateFamily: string;
    layoutVariant: string;
    panelMode: 'light' | 'dark';
    imageModel?: string;
    usedAiArt?: boolean;
    templateIconPool?: string[];
    templateIconRationale?: string;
  };
};

export type QueuedGalleryUpload = {
  filename?: string;
  dataUrl: string;
  slug?: string;
  tags?: string[];
  altText?: string;
  notes?: string;
  formatId?: string;
  platform?: string;
};

export type GalleryAsset = {
  id: string;
  filename: string;
  slug: string | null;
  metaTags: string[];
  formatId?: string | null;
  platform?: string | null;
  packId?: string | null;
  packTitle?: string | null;
  url: string;
  storagePath: string;
  contentType: string;
  byteSize: number | null;
  altText: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GalleryPack = {
  packId: string;
  title: string;
  tags: string[];
  coverUrl: string;
  exportCount: number;
  createdAt: string;
  assets: GalleryAsset[];
};

export type NormalizedCoverCopy = {
  title: string;
  description: string;
  changed: boolean;
};

export type GallerySaveResult = {
  ok: boolean;
  packId?: string;
  assetCount?: number;
  message?: string;
};

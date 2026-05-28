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
/** hybrid = AI hero + readable text overlay. template = fast SVG (default). */
export type VisualMode = 'hybrid' | 'template' | 'ai';

export type PublishKitSnapshot = {
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  category: string;
  categoryLabel?: string;
  author: string;
  color: string;
  numericId?: number;
  metaTitle?: string;
  metaDescription?: string;
};

export type PublishKitVisualCommit = {
  ogPreviewDataUrl: string;
  coverPreviewDataUrl?: string;
  sameImageForCoverAndOg?: boolean;
};

export type PublishKitPreferences = {
  visualStyle?: VisualStylePreset;
  metaTone?: MetaTonePreset;
  visualMode?: VisualMode;
  imageModel?: string;
  sameImageForCoverAndOg?: boolean;
  variationOffset?: number;
  /** Extra entropy for shuffle / remix (client random int). */
  templateSalt?: number;
  /** Reuse agent-picked icons on shuffle (omit to refresh from content). */
  templateIconPool?: string[];
  /** When true, call the icon agent (costs tokens). Omit/false on layout shuffle. */
  refreshTemplateIcons?: boolean;
};

export type StagedVisualDraft = {
  ogPreviewDataUrl: string;
  coverPreviewDataUrl: string;
};

/** Persisted in BlogEditor while editing (survives Collapse). */
export type PublishKitEditorDraft = {
  visualStyle: VisualStylePreset;
  visualMode: VisualMode;
  metaTone: MetaTonePreset;
  variationOffset: number;
  stagedVisual: StagedVisualDraft | null;
  appliedToForm: boolean;
  lastTemplate: string | null;
  lastMetaNote: string | null;
  lastTagsNote: string | null;
  /** Agent-picked sticker ids; reused on shuffle. */
  templateIconPool: string[] | null;
};

export const DEFAULT_PUBLISH_KIT_EDITOR_DRAFT: PublishKitEditorDraft = {
  visualStyle: 'auto',
  visualMode: 'template',
  metaTone: 'auto',
  variationOffset: 0,
  stagedVisual: null,
  appliedToForm: false,
  lastTemplate: null,
  lastMetaNote: null,
  lastTagsNote: null,
  templateIconPool: null,
};

export type PublishKitResponse = {
  ok: true;
  action: PublishKitAction;
  meta?: {
    excerpt: string;
    metaTitle: string;
    metaDescription: string;
    rationale?: string;
  };
  tags?: {
    tags: string[];
    rationale?: string;
  };
  visual?: {
    ogPreviewDataUrl: string;
    coverPreviewDataUrl: string;
    templateFamily: string;
    layoutVariant: string;
    panelMode: 'light' | 'dark';
    imageModel?: string;
    usedAiArt?: boolean;
    ogImageUrl?: string;
    coverImageUrl?: string;
    thumbnailImageUrl?: string;
    ogImageThumbUrl?: string;
    socialOgImageUrl?: string;
    templateIconPool?: string[];
    templateIconRationale?: string;
  };
};

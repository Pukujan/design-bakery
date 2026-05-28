/** Mirrors backend coverStudio/socialFormats.ts for client previews. */
export type SocialPreviewFrame =
  | 'instagram-feed'
  | 'instagram-portrait'
  | 'instagram-story'
  | 'linkedin-feed'
  | 'linkedin-cover'
  | 'facebook-feed'
  | 'facebook-cover'
  | 'tiktok'
  | 'x-feed';

export type SocialVariantPreview = {
  id: string;
  label: string;
  platform: string;
  width: number;
  height: number;
  previewFrame: SocialPreviewFrame | string;
  previewDataUrl: string;
};

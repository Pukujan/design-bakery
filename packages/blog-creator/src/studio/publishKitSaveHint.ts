import { isDataImageUrl, isOversizedDataImageUrl } from '@design-bakery/blog-core/lib/parseBlogTags';

export type PublishKitImageFormState = {
  og: string;
  cover: string;
};

/** What to show in the editor when OG/cover fields hold generate previews. */
export function getPublishKitImageFormHint(state: PublishKitImageFormState): string | null {
  const og = state.og.trim();
  const cover = state.cover.trim();
  const hasData = isDataImageUrl(og) || isDataImageUrl(cover);
  if (!hasData) return null;

  const oversized = isOversizedDataImageUrl(og) || isOversizedDataImageUrl(cover);
  if (oversized) {
    return (
      'Large image previews are stored as temporary data URLs. Save post uploads them to Storage (Apply to post is optional — previews are merged on save).'
    );
  }
  return 'Generated previews upload to Storage when you save (Apply to post is optional).';
}

export function publishKitImagesNeedUpload(state: PublishKitImageFormState): boolean {
  return isDataImageUrl(state.og.trim()) || isDataImageUrl(state.cover.trim());
}

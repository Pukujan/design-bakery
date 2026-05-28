import type { GalleryAsset } from './types.js';
import type { SocialVariantPreview } from './socialFormats.js';
import { EXPORT_FORMAT_ORDER, formatMetaForId } from './socialFormatMeta.js';

export function galleryAssetsToSocialVariants(assets: GalleryAsset[]): SocialVariantPreview[] {
  const exports = assets.filter((a) => a.formatId && a.formatId !== 'hero-raw');
  const sorted = [...exports].sort((a, b) => {
    const ai = EXPORT_FORMAT_ORDER.indexOf(a.formatId!);
    const bi = EXPORT_FORMAT_ORDER.indexOf(b.formatId!);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return sorted.map((asset) => {
    const meta = formatMetaForId(asset.formatId);
    return {
      id: asset.formatId!,
      label: meta?.label ?? asset.formatId!.replace(/-/g, ' '),
      platform: asset.platform ?? meta?.platform ?? 'Social',
      width: meta?.width ?? 1080,
      height: meta?.height ?? 1080,
      previewFrame: meta?.previewFrame ?? 'instagram-feed',
      previewDataUrl: asset.url,
    };
  });
}

export async function downloadImageUrl(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

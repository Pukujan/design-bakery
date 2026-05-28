import sharp from './sharpWithFonts.js';
import { OG_SIZE, OG_THUMB_SIZE, THUMBNAIL_SIZE } from './visualFormats.js';

export { THUMBNAIL_SIZE, OG_THUMB_SIZE } from './visualFormats.js';

/** List card — fit full cover inside frame (letterbox); avoids cropping title art on the sides. */
export async function resizeCoverThumbnail(png: Buffer): Promise<Buffer> {
  return sharp(png)
    .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, {
      fit: 'contain',
      background: { r: 248, g: 250, b: 252, alpha: 1 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Admin social preview — square crop from OG composite. */
export async function resizeOgThumbnail(png: Buffer): Promise<Buffer> {
  return sharp(png)
    .resize(OG_THUMB_SIZE.width, OG_THUMB_SIZE.height, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Slack/Discord/LinkedIn unfurl — JPEG keeps previews under ~500KB. */
export async function resizeOgSocialJpeg(png: Buffer): Promise<Buffer> {
  return sharp(png)
    .resize(OG_SIZE.width, OG_SIZE.height, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
}

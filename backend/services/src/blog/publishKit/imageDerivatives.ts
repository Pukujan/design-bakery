import sharp from 'sharp';
import { OG_THUMB_SIZE, THUMBNAIL_SIZE } from './visualFormats.js';

export { THUMBNAIL_SIZE, OG_THUMB_SIZE } from './visualFormats.js';

/** List card — square crop from cover composite. */
export async function resizeCoverThumbnail(png: Buffer): Promise<Buffer> {
  return sharp(png)
    .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, { fit: 'cover', position: 'centre' })
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

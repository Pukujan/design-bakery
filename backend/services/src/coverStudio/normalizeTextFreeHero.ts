import sharp from '../blog/publishKit/sharpWithFonts.js';
import { MASTER_HERO_SIZE } from '../blog/publishKit/visualFormats.js';

/** Text-free AI hero at the canonical 1024×1024 master size for Media Library. */
export async function normalizeTextFreeHeroPng(raw: Buffer): Promise<Buffer> {
  return sharp(raw)
    .resize(MASTER_HERO_SIZE.width, MASTER_HERO_SIZE.height, {
      fit: 'cover',
      position: 'north',
    })
    .png()
    .toBuffer();
}

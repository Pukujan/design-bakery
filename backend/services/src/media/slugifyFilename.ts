/** Turn model OCR output into a safe display/storage basename (no extension). */
export function slugifyFilename(raw: string, maxLen = 80): string {
  const stripped = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\.(png|jpe?g|webp|gif|svg)$/i, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  const slug = stripped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen);

  return slug || 'image';
}

export function parseImageDataUrl(dataUrl: string): {
  buffer: Buffer;
  contentType: string;
  ext: string;
} {
  const match = dataUrl.trim().match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Expected a base64 data:image URL');
  }
  const contentType = match[1].toLowerCase();
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png';
  return {
    contentType,
    ext: ext === 'svg+xml' ? 'svg' : ext,
    buffer: Buffer.from(match[2], 'base64'),
  };
}

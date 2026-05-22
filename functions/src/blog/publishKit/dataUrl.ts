export function dataUrlToBuffer(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/);
  if (!match) {
    throw new Error('Expected a base64 data:image URL');
  }
  return Buffer.from(match[1], 'base64');
}

export function isDataImageUrl(url: string | undefined): boolean {
  return Boolean(url?.trim().startsWith('data:image/'));
}

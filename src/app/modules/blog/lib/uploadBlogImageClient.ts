import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { assertFirebaseConfigured, auth, firebaseApp } from '@/lib/firebase';
import { getStorage } from 'firebase/storage';

function storage() {
  assertFirebaseConfigured();
  return getStorage(firebaseApp!);
}

function assertAdminSignedInForStorage() {
  if (!auth?.currentUser) {
    throw new Error(
      'Sign in to admin before uploading images. Firebase Storage rules require an authenticated session.',
    );
  }
}

function mapStorageError(err: unknown): Error {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  const message = err instanceof Error ? err.message : String(err);
  if (code === 'storage/unauthorized' || /permission|403/i.test(message)) {
    return new Error(
      'Storage denied this upload. Sign in to admin, then try Save again. If it persists, run: firebase deploy --only storage',
    );
  }
  if (code === 'storage/unauthenticated') {
    return new Error('Storage upload requires admin sign-in. Log in and try Save again.');
  }
  return err instanceof Error ? err : new Error(message);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error('Could not read image preview data.');
  return res.blob();
}

/** Center-crop resize to PNG blob (browser canvas). */
async function resizeDataUrlCrop(
  dataUrl: string,
  width: number,
  height: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not available'));
        return;
      }
      const scale = Math.max(width / img.width, height / img.height);
      const sw = width / scale;
      const sh = height / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Image encode failed'))),
        'image/png',
        0.92,
      );
    };
    img.onerror = () => reject(new Error('Image preview failed to load'));
    img.src = dataUrl;
  });
}

export async function uploadBlogImageDataUrl(params: {
  numericId: number;
  kind: string;
  dataUrl: string;
}): Promise<string> {
  assertAdminSignedInForStorage();
  const blob = await dataUrlToBlob(params.dataUrl);
  const path = `blog-publish/${params.numericId}/${params.kind}-${Date.now()}.png`;
  const storageRef = ref(storage(), path);
  try {
    await uploadBytes(storageRef, blob, { contentType: 'image/png' });
    return getDownloadURL(storageRef);
  } catch (err) {
    throw mapStorageError(err);
  }
}

export async function uploadBlogImageDerivative(params: {
  numericId: number;
  kind: string;
  sourceDataUrl: string;
  width: number;
  height: number;
}): Promise<string> {
  assertAdminSignedInForStorage();
  const blob = await resizeDataUrlCrop(params.sourceDataUrl, params.width, params.height);
  const path = `blog-publish/${params.numericId}/${params.kind}-${Date.now()}.png`;
  const storageRef = ref(storage(), path);
  try {
    await uploadBytes(storageRef, blob, { contentType: 'image/png' });
    return getDownloadURL(storageRef);
  } catch (err) {
    throw mapStorageError(err);
  }
}

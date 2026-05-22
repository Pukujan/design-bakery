import {
  httpsCallable,
  httpsCallableFromURL,
  type HttpsCallable,
} from 'firebase/functions';
import { getFirebaseFunctions, isFunctionsEmulatorEnabled } from './functionsClient';

type BlogCallableName = 'invokeBlogPublishKit' | 'invokeBlogAgent';

const PROXY_PREFIX = '/__/firebase-functions';

/** Same-origin proxy on Vercel (and local Vite) avoids CORS to cloudfunctions.net. */
function useSameOriginCallableProxy(): boolean {
  if (typeof window === 'undefined') return false;
  if (isFunctionsEmulatorEnabled()) return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === 'design-bakery.com' ||
    host === 'www.design-bakery.com' ||
    host.endsWith('.vercel.app')
  );
}

export function createBlogCallable<Request, Response>(
  name: BlogCallableName,
): HttpsCallable<Request, Response> {
  const functions = getFirebaseFunctions();
  if (useSameOriginCallableProxy()) {
    const url = `${window.location.origin}${PROXY_PREFIX}/${name}`;
    return httpsCallableFromURL<Request, Response>(functions, url);
  }
  return httpsCallable<Request, Response>(functions, name);
}

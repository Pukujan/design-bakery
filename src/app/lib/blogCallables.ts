import { httpsCallable, type HttpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from './functionsClient';

type BlogCallableName = 'invokeBlogPublishKit' | 'invokeBlogAgent';

/** Firebase callable (production → cloudfunctions.net; local → Vite proxy + emulator). */
export function createBlogCallable<Request, Response>(
  name: BlogCallableName,
): HttpsCallable<Request, Response> {
  return httpsCallable<Request, Response>(getFirebaseFunctions(), name);
}

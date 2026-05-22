import {
  httpsCallable,
  type HttpsCallable,
} from 'firebase/functions';
import { getBlogApiBaseUrl, isBlogApiEnabled, postBlogApi } from './blogApi';
import { getFirebaseFunctions } from './functionsClient';

type BlogCallableName = 'invokeBlogPublishKit' | 'invokeBlogAgent';

/** Firebase callable (emulator or deployed Functions). */
function createFirebaseCallable<Request, Response>(
  name: BlogCallableName,
): HttpsCallable<Request, Response> {
  return httpsCallable<Request, Response>(getFirebaseFunctions(), name);
}

/**
 * Blog AI transport: Express API when VITE_BLOG_API_URL is set, else Firebase callable.
 */
export function createBlogCallable<Request, Response>(
  name: BlogCallableName,
): {
  (data: Request): Promise<{ data: Response }>;
} {
  if (isBlogApiEnabled()) {
    const path =
      name === 'invokeBlogPublishKit' ? '/api/publish-kit' : '/api/blog-agent';
    return async (data: Request) => ({
      data: await postBlogApi<Response>(path, data),
    });
  }
  return createFirebaseCallable<Request, Response>(name);
}

export { getBlogApiBaseUrl, isBlogApiEnabled };

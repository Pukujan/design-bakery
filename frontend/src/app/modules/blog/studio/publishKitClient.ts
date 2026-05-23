import { getBlogApiBaseUrl, isBlogApiEnabled } from '@/lib/blogApi';
import { createBlogCallable } from '@/lib/blogCallables';
import { formatCallableHttpError } from '@/lib/functionsClient';
import {
  PUBLISH_KIT_API_VERSION,
  type PublishKitAction,
  type PublishKitPreferences,
  type PublishKitResponse,
  type PublishKitSnapshot,
  type PublishKitVisualCommit,
} from './types';

export async function invokeBlogPublishKit(params: {
  action: PublishKitAction;
  blogId: number;
  blogSnapshot?: PublishKitSnapshot;
  preferences?: PublishKitPreferences;
  publicUrl?: string;
  visualCommit?: PublishKitVisualCommit;
}): Promise<PublishKitResponse> {
  const fn = createBlogCallable<Record<string, unknown>, PublishKitResponse>(
    'invokeBlogPublishKit',
  );
  try {
    const result = await fn({
      version: PUBLISH_KIT_API_VERSION,
      action: params.action,
      blogId: params.blogId,
      blogSnapshot: params.blogSnapshot,
      preferences: params.preferences,
      publicUrl: params.publicUrl,
      visualCommit: params.visualCommit,
    });
    return result.data as PublishKitResponse;
  } catch (e) {
    const err = e as { code?: string; message?: string; status?: number };
    const msg = err?.message ?? (e instanceof Error ? e.message : String(e));
    if (/cors|failed to fetch|network|reach blog API/i.test(msg)) {
      if (isBlogApiEnabled()) {
        throw new Error(msg);
      }
      throw new Error(
        `${msg} — Set VITE_BLOG_API_URL=http://localhost:8787 and run pnpm run dev:stack, ` +
          'or enable VITE_USE_FUNCTIONS_EMULATOR with pnpm run dev and [functions] ready.',
      );
    }
    if (err?.code === 'functions/not-found' || /404|not found/i.test(msg)) {
      if (isBlogApiEnabled()) {
        throw new Error(
          `Blog API returned 404 at ${getBlogApiBaseUrl()}/api/publish-kit. ` +
            'Stop other processes on port 8787, run pnpm run dev:stack, use the URL Vite prints (5300 or 5301), ' +
            'then open http://localhost:8787/health.',
        );
      }
      throw new Error(formatCallableHttpError(msg, err?.status ?? 404));
    }
    throw e;
  }
}

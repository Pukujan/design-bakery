import { getBlogApiBaseUrl, postBlogApi } from '@/lib/blogApi';
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
  try {
    return await postBlogApi<PublishKitResponse>('/api/publish-kit', {
      version: PUBLISH_KIT_API_VERSION,
      action: params.action,
      blogId: params.blogId,
      blogSnapshot: params.blogSnapshot,
      preferences: params.preferences,
      publicUrl: params.publicUrl,
      visualCommit: params.visualCommit,
    });
  } catch (e) {
    const err = e as { code?: string; message?: string; status?: number };
    const msg = err?.message ?? (e instanceof Error ? e.message : String(e));
    if (/cors|failed to fetch|network|reach blog API/i.test(msg)) {
      throw new Error(
        `${msg} — Set VITE_BLOG_API_URL=http://localhost:8787 and run pnpm run dev:stack.`,
      );
    }
    if (err?.status === 404 || /404|not found/i.test(msg)) {
      throw new Error(
        `Blog API returned 404 at ${getBlogApiBaseUrl()}/api/publish-kit. ` +
          'Run pnpm run dev:stack and confirm http://localhost:8787/health works.',
      );
    }
    throw e;
  }
}

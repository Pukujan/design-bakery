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
    if (/cors|failed to fetch|network/i.test(msg)) {
      throw new Error(
        `${msg} — Local: restart pnpm run dev and confirm [functions] ready. Production: redeploy Vercel (callable proxy) and Functions; disable ad blockers.`,
      );
    }
    if (err?.code === 'functions/not-found' || /404|not found/i.test(msg)) {
      throw new Error(formatCallableHttpError(msg, err?.status ?? 404));
    }
    throw e;
  }
}

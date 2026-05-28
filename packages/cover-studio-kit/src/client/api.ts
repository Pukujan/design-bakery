import {
  COVER_STUDIO_API_VERSION,
  type CoverStudioAction,
  type CoverStudioPreferences,
  type CoverStudioResponse,
  type CoverStudioSnapshot,
  type CoverStudioVisualCommit,
} from '../types.js';

export type CoverStudioHttpConfig = {
  getBaseUrl: () => string;
  getAuthHeaders: () => Promise<Record<string, string>> | Record<string, string>;
};

async function coverStudioFetch<T>(
  config: CoverStudioHttpConfig,
  path: string,
  body: unknown,
): Promise<T> {
  const base = config.getBaseUrl().replace(/\/$/, '');
  if (!base) {
    throw new Error('Cover Studio API base URL is not set.');
  }
  const auth = await config.getAuthHeaders();
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...auth,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string; ok?: boolean };
  if (!res.ok) {
    throw new Error(data.message ?? `Cover Studio request failed (${res.status})`);
  }
  return data as T;
}

function withCoverStudioSnapshot(snapshot: CoverStudioSnapshot): CoverStudioSnapshot {
  return {
    ...snapshot,
    coverStudioMode: true,
    content: snapshot.content ?? snapshot.excerpt,
    category: snapshot.category ?? 'cover-studio',
    author: snapshot.author ?? 'Cover Studio',
  };
}

export function createCoverStudioClient(config: CoverStudioHttpConfig) {
  return {
    async invoke(params: {
      action: CoverStudioAction | 'suggest_tags' | 'visual';
      blogId: number;
      blogSnapshot: CoverStudioSnapshot;
      preferences?: CoverStudioPreferences;
      visualCommit?: CoverStudioVisualCommit;
    }): Promise<CoverStudioResponse> {
      return coverStudioFetch<CoverStudioResponse>(config, '/api/publish-kit', {
        version: COVER_STUDIO_API_VERSION,
        action: params.action,
        blogId: params.blogId,
        blogSnapshot: withCoverStudioSnapshot(params.blogSnapshot),
        preferences: params.preferences,
        visualCommit: params.visualCommit,
      });
    },
  };
}

export type CoverStudioClient = ReturnType<typeof createCoverStudioClient>;

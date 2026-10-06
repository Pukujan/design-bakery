import { Router } from 'express';
import {
  createBlogPost,
  findBlogByNumericId,
  upsertBlogPost,
  type BlogPostDto,
} from '../../services/lib/content/blogPosts.js';
import { getCmsArray } from '../../services/lib/content/cmsDocuments.js';
import { recordAgentAudit } from '../../services/lib/content/agentAudit.js';
import {
  validateAgentPostPayload,
  type AgentPostPayload,
} from '../../services/lib/content/agentPostPayload.js';
import { sendRouteError } from '../middleware/httpErrors.js';
import type { AgentAuthedRequest } from '../middleware/agentAuth.js';

export const agentPostsRouter = Router();

function hasOwn(body: unknown, key: string): boolean {
  return typeof body === 'object' && body !== null && Object.prototype.hasOwnProperty.call(body, key);
}

/** Category ids come from the CMS; accept any case and store the canonical id. */
async function resolveCategory(input: string): Promise<string> {
  const items = await getCmsArray<{ id?: string }>('blog_categories', []);
  const wanted = input.trim().toLowerCase();
  const match = items.find(
    (item) => typeof item?.id === 'string' && item.id.toLowerCase() === wanted,
  );
  if (!match) {
    const known = items
      .map((item) => item?.id)
      .filter((id): id is string => typeof id === 'string')
      .join(', ');
    const err = new Error(
      known ? `Unknown category "${input}". Known categories: ${known}.` : `Unknown category "${input}".`,
    );
    (err as Error & { status: number }).status = 400;
    throw err;
  }
  return String(match.id);
}

function toDto(payload: AgentPostPayload, category: string): Omit<BlogPostDto, 'id' | 'numericId'> {
  return {
    title: payload.title,
    excerpt: payload.excerpt,
    date: payload.date,
    readTime: String(payload.readTime),
    tags: payload.tags,
    category,
    color: payload.color ?? '',
    author: payload.author,
    content: payload.content,
    coverImageUrl: payload.coverImageUrl,
    thumbnailImageUrl: payload.thumbnailImageUrl,
    seo: payload.seo,
  };
}

function audit(action: 'agent.post.create' | 'agent.post.update', req: unknown, numericId: number, detail?: Record<string, unknown>): void {
  const tokenName = (req as AgentAuthedRequest).agent?.name ?? 'unknown';
  console.log(`[api] ${action} agent=${tokenName} numericId=${numericId}`);
  recordAgentAudit({ action, numericId, tokenName, detail }).catch((error) => {
    console.warn('[api] agent audit failed', error instanceof Error ? error.message : error);
  });
}

/** Create a post. Draft unless the body carries an ISO publishedAt. */
agentPostsRouter.post('/posts', async (req, res) => {
  try {
    const payload = validateAgentPostPayload(req.body);
    const category = await resolveCategory(payload.category);
    const publishedAt = hasOwn(req.body, 'publishedAt') ? payload.publishedAt ?? null : null;

    const { docId, numericId } = await createBlogPost(toDto(payload, category), { publishedAt });
    audit('agent.post.create', req, numericId, { publishedAt });
    res.status(201).json({ ok: true, id: docId, numericId, publishedAt });
  } catch (error) {
    sendRouteError(res, error);
  }
});

/** Update a post. An omitted publishedAt keeps its value; null unpublishes. */
agentPostsRouter.put('/posts/:numericId', async (req, res) => {
  try {
    const numericId = Number(req.params.numericId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: 'numericId must be a positive integer.' });
      return;
    }

    const existing = await findBlogByNumericId(numericId);
    if (!existing) {
      res.status(404).json({ ok: false, code: 'NOT_FOUND', message: `Blog ${numericId} not found.` });
      return;
    }

    const payload = validateAgentPostPayload(req.body);
    const category = await resolveCategory(payload.category);
    const dto: BlogPostDto = {
      ...toDto(payload, category),
      id: existing.docId,
      numericId,
    };

    if (!hasOwn(req.body, 'publishedAt')) {
      await upsertBlogPost(dto);
    } else if (payload.publishedAt === null) {
      await upsertBlogPost(dto, { unpublish: true });
    } else {
      await upsertBlogPost({ ...dto, publishedAt: payload.publishedAt });
    }

    const after = await findBlogByNumericId(numericId);
    const publishedAt = after?.blog.publishedAt ?? null;
    audit('agent.post.update', req, numericId, { publishedAt });
    res.json({ ok: true, id: existing.docId, numericId, publishedAt });
  } catch (error) {
    sendRouteError(res, error);
  }
});

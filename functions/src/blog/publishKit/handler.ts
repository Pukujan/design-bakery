import { HttpsError } from 'firebase-functions/v2/https';
import { resolveBlogForPromo, type FirestoreBlog } from '../firestore.js';
import { resolveCategoryLabel } from './categoryLabels.js';
import { pickReadablePanelMode } from './contrast.js';
import { commitVisualImages } from './commitVisual.js';
import { generateMeta } from './meta.js';
import { generateTags } from './tags.js';
import { bufferToDataUrl } from './renderPng.js';
import {
  resolveLayoutVariant,
  resolveSeed,
  resolveTemplateFamily,
} from './templateSelection.js';
import { resolveCardBlurb } from './textUtils.js';
import { renderUnifiedPublishVisuals } from './unifiedVisual.js';
import {
  PUBLISH_KIT_API_VERSION,
  type PublishKitRequest,
  type PublishKitResponse,
  type PublishKitSnapshot,
} from './types.js';

const VALID_ACTIONS = [
  'meta',
  'visual',
  'visual_and_meta',
  'tags',
  'meta_and_tags',
  'commit_visual',
] as const;

function snapshotFromBlog(blog: FirestoreBlog): PublishKitSnapshot {
  return {
    title: blog.title,
    excerpt: blog.excerpt,
    content: blog.content,
    tags: blog.tags,
    category: blog.category,
    author: blog.author,
    color: blog.color ?? '#6366f1',
    numericId: blog.numericId,
  };
}

export async function handlePublishKit(params: {
  body: PublishKitRequest;
  apiKey: string;
  model: string;
}): Promise<PublishKitResponse> {
  const { body, apiKey, model } = params;

  if (body.version !== PUBLISH_KIT_API_VERSION) {
    throw new HttpsError('invalid-argument', `Unsupported publish kit version ${body.version}.`, {
      code: 'VALIDATION',
    });
  }
  if (!body.action || typeof body.blogId !== 'number') {
    throw new HttpsError('invalid-argument', 'action and blogId are required.', {
      code: 'VALIDATION',
    });
  }
  if (!VALID_ACTIONS.includes(body.action)) {
    throw new HttpsError('invalid-argument', `Unknown action ${body.action as string}.`, {
      code: 'VALIDATION',
    });
  }

  if (body.action === 'commit_visual') {
    const commit = body.visualCommit;
    if (!commit?.ogPreviewDataUrl?.trim()) {
      throw new HttpsError('invalid-argument', 'visualCommit.ogPreviewDataUrl is required.', {
        code: 'VALIDATION',
      });
    }
    const numericId = body.blogSnapshot?.numericId ?? body.blogId;
    const urls = await commitVisualImages({
      numericId,
      ogPreviewDataUrl: commit.ogPreviewDataUrl,
      coverPreviewDataUrl: commit.coverPreviewDataUrl,
      sameImageForCoverAndOg: commit.sameImageForCoverAndOg,
    });
    return {
      ok: true,
      action: body.action,
      visual: {
        ogPreviewDataUrl: commit.ogPreviewDataUrl,
        coverPreviewDataUrl: commit.coverPreviewDataUrl ?? commit.ogPreviewDataUrl,
        ogImageUrl: urls.ogImageUrl,
        coverImageUrl: urls.coverImageUrl,
        thumbnailImageUrl: urls.thumbnailImageUrl,
        ogImageThumbUrl: urls.ogImageThumbUrl,
        templateFamily: '',
        layoutVariant: '',
        panelMode: 'dark',
      },
    };
  }

  const blog = await resolveBlogForPromo(body.blogId, body.blogSnapshot);
  const snapshot: PublishKitSnapshot = body.blogSnapshot
    ? {
        ...body.blogSnapshot,
        color: body.blogSnapshot.color || '#6366f1',
        numericId: body.blogSnapshot.numericId ?? body.blogId,
      }
    : snapshotFromBlog(blog);
  const seed = resolveSeed(body.blogId, snapshot.numericId ?? body.blogId);
  const prefs = body.preferences ?? {};
  const family = resolveTemplateFamily(snapshot.category);
  const layout = resolveLayoutVariant(seed, prefs.variationOffset ?? 0);
  const panelMode = pickReadablePanelMode(snapshot.color);
  const stylePreset = prefs.visualStyle ?? 'auto';
  const categoryLabel = resolveCategoryLabel(snapshot.category, snapshot.categoryLabel);
  const cardBlurb = resolveCardBlurb(snapshot.excerpt, snapshot.content);
  const tags = (snapshot.tags ?? []).filter(Boolean).slice(0, 3);

  const response: PublishKitResponse = {
    ok: true,
    action: body.action,
  };

  if (body.action === 'meta' || body.action === 'meta_and_tags' || body.action === 'visual_and_meta') {
    response.meta = await generateMeta({
      apiKey,
      model,
      snapshot,
      publicUrl: body.publicUrl,
      metaTone: prefs.metaTone,
    });
  }

  if (body.action === 'tags' || body.action === 'meta_and_tags') {
    response.tags = await generateTags({
      apiKey,
      model,
      snapshot,
      metaTone: prefs.metaTone,
    });
  }

  if (body.action === 'visual' || body.action === 'visual_and_meta') {
    const { variants, imageModel, usedAi } = await renderUnifiedPublishVisuals({
      apiKey,
      title: snapshot.title,
      excerpt: cardBlurb,
      category: snapshot.category,
      categoryLabel,
      author: snapshot.author,
      accentColor: snapshot.color,
      tags,
      family,
      layout,
      panelMode,
      stylePreset,
      visualMode: prefs.visualMode,
      imageModel: prefs.imageModel,
    });

    response.visual = {
      ogPreviewDataUrl: bufferToDataUrl(variants.og),
      coverPreviewDataUrl: bufferToDataUrl(variants.cover),
      templateFamily: family,
      layoutVariant: layout,
      panelMode,
      imageModel,
      usedAiArt: usedAi,
    };
  }

  return response;
}

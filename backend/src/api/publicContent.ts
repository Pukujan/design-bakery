import { Router } from 'express';
import { getBlogByNumericId, listBlogPosts } from '../../services/lib/content/blogPosts.js';
import { listMediaAssets } from '../../services/lib/media/mediaLibrary.js';
import { getCmsArray, getCmsObject } from '../../services/lib/content/cmsDocuments.js';
import { sendRouteError } from '../middleware/httpErrors.js';

export const publicContentRouter = Router();

publicContentRouter.get('/blogs', async (_req, res) => {
  try {
    const blogs = await listBlogPosts({ includeContent: false });
    res.json({ ok: true, blogs });
  } catch (error) {
    sendRouteError(res, error);
  }
});

publicContentRouter.get('/blogs/:numericId', async (req, res) => {
  try {
    const numericId = Number(req.params.numericId);
    if (!Number.isFinite(numericId)) {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: 'Invalid blog id.' });
      return;
    }
    const { blog } = await getBlogByNumericId(numericId);
    res.json({ ok: true, blog });
  } catch (error) {
    sendRouteError(res, error);
  }
});

publicContentRouter.get('/blog-categories', async (_req, res) => {
  try {
    const items = await getCmsArray('blog_categories', []);
    res.json({ ok: true, items });
  } catch (error) {
    sendRouteError(res, error);
  }
});

publicContentRouter.get('/doc/:collectionKey/array', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.collectionKey);
    const items = await getCmsArray(key, []);
    res.json({ ok: true, items });
  } catch (error) {
    sendRouteError(res, error);
  }
});

publicContentRouter.get('/doc/:collectionKey/object', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.collectionKey);
    const item = await getCmsObject(key, {});
    res.json({ ok: true, item });
  } catch (error) {
    sendRouteError(res, error);
  }
});

publicContentRouter.get('/media', async (_req, res) => {
  try {
    const assets = await listMediaAssets();
    res.json({ ok: true, assets });
  } catch (error) {
    sendRouteError(res, error);
  }
});

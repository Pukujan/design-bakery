import { Router } from 'express';
import {
  deleteBlogPost,
  listBlogPosts,
  upsertBlogPost,
  type BlogPostDto,
} from '../../services/lib/content/blogPosts.js';
import { getCmsArray, getCmsObject, setCmsArray, setCmsObject } from '../../services/lib/content/cmsDocuments.js';
import { sendRouteError } from '../middleware/httpErrors.js';

export const contentRouter = Router();

contentRouter.get('/blogs', async (_req, res) => {
  try {
    const blogs = await listBlogPosts();
    res.json({ ok: true, blogs });
  } catch (error) {
    sendRouteError(res, error);
  }
});

contentRouter.post('/blogs', async (req, res) => {
  try {
    const id = await upsertBlogPost(req.body as BlogPostDto);
    res.json({ ok: true, id });
  } catch (error) {
    sendRouteError(res, error);
  }
});

contentRouter.put('/blogs/:docId', async (req, res) => {
  try {
    const docId = req.params.docId;
    const id = await upsertBlogPost({ ...(req.body as BlogPostDto), id: docId });
    res.json({ ok: true, id });
  } catch (error) {
    sendRouteError(res, error);
  }
});

contentRouter.delete('/blogs/:docId', async (req, res) => {
  try {
    await deleteBlogPost(req.params.docId);
    res.json({ ok: true });
  } catch (error) {
    sendRouteError(res, error);
  }
});

contentRouter.get('/doc/:collectionKey/array', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.collectionKey);
    const fallback = Array.isArray(req.query.fallback) ? req.query.fallback : [];
    const items = await getCmsArray(key, fallback);
    res.json({ ok: true, items });
  } catch (error) {
    sendRouteError(res, error);
  }
});

contentRouter.put('/doc/:collectionKey/array', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.collectionKey);
    const items = req.body?.items;
    if (!Array.isArray(items)) {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: 'items array required.' });
      return;
    }
    await setCmsArray(key, items);
    res.json({ ok: true });
  } catch (error) {
    sendRouteError(res, error);
  }
});

contentRouter.get('/doc/:collectionKey/object', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.collectionKey);
    const fallback = req.query.fallback ? JSON.parse(String(req.query.fallback)) : {};
    const item = await getCmsObject(key, fallback);
    res.json({ ok: true, item });
  } catch (error) {
    sendRouteError(res, error);
  }
});

contentRouter.put('/doc/:collectionKey/object', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.collectionKey);
    const item = req.body?.item;
    if (item === undefined) {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: 'item required.' });
      return;
    }
    await setCmsObject(key, item);
    res.json({ ok: true });
  } catch (error) {
    sendRouteError(res, error);
  }
});

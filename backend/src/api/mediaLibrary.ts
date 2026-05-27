import { Router } from 'express';
import {
  deleteMediaAsset,
  listMediaAssets,
  ocrRenameMediaAsset,
  previewMediaMetaFromDataUrl,
  updateMediaAsset,
  uploadMediaAssets,
} from '../../services/lib/media/mediaLibrary.js';
import { resolveOpenRouterKey } from '../config/env.js';
import { sendRouteError } from '../middleware/httpErrors.js';

export const mediaLibraryRouter = Router();

mediaLibraryRouter.get('/', async (_req, res) => {
  try {
    const assets = await listMediaAssets();
    res.json({ ok: true, assets });
  } catch (error) {
    sendRouteError(res, error);
  }
});

mediaLibraryRouter.post('/upload', async (req, res) => {
  try {
    const files = req.body?.files;
    if (!Array.isArray(files) || files.length === 0) {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: 'files array required.' });
      return;
    }
    const assets = await uploadMediaAssets(files);
    res.json({ ok: true, assets });
  } catch (error) {
    sendRouteError(res, error);
  }
});

mediaLibraryRouter.post('/preview-ocr', async (req, res) => {
  try {
    const dataUrl = String(req.body?.dataUrl ?? '');
    if (!dataUrl.startsWith('data:image/')) {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: 'dataUrl image required.' });
      return;
    }
    const apiKey = resolveOpenRouterKey();
    const model = process.env.OPENROUTER_OCR_MODEL?.trim();
    const preview = await previewMediaMetaFromDataUrl({
      dataUrl,
      apiKey,
      model: model || undefined,
    });
    res.json({ ok: true, preview });
  } catch (error) {
    sendRouteError(res, error);
  }
});

mediaLibraryRouter.patch('/:id', async (req, res) => {
  try {
    const asset = await updateMediaAsset(req.params.id, {
      filename: typeof req.body?.filename === 'string' ? req.body.filename : undefined,
      slug: typeof req.body?.slug === 'string' ? req.body.slug : undefined,
      tags: Array.isArray(req.body?.tags) ? req.body.tags : undefined,
      altText: req.body?.altText,
      notes: req.body?.notes,
    });
    res.json({ ok: true, asset });
  } catch (error) {
    sendRouteError(res, error);
  }
});

mediaLibraryRouter.delete('/:id', async (req, res) => {
  try {
    await deleteMediaAsset(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    sendRouteError(res, error);
  }
});

mediaLibraryRouter.post('/:id/ocr-filename', async (req, res) => {
  try {
    const apiKey = resolveOpenRouterKey();
    const model = process.env.OPENROUTER_OCR_MODEL?.trim();
    const asset = await ocrRenameMediaAsset({
      id: req.params.id,
      apiKey,
      model: model || undefined,
    });
    res.json({ ok: true, asset });
  } catch (error) {
    sendRouteError(res, error);
  }
});

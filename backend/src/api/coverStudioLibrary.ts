import { Router } from 'express';
import {
  deleteCoverStudioPack,
  listCoverStudioPacks,
  uploadCoverStudioAssets,
} from '../../services/lib/coverStudio/coverStudioLibrary.js';
import { sendRouteError } from '../middleware/httpErrors.js';

export const coverStudioLibraryRouter = Router();

coverStudioLibraryRouter.get('/', async (_req, res) => {
  try {
    const packs = await listCoverStudioPacks();
    res.json({ ok: true, packs });
  } catch (error) {
    sendRouteError(res, error);
  }
});

coverStudioLibraryRouter.post('/upload', async (req, res) => {
  try {
    const files = req.body?.files;
    if (!Array.isArray(files) || files.length === 0) {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: 'files array required.' });
      return;
    }
    const assets = await uploadCoverStudioAssets(files, {
      packId: req.body?.packId,
      packTitle: req.body?.packTitle,
    });
    res.json({ ok: true, assets });
  } catch (error) {
    sendRouteError(res, error);
  }
});

coverStudioLibraryRouter.delete('/pack/:packId', async (req, res) => {
  try {
    await deleteCoverStudioPack(req.params.packId);
    res.json({ ok: true });
  } catch (error) {
    sendRouteError(res, error);
  }
});

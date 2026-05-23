import { Router } from 'express';
import { handlePublishKit } from '../../services/lib/blog/publishKit/handler.js';
import type { PublishKitRequest } from '../../services/lib/blog/publishKit/types.js';
import { resolveOpenRouterKey } from '../config/env.js';
import { sendRouteError } from '../middleware/httpErrors.js';

export const publishKitRouter = Router();

publishKitRouter.post('/', async (req, res) => {
  try {
    const body = req.body as PublishKitRequest;
    const apiKey = resolveOpenRouterKey();
    const model = process.env.OPENROUTER_MODEL?.trim() || 'deepseek/deepseek-chat-v3.1';
    const result = await handlePublishKit({ body, apiKey, model });
    res.json(result);
  } catch (error) {
    sendRouteError(res, error);
  }
});

import { Router } from 'express';
import { z } from 'zod';

/** Public Contact form contract. Delivery stays disabled until the Gmail OAuth relay is configured. */
export const contactRouter = Router();

const contactBody = z.object({
  area: z.enum(['AI engineering', 'Product design', 'Marketing', 'Full-stack development']).nullable(),
  replyEmail: z.string().email().max(254),
  message: z.string().trim().min(1).max(600),
});

contactRouter.get('/config', (_req, res) => {
  res.set('cache-control', 'no-store').json({ enabled: false, delivery: 'gmail-oauth' });
});

contactRouter.post('/', (req, res) => {
  const parsed = contactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, code: 'VALIDATION', message: 'Check your email and message, then try again.' });
    return;
  }
  // TODO: connect a server-side Gmail OAuth delivery adapter here. Keep OAuth
  // tokens and recipient configuration on the server; never accept a recipient
  // or delivery credentials from the public form. Until configured, keep the
  // feature disabled in GET /config and return unavailable without claiming sent.
  res.set('cache-control', 'no-store').status(503).json({
    ok: false,
    code: 'CONTACT_UNAVAILABLE',
    message: 'Direct message delivery is not configured yet. Please book a consultation below or use the chat.',
  });
});

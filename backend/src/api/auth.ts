import { Router } from 'express';
import { authenticateAdmin, isBackendAuthConfigured } from '../auth/credentials.js';
import { signAdminToken, verifyAdminToken } from '../auth/adminJwt.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { sendRouteError } from '../middleware/httpErrors.js';

export const authRouter = Router();

authRouter.get('/status', (_req, res) => {
  res.json({ ok: true, backendAuth: isBackendAuthConfigured() });
});

authRouter.post('/login', async (req, res) => {
  try {
    if (!isBackendAuthConfigured()) {
      res.status(503).json({
        ok: false,
        code: 'AUTH',
        message: 'Backend admin login is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_JWT_SECRET in backend/.env.',
      });
      return;
    }
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      res.status(400).json({ ok: false, code: 'VALIDATION', message: 'Email and password are required.' });
      return;
    }
    const user = await authenticateAdmin(email, password);
    const token = await signAdminToken(user);
    res.json({ ok: true, token, user: { email: user.email } });
  } catch (error) {
    sendRouteError(res, error);
  }
});

authRouter.get('/me', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ ok: false, code: 'AUTH', message: 'Sign in to admin first.' });
      return;
    }
    const token = header.slice(7).trim();
    const user = await verifyAdminToken(token);
    res.json({ ok: true, user: { email: user.email } });
  } catch {
    res.status(401).json({ ok: false, code: 'AUTH', message: 'Session expired. Sign in again.' });
  }
});

authRouter.post('/logout', (_req, res) => {
  res.json({ ok: true });
});

/** For tests — export verify path used by middleware */
export async function resolveAuthedUser(header: string | undefined) {
  if (!header?.startsWith('Bearer ')) return null;
  if (!isBackendAuthConfigured()) return null;
  try {
    return await verifyAdminToken(header.slice(7).trim());
  } catch {
    return null;
  }
}

export type { AuthedRequest };

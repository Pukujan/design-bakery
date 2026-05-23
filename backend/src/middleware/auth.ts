import type { NextFunction, Request, Response } from 'express';
import { isBackendAuthConfigured } from '../auth/credentials.js';
import { verifyAdminToken } from '../auth/adminJwt.js';
import type { AdminUser } from '../auth/adminUser.js';

export type AuthedRequest = Request & { user: AdminUser };

function assertAdminEmail(email: string | undefined): void {
  const allowlist = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const primary = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const allowed = new Set(allowlist);
  if (primary) allowed.add(primary);
  if (allowed.size === 0) return;
  if (!email || !allowed.has(email.toLowerCase())) {
    const err = new Error('This account is not allowed to use admin tools.');
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!isBackendAuthConfigured()) {
      res.status(503).json({
        ok: false,
        code: 'AUTH',
        message: 'Backend auth not configured. Set ADMIN_JWT_SECRET, ADMIN_EMAIL, and ADMIN_PASSWORD in backend/.env.',
      });
      return;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ ok: false, code: 'AUTH', message: 'Sign in to admin first.' });
      return;
    }
    const token = header.slice(7).trim();
    const decoded = await verifyAdminToken(token);
    assertAdminEmail(decoded.email);
    (req as AuthedRequest).user = decoded;
    next();
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    let message = e instanceof Error ? e.message : 'Unauthorized';
    if (/expired|jwt|token/i.test(message)) {
      message = 'Session expired. Sign in again.';
    }
    res.status(status).json({ ok: false, code: status === 403 ? 'AUTH' : 'AUTH', message });
  }
}

export function authedUserId(user: AdminUser): string {
  return user.uid;
}

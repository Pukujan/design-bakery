import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth, ensureFirebaseAdminApp } from '../../services/lib/firebaseApp.js';
import { isBackendAuthConfigured } from '../auth/credentials.js';
import { verifyAdminToken } from '../auth/adminJwt.js';
import type { AdminUser } from '../auth/adminUser.js';

export type AuthedRequest = Request & { user: AdminUser | DecodedIdToken };

function isAdminUser(user: AdminUser | DecodedIdToken): user is AdminUser {
  return typeof (user as AdminUser).email === 'string' && !('firebase' in user);
}

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
    const err = new Error('This account is not allowed to use blog agents.');
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

async function verifyBearerToken(token: string): Promise<AdminUser | DecodedIdToken> {
  if (isBackendAuthConfigured()) {
    return verifyAdminToken(token);
  }
  ensureFirebaseAdminApp();
  return adminAuth().verifyIdToken(token);
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ ok: false, code: 'AUTH', message: 'Sign in to admin first.' });
      return;
    }
    const token = header.slice(7).trim();
    const decoded = await verifyBearerToken(token);
    const email = isAdminUser(decoded) ? decoded.email : decoded.email;
    assertAdminEmail(email);
    (req as AuthedRequest).user = decoded;
    next();
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    let message = e instanceof Error ? e.message : 'Unauthorized';
    if (!isBackendAuthConfigured() && /cert credential|GOOGLE_CLOUD_PROJECT|default Firebase app does not exist/i.test(message)) {
      message =
        'Backend auth not configured. Set ADMIN_JWT_SECRET + ADMIN_EMAIL + ADMIN_PASSWORD in backend/.env, or configure Firebase Admin for legacy auth.';
    }
    if (/expired|jwt|token/i.test(message)) {
      message = 'Session expired. Sign in again.';
    }
    res.status(status).json({ ok: false, code: status === 403 ? 'AUTH' : 'AUTH', message });
  }
}

/** Agent rate limits key — stable string uid */
export function authedUserId(user: AdminUser | DecodedIdToken): string {
  if (isAdminUser(user)) return user.uid;
  return user.uid;
}

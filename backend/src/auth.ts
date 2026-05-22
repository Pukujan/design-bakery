import type { NextFunction, Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { ensureFirebaseAdminApp } from '../functions/lib/firebaseApp.js';

export type AuthedRequest = Request & { user: DecodedIdToken };

function assertAdminEmail(email: string | undefined): void {
  const allowlist = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.length === 0) return;
  if (!email || !allowlist.includes(email.toLowerCase())) {
    const err = new Error('This account is not allowed to use blog agents.');
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
    ensureFirebaseAdminApp();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ ok: false, code: 'AUTH', message: 'Sign in to admin first.' });
      return;
    }
    const token = header.slice(7).trim();
    const decoded = await getAuth().verifyIdToken(token);
    assertAdminEmail(decoded.email);
    (req as AuthedRequest).user = decoded;
    next();
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    const message = e instanceof Error ? e.message : 'Unauthorized';
    res.status(status).json({ ok: false, code: status === 403 ? 'AUTH' : 'AUTH', message });
  }
}

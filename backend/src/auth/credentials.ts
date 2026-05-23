import bcrypt from 'bcryptjs';
import { adminUserFromEmail } from './adminUser.js';

export function isBackendAuthConfigured(): boolean {
  const secret = process.env.ADMIN_JWT_SECRET?.trim();
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  return Boolean(secret && email && (password || hash));
}

function allowedEmails(): string[] {
  const primary = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const extra = (process.env.ALLOWED_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const set = new Set<string>();
  if (primary) set.add(primary);
  for (const e of extra) set.add(e);
  return [...set];
}

export function assertLoginEmailAllowed(email: string): void {
  const normalized = email.trim().toLowerCase();
  const allowed = allowedEmails();
  if (allowed.length === 0) {
    throw new Error('Admin login is not configured (set ADMIN_EMAIL in backend/.env).');
  }
  if (!allowed.includes(normalized)) {
    const err = new Error('This account is not allowed to use admin.');
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

export async function verifyAdminPassword(email: string, password: string): Promise<boolean> {
  assertLoginEmailAllowed(email);
  const primary = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!primary || email.trim().toLowerCase() !== primary) {
    const err = new Error('Incorrect email or password.');
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const plain = process.env.ADMIN_PASSWORD?.trim();
  if (hash) {
    return bcrypt.compare(password, hash);
  }
  if (plain) {
    return password === plain;
  }
  return false;
}

export async function authenticateAdmin(email: string, password: string) {
  assertLoginEmailAllowed(email);
  const ok = await verifyAdminPassword(email, password);
  if (!ok) {
    const err = new Error('Incorrect email or password.');
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return adminUserFromEmail(email);
}

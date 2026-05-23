import { SignJWT, jwtVerify } from 'jose';
import type { AdminUser } from './adminUser.js';
import { adminUserFromEmail } from './adminUser.js';

const ISSUER = 'design-bakery-api';
const AUDIENCE = 'design-bakery-admin';

function secretKey(): Uint8Array {
  const raw = process.env.ADMIN_JWT_SECRET?.trim();
  if (!raw) {
    throw new Error('ADMIN_JWT_SECRET is missing in backend/.env');
  }
  return new TextEncoder().encode(raw);
}

export function adminJwtTtlSeconds(): number {
  const raw = process.env.ADMIN_JWT_TTL_SECONDS?.trim();
  const parsed = raw ? Number(raw) : 8 * 60 * 60;
  return Number.isFinite(parsed) && parsed > 60 ? parsed : 8 * 60 * 60;
}

export async function signAdminToken(user: AdminUser): Promise<string> {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.uid)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${adminJwtTtlSeconds()}s`)
    .sign(secretKey());
}

export async function verifyAdminToken(token: string): Promise<AdminUser> {
  const { payload } = await jwtVerify(token, secretKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  const email = typeof payload.email === 'string' ? payload.email : '';
  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  if (!email || !sub) {
    throw new Error('Invalid admin token.');
  }
  const user = adminUserFromEmail(email);
  if (user.uid !== sub) {
    throw new Error('Invalid admin token.');
  }
  return user;
}

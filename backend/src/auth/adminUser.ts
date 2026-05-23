import { createHash } from 'node:crypto';

/** Stable id for rate limits / audit (not Firebase uid). */
export function adminUidFromEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 32);
}

export type AdminUser = {
  uid: string;
  email: string;
};

export function adminUserFromEmail(email: string): AdminUser {
  const normalized = email.trim().toLowerCase();
  return { uid: adminUidFromEmail(normalized), email: normalized };
}

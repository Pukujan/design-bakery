/** Inactivity limit for admin sessions (client-side). */
export const ADMIN_IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export const ADMIN_SESSION_EXPIRED_KEY = 'admin_session_expired';

export function markAdminSessionExpired() {
  try {
    sessionStorage.setItem(ADMIN_SESSION_EXPIRED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function consumeAdminSessionExpired(): boolean {
  try {
    if (sessionStorage.getItem(ADMIN_SESSION_EXPIRED_KEY) !== '1') return false;
    sessionStorage.removeItem(ADMIN_SESSION_EXPIRED_KEY);
    return true;
  } catch {
    return false;
  }
}

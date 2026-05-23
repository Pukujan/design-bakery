import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ADMIN_IDLE_TIMEOUT_MS,
  markAdminSessionExpired,
} from './adminSession';
import {
  clearAdminAccessToken,
  getAdminAccessToken,
  getAuthApiBaseUrl,
  isBackendAdminAuthEnabled,
  setAdminAccessToken,
} from './adminToken';

export type AdminUser = { email: string };

interface AdminAuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const IDLE_ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

async function fetchMe(token: string): Promise<AdminUser | null> {
  const base = getAuthApiBaseUrl();
  if (!base) return null;
  const res = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { user?: { email?: string } };
  const email = data.user?.email?.trim();
  return email ? { email } : null;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signOut = useCallback(async (reason?: 'idle') => {
    if (reason === 'idle') {
      markAdminSessionExpired();
    }
    clearAdminAccessToken();
    setUser(null);
    const base = getAuthApiBaseUrl();
    if (base) {
      try {
        await fetch(`${base}/api/auth/logout`, { method: 'POST' });
      } catch {
        /* ignore */
      }
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      void signOut('idle');
    }, ADMIN_IDLE_TIMEOUT_MS);
  }, [signOut]);

  useEffect(() => {
    if (!isBackendAdminAuthEnabled()) {
      setLoading(false);
      return;
    }
    const token = getAdminAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    void fetchMe(token).then((u) => {
      if (u) {
        setUser(u);
        resetIdleTimer();
      } else {
        clearAdminAccessToken();
      }
      setLoading(false);
    });
  }, [resetIdleTimer]);

  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    const onActivity = () => resetIdleTimer();

    for (const event of IDLE_ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      for (const event of IDLE_ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [user, resetIdleTimer]);

  async function signIn(email: string, password: string) {
    const base = getAuthApiBaseUrl();
    if (!base) {
      throw new Error('VITE_BLOG_API_URL is not set. Run pnpm run dev:stack and configure frontend/.env.');
    }
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      token?: string;
      message?: string;
      user?: { email?: string };
    };
    if (!res.ok || !data.token) {
      throw new Error(data.message ?? 'Sign in failed.');
    }
    setAdminAccessToken(data.token);
    const nextUser = data.user?.email ? { email: data.user.email } : { email: email.trim().toLowerCase() };
    setUser(nextUser);
    resetIdleTimer();
  }

  return (
    <AdminAuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}

export { isBackendAdminAuthEnabled };

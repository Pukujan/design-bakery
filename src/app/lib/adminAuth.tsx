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
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import {
  ADMIN_IDLE_TIMEOUT_MS,
  markAdminSessionExpired,
} from './adminSession';

interface AdminAuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const IDLE_ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signOut = useCallback(async (reason?: 'idle') => {
    if (reason === 'idle') {
      markAdminSessionExpired();
    }
    if (!auth) return;
    await firebaseSignOut(auth);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      void signOut('idle');
    }, ADMIN_IDLE_TIMEOUT_MS);
  }, [signOut]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

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
    if (!auth) throw new Error('Firebase Auth is not configured.');
    await signInWithEmailAndPassword(auth, email, password);
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

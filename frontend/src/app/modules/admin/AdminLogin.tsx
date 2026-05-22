import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../lib/adminAuth';
import { consumeAdminSessionExpired } from '../../lib/adminSession';
import { isFirebaseConfigured } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

function formatAuthError(err: unknown): string {
  if (!(err instanceof Error)) return 'Sign in failed. Please try again.';

  const code = (err as Error & { code?: string }).code;
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return err.message || 'Sign in failed. Please try again.';
  }
}

export function AdminLogin() {
  const { signIn, user, loading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpiredNote, setSessionExpiredNote] = useState(false);

  useEffect(() => {
    if (consumeAdminSessionExpired()) {
      setSessionExpiredNote(true);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!isFirebaseConfigured) {
      setError(
        'Firebase is not configured. Copy frontend/.env.example to frontend/.env, and restart Vite.'
      );
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/admin', { replace: true });
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          {!isFirebaseConfigured && (
            <div
              className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
              role="alert"
            >
              Firebase env vars are missing. Copy <code className="font-mono">frontend/.env.example</code>{' '}
              to <code className="font-mono">frontend/.env</code> and restart{' '}
              <code className="font-mono">npm run dev</code>. On Vercel, add the same{' '}
              <code className="font-mono">VITE_FIREBASE_*</code> variables in project settings.
            </div>
          )}

          {sessionExpiredNote && (
            <div
              className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
              role="status"
            >
              You were signed out after 10 minutes of inactivity. Sign in again to continue.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!isFirebaseConfigured}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!isFirebaseConfigured}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !isFirebaseConfigured}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

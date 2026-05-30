import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isBackendAdminAuthEnabled, useAdminAuth } from '../../lib/adminAuth';
import { consumeAdminSessionExpired } from '../../lib/adminSession';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { AdminSeoHead } from '@/seo/PageSeo';

function formatAuthError(err: unknown): string {
  if (!(err instanceof Error)) return 'Sign in failed. Please try again.';
  return err.message || 'Sign in failed. Please try again.';
}

export function AdminLogin() {
  const { signIn, user, loading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpiredNote, setSessionExpiredNote] = useState(false);
  const backendAuth = isBackendAdminAuthEnabled();

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

    if (!backendAuth) {
      setError(
        'Backend auth is not configured. Set VITE_BLOG_API_URL in frontend/.env and ADMIN_* in backend/.env, then restart pnpm run dev:stack.',
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
      <>
        <AdminSeoHead />
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500">
          Loading…
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSeoHead />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          {!backendAuth && (
            <div
              className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
              role="alert"
            >
              Set <code className="font-mono">VITE_BLOG_API_URL=http://localhost:8787</code> in{' '}
              <code className="font-mono">frontend/.env</code> and admin credentials in{' '}
              <code className="font-mono">backend/.env</code>, then restart{' '}
              <code className="font-mono">pnpm run dev:stack</code>.
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
                disabled={!backendAuth}
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
                disabled={!backendAuth}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !backendAuth}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

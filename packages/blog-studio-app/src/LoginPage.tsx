import { useState } from 'react';
import { setAdminAccessToken } from '@design-bakery/blog-core';

type LoginPageProps = {
  onLoggedIn: () => void;
};

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const base = import.meta.env.VITE_BLOG_API_URL?.replace(/\/$/, '');
    if (!base) {
      setError('Set VITE_BLOG_API_URL in .env');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { token?: string; message?: string };
      if (!res.ok || !data.token) {
        throw new Error(data.message ?? 'Login failed');
      }
      setAdminAccessToken(data.token);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-[8px_8px_0_0_#000]"
      >
        <h1 className="text-2xl font-black mb-6">Blog Studio</h1>
        <label className="block text-sm font-bold mb-1">Email</label>
        <input
          className="mb-4 w-full rounded-lg border-2 border-black px-3 py-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="block text-sm font-bold mb-1">Password</label>
        <input
          className="mb-6 w-full rounded-lg border-2 border-black px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="mb-4 text-sm text-red-600 font-medium">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg border-2 border-black bg-black py-3 font-black text-white disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

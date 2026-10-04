import { useEffect } from 'react';

/**
 * /ire is a standalone static page (frontend/public/ire/index.html), served by the
 * host's directory index plus the /ire rewrite in vercel.json and the Caddyfile.
 * In-app <Link to="/ire"> clicks land here first, so hand off with a full page load.
 * Production reloads /ire itself (the host serves the static file, no loop); the Vite
 * dev server would answer /ire with the SPA shell, so dev targets the file directly.
 */
export function IrePageRedirect() {
  useEffect(() => {
    const target = import.meta.env.DEV ? '/ire/index.html' : '/ire';
    window.location.replace(`${target}${window.location.search}${window.location.hash}`);
  }, []);

  return null;
}

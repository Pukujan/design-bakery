import { useEffect } from 'react';

/**
 * /ire is a standalone page — the IRE dashboard, built from frontend/ire-app and served
 * by the host's /ire rewrite (vercel.json and the Caddyfile) — not a route in this SPA.
 * In-app <Link to="/ire"> clicks (the portfolio card) land here first, so hand off with a
 * full page load. That does not loop: this SPA never serves /ire, the host rewrites it
 * to the dashboard's index.html.
 */
export function IrePageRedirect() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      // This dev server has no /ire page and the route below would just render itself
      // again, so reloading here loops. Point at the dashboard's own dev server instead.
      console.warn(
        'IRE lives in frontend/ire-app. Run `pnpm --dir frontend/ire-app dev` and open http://localhost:8080/ire/',
      );
      return;
    }
    window.location.replace(`/ire${window.location.search}${window.location.hash}`);
  }, []);

  return null;
}

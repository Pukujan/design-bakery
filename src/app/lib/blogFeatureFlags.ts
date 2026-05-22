/**
 * Vite `VITE_*` flags are baked in at build time (e.g. Vercel).
 * When unset: off in dev, on in production (opt out with =false).
 */
export function viteFlag(name: string): boolean {
  const v = import.meta.env[name as keyof ImportMetaEnv] as string | undefined;
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return Boolean(import.meta.env.PROD);
}

export function isPublishKitEnabled(): boolean {
  return (
    viteFlag('VITE_ENABLE_BLOG_PUBLISH_KIT') || viteFlag('VITE_ENABLE_BLOG_AGENTS')
  );
}

export const BLOG_AGENTS_ENABLED = viteFlag('VITE_ENABLE_BLOG_AGENTS');

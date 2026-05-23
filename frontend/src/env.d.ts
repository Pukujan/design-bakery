/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_BLOG_PUBLISH_KIT: string;
  readonly VITE_BLOG_API_URL: string;
  readonly VITE_CONTENT_BACKEND: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DEV_WEB_ONLY: string;
  readonly VITE_DEV_PORT_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

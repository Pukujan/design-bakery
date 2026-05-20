/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_DATABASE_URL: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_FIREBASE_DB_ROOT: string;
  readonly VITE_FIREBASE_ENABLE_CONTENT_SYNC: string;
  readonly VITE_FIREBASE_SYNC_COOLDOWN_MS: string;
  readonly VITE_FIREBASE_CACHE_TTL_MS: string;
  readonly VITE_ENABLE_BLOG_AGENTS?: string;
  readonly VITE_ENABLE_AGENT_COUNCIL?: string;
  readonly VITE_USE_FUNCTIONS_EMULATOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

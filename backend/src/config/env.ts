import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = resolve(backendDir, '..');

function applyFile(path: string, override: boolean): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    if (key.startsWith('VITE_')) continue;
    const value = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!override && process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

export function loadServerEnv(): void {
  applyFile(resolve(backendDir, '.env'), true);
  applyFile(resolve(backendDir, '.env.local'), true);
  applyFile(resolve(repoRoot, '.env'), false);
  applyFile(resolve(repoRoot, '.env.local'), true);
}

export function resolveOpenRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (key?.startsWith('sk-')) return key;
  const err = new Error(
    'OPENROUTER_API_KEY is missing. Add it to backend/.env (see backend/.env.example) or Railway env.',
  );
  (err as Error & { code: string }).code = 'failed-precondition';
  throw err;
}

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

/** Vercel production + preview deployments (e.g. design-bakery-xxx-team.vercel.app). */
const VERCEL_ORIGIN_RE = /^https:\/\/[\w-]+(\.[\w-]+)*\.vercel\.app$/;

export function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (raw) {
    return raw
      .split(',')
      .map(normalizeOrigin)
      .filter(Boolean);
  }
  return [
    'https://www.design-bakery.com',
    'https://design-bakery.com',
    'http://localhost:5300',
    'http://localhost:5301',
    'http://127.0.0.1:5300',
  ];
}

/** CORS: explicit ALLOWED_ORIGINS + Vercel preview hosts + local dev defaults. */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (parseAllowedOrigins().includes(normalized)) return true;
  if (VERCEL_ORIGIN_RE.test(normalized)) return true;
  return false;
}

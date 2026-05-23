import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = resolve(dirname(fileURLToPath(import.meta.url)));
export const repoRoot = resolve(scriptsDir, '..');
export const frontendDir = resolve(repoRoot, 'frontend');
export const backendDir = resolve(repoRoot, 'backend');
export const servicesDir = resolve(repoRoot, 'backend/services');

/**
 * @param {string} path
 * @param {{ override?: boolean, filterKey?: (key: string) => boolean }} [opts]
 */
export function applyEnvFile(path, { override = true, filterKey = null } = {}) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    if (filterKey && !filterKey(key)) continue;
    const value = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!override && process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

/** @param {string} envPath @param {string} name */
export function readEnvFileFlag(envPath, name) {
  if (!existsSync(envPath)) return false;
  const line = readFileSync(envPath, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith(`${name}=`) && !l.startsWith('#'));
  if (!line) return false;
  const value = line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '');
  return value === 'true' || value === '1';
}

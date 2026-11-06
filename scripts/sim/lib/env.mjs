/** Reads backend/.env into an object (no values are printed). The process's own environment wins over the file. */
import { readFile } from 'node:fs/promises';

export async function loadEnv(file = new URL('../../../backend/.env', import.meta.url)) {
  const out = {};
  let raw = '';
  try { raw = await readFile(file, 'utf8'); } catch { return { ...process.env }; }
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if (value.length > 1 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]) value = value.slice(1, -1);
    out[key] = value;
  }
  return { ...out, ...process.env };
}

/**
 * Seeds portfolio engineering content into Firestore (admin CMS collections).
 *
 * Usage: pnpm run seed:firestore
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { signInAnonymously } from 'firebase/auth';
import { assertFirebaseConfigured, auth } from '../frontend/src/app/lib/firebase';
import { pushAllPortfolioDefaultsToFirestore } from '../frontend/src/app/lib/adminContentService';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(repoRoot, 'frontend/.env'));
loadEnvFile(resolve(repoRoot, 'frontend/.env.local'));
loadEnvFile(resolve(repoRoot, 'frontend/.env.example'));

async function main() {
  assertFirebaseConfigured();

  if (auth) {
    try {
      await signInAnonymously(auth);
      console.log('Signed in anonymously for Firestore writes.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('Anonymous auth failed (writes may still work if rules allow):', message);
    }
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  console.log(`Seeding portfolios to Firestore (${projectId})…`);

  const ids = await pushAllPortfolioDefaultsToFirestore();

  for (const portfolioId of ids) {
    console.log(`  ✓ ${portfolioId}`);
  }

  console.log('\nDone. Portfolio content is in Firestore.');
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});

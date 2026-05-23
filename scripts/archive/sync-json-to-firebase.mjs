import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getDatabase, get as dbGet, ref, set } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'src', 'app');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function normalizeDatabaseUrl(rawValue, projectId) {
  const value = rawValue?.trim();

  if (value && /^https?:\/\//i.test(value)) {
    return value;
  }

  if (value) {
    return `https://${value}-default-rtdb.firebaseio.com`;
  }

  if (projectId) {
    return `https://${projectId}-default-rtdb.firebaseio.com`;
  }

  return '';
}

const projectId = requiredEnv('VITE_FIREBASE_PROJECT_ID');

const firebaseConfig = {
  apiKey: requiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: normalizeDatabaseUrl(process.env.VITE_FIREBASE_DATABASE_URL, projectId),
  projectId,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredEnv('VITE_FIREBASE_APP_ID'),
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasExplicitDatabaseUrl = /^https?:\/\//i.test(
  (process.env.VITE_FIREBASE_DATABASE_URL || '').trim()
);

const firebaseDbRoot = (process.env.VITE_FIREBASE_DB_ROOT || '').trim();
const contentRootPath = firebaseDbRoot
  ? `${firebaseDbRoot.replace(/\/$/, '')}/content`
  : 'content';
const rootKey = contentRootPath.replace(/[^a-zA-Z0-9_-]/g, '_');

function hashString(input) {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

async function walkJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkJsonFiles(fullPath);
      results.push(...nested);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }

  return results;
}

function toKey(relativePath) {
  return relativePath
    .replaceAll('\\', '/')
    .replace(/^\//, '')
    .replace(/\.json$/, '')
    .replace(/\//g, '__');
}

async function buildPayload() {
  const files = await walkJsonFiles(appRoot);
  files.sort();

  const payload = {};

  for (const filePath of files) {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const relative = path.relative(appRoot, filePath);
    const key = toKey(relative);
    payload[key] = {
      path: relative.replaceAll('\\', '/'),
      data: parsed,
    };
  }

  return payload;
}

async function uploadToRtdb(db, payload, hash, now) {
  const metaRef = ref(db, `${contentRootPath}/__meta`);
  const currentMeta = await dbGet(metaRef);
  const currentHash = currentMeta.exists() ? currentMeta.val()?.hash : null;

  if (currentHash === hash) {
    return { status: 'skipped', target: 'rtdb', reason: 'up-to-date' };
  }

  await set(ref(db, contentRootPath), {
    files: payload,
    __meta: {
      hash,
      updatedAt: now,
      source: 'sync-json-to-firebase-script',
      fileCount: Object.keys(payload).length,
    },
  });

  const confirm = await dbGet(metaRef);
  const confirmHash = confirm.exists() ? confirm.val()?.hash : null;

  if (confirmHash !== hash) {
    throw new Error('RTDB write could not be confirmed by hash check.');
  }

  return { status: 'uploaded', target: 'rtdb', reason: 'content-synced' };
}

async function uploadToFirestore(fsDb, payload, hash, now) {
  const metaDocRef = doc(fsDb, 'content_sync_meta', rootKey);
  const currentMeta = await getDoc(metaDocRef);
  const currentHash = currentMeta.exists() ? currentMeta.data()?.hash : null;

  if (currentHash === hash) {
    return { status: 'skipped', target: 'firestore', reason: 'up-to-date' };
  }

  const entries = Object.entries(payload);
  const batch = writeBatch(fsDb);

  for (const [key, value] of entries) {
    const fileDocRef = doc(fsDb, 'content_sync_files', `${rootKey}__${key}`);
    batch.set(fileDocRef, {
      ...value,
      hash,
      updatedAt: now,
      rootPath: contentRootPath,
    });
  }

  batch.set(metaDocRef, {
    hash,
    fileCount: entries.length,
    rootPath: contentRootPath,
    source: 'sync-json-to-firebase-script',
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return { status: 'uploaded', target: 'firestore', reason: 'content-synced' };
}

async function main() {
  const payload = await buildPayload();
  const payloadString = JSON.stringify(payload);
  const hash = hashString(payloadString);
  const now = Date.now();

  const app = initializeApp(firebaseConfig);

  try {
    const auth = getAuth(app);
    await signInAnonymously(auth);
  } catch (error) {
    console.warn('Anonymous sign-in skipped/unavailable:', error?.message || error);
  }

  if (hasExplicitDatabaseUrl) {
    try {
      const db = getDatabase(app);
      const rtdbResult = await uploadToRtdb(db, payload, hash, now);
      console.log(`${rtdbResult.status.toUpperCase()} ${rtdbResult.target}: ${rtdbResult.reason}`);
      return;
    } catch (error) {
      console.warn('RTDB sync unavailable, falling back to Firestore:', error?.message || error);
    }
  } else {
    console.warn('RTDB sync skipped: VITE_FIREBASE_DATABASE_URL is not a full URL. Using Firestore fallback.');
  }

  const fsDb = getFirestore(app);
  const firestoreResult = await uploadToFirestore(fsDb, payload, hash, now);
  console.log(`${firestoreResult.status.toUpperCase()} ${firestoreResult.target}: ${firestoreResult.reason}`);
}

main().catch((error) => {
  console.error('Firebase JSON sync failed:', error);
  process.exitCode = 1;
});

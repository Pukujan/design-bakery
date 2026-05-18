import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

function normalizeDatabaseUrl(rawValue: string | undefined, projectId: string | undefined): string {
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

function env(key: string): string | undefined {
  const vite = import.meta.env[key];
  if (vite !== undefined && vite !== '') return String(vite);

  // Node-only (e.g. seed:firestore via tsx) — `process` is not defined in the browser
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key];
  }

  return undefined;
}

const firebaseConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY'),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: normalizeDatabaseUrl(env('VITE_FIREBASE_DATABASE_URL'), env('VITE_FIREBASE_PROJECT_ID')),
  projectId: env('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('VITE_FIREBASE_APP_ID'),
  measurementId: env('VITE_FIREBASE_MEASUREMENT_ID'),
};

const hasRequiredFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every((value) => Boolean(value));

export const isFirebaseConfigured = hasRequiredFirebaseConfig;

export const firebaseApp: FirebaseApp | null = hasRequiredFirebaseConfig
  ? initializeApp(firebaseConfig)
  : null;

export const firestore: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
export const realtimeDb: Database | null = firebaseApp ? getDatabase(firebaseApp) : null;
export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;

export const firebaseDbRoot = env('VITE_FIREBASE_DB_ROOT') || '';

export function assertFirebaseConfigured(): asserts firebaseApp is FirebaseApp {
  if (!firebaseApp) {
    throw new Error(
      'Firebase is not configured. Fill values in .env (see .env.example) and restart Vite.'
    );
  }
}

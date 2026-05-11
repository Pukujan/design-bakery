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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: normalizeDatabaseUrl(
    import.meta.env.VITE_FIREBASE_DATABASE_URL,
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  ),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const hasRequiredFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every((value) => Boolean(value));

export const firebaseApp: FirebaseApp | null = hasRequiredFirebaseConfig
  ? initializeApp(firebaseConfig)
  : null;

export const firestore: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;
export const realtimeDb: Database | null = firebaseApp ? getDatabase(firebaseApp) : null;
export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;

export const firebaseDbRoot = import.meta.env.VITE_FIREBASE_DB_ROOT || '';

export function assertFirebaseConfigured(): asserts firebaseApp is FirebaseApp {
  if (!firebaseApp) {
    throw new Error(
      'Firebase is not configured. Fill values in .env (see .env.example) and restart Vite.'
    );
  }
}

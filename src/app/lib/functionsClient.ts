import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { assertFirebaseConfigured, firebaseApp } from './firebase';

export { isPublishKitEnabled, BLOG_AGENTS_ENABLED } from './blogFeatureFlags';

let functionsInstance: Functions | null = null;
let emulatorConnected = false;

/** Connect callable traffic through the Vite dev server (same origin as the app). */
function connectEmulatorViaDevProxy(fn: Functions) {
  const host = window.location.hostname;
  const port = Number(window.location.port) || 5300;
  connectFunctionsEmulator(fn, host, port);
}

export function getFirebaseFunctions(): Functions {
  assertFirebaseConfigured();
  if (!functionsInstance && firebaseApp) {
    functionsInstance = getFunctions(firebaseApp, 'us-central1');
    const useEmu =
      import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true' ||
      import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === '1';
    if (useEmu && !emulatorConnected) {
      if (typeof window !== 'undefined') {
        connectEmulatorViaDevProxy(functionsInstance);
      } else {
        connectFunctionsEmulator(functionsInstance, '127.0.0.1', 5001);
      }
      emulatorConnected = true;
    }
  }
  if (!functionsInstance) {
    throw new Error('Firebase Functions is not available.');
  }
  return functionsInstance;
}

/** True only when callables should hit the local emulator (not production). */
export function isFunctionsEmulatorEnabled(): boolean {
  return (
    import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true' ||
    import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === '1'
  );
}

/** Human-readable hint when callable HTTP fails (404 = proxy/emulator; not Storage). */
export function formatCallableHttpError(message: string, status?: number): string {
  if (status === 404 || /404|not found/i.test(message)) {
    const port = typeof window !== 'undefined' ? window.location.port || '5300' : '5300';
    return (
      `Blog Functions returned 404. Use http://localhost:${port} (same tab as Vite), restart pnpm run dev, ` +
      `and confirm the terminal shows [functions] ready — invokeBlogPublishKit. ` +
      `Do not use an old tab on a different port (e.g. 5300 vs 5301).`
    );
  }
  return message;
}


import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { assertFirebaseConfigured, firebaseApp } from './firebase';

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

export function isFunctionsEmulatorEnabled(): boolean {
  return (
    import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true' ||
    import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === '1' ||
    import.meta.env.VITE_ENABLE_BLOG_AGENTS === 'true' ||
    import.meta.env.VITE_ENABLE_BLOG_AGENTS === '1' ||
    import.meta.env.VITE_ENABLE_BLOG_PUBLISH_KIT === 'true' ||
    import.meta.env.VITE_ENABLE_BLOG_PUBLISH_KIT === '1'
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

export function isPublishKitEnabled(): boolean {
  const publishKit = import.meta.env.VITE_ENABLE_BLOG_PUBLISH_KIT;
  const blogAgents = import.meta.env.VITE_ENABLE_BLOG_AGENTS;
  return (
    publishKit === 'true' ||
    publishKit === '1' ||
    blogAgents === 'true' ||
    blogAgents === '1'
  );
}

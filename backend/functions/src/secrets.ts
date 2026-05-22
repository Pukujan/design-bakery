import { defineSecret } from 'firebase-functions/params';

/** Set before deploy: firebase functions:secrets:set OPENROUTER_API_KEY */
export const openRouterApiKey: ReturnType<typeof defineSecret> =
  defineSecret('OPENROUTER_API_KEY');

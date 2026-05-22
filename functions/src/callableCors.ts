/** Allowed browser origins for Gen2 callable preflight (backup if client hits Cloud Functions URL directly). */
export const CALLABLE_CORS: Array<string | RegExp> = [
  'https://www.design-bakery.com',
  'https://design-bakery.com',
  /^https:\/\/[a-z0-9-]+-[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

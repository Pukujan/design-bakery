/** Express route errors (replaces firebase-functions HttpsError). */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: { code?: string },
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

import type { Response } from 'express';

type ErrorLike = {
  code?: string;
  message?: string;
  details?: { code?: string };
};

function statusForFirebaseCode(code: string | undefined): number {
  switch (code) {
    case 'unauthenticated':
      return 401;
    case 'permission-denied':
      return 403;
    case 'invalid-argument':
    case 'not-found':
    case 'failed-precondition':
      return 400;
    case 'resource-exhausted':
      return 429;
    case 'unimplemented':
      return 501;
    default:
      return 500;
  }
}

export function sendRouteError(res: Response, error: unknown): void {
  const err = error as ErrorLike;
  const code = err?.code ?? 'internal';
  const status = statusForFirebaseCode(code);
  const message = err?.message ?? (error instanceof Error ? error.message : 'Request failed');
  const appCode = err?.details?.code ?? (status === 400 ? 'VALIDATION' : 'INTERNAL');
  if (status >= 500) {
    console.error('[api]', message, error);
  }
  res.status(status).json({ ok: false, code: appCode, message });
}

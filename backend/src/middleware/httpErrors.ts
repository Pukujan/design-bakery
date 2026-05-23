import type { Response } from 'express';
import { ApiError } from '../../services/lib/apiError.js';

type ErrorLike = {
  code?: string;
  message?: string;
  details?: { code?: string };
};

function isRouteError(error: unknown): error is ErrorLike & { code: string; message: string } {
  if (error instanceof ApiError) return true;
  const e = error as ErrorLike;
  return (
    typeof e?.code === 'string' &&
    typeof e?.message === 'string' &&
    [
      'invalid-argument',
      'not-found',
      'permission-denied',
      'unauthenticated',
      'resource-exhausted',
      'failed-precondition',
      'unimplemented',
    ].includes(e.code)
  );
}

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

function appCodeFor(status: number, detailsCode?: string): string {
  if (detailsCode) return detailsCode;
  if (status === 400) return 'VALIDATION';
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 429) return 'QUOTA';
  return 'INTERNAL';
}

function isAgentFailure(message: string): boolean {
  return /invalid JSON|OpenRouter|empty content|no usable tags/i.test(message);
}

function isStorageSetupFailure(message: string): boolean {
  return /Storage bucket not found|bucket does not exist|not a Firestore issue/i.test(message);
}

export function sendRouteError(res: Response, error: unknown): void {
  if (error instanceof Error && isStorageSetupFailure(error.message)) {
    res.status(400).json({ ok: false, code: 'STORAGE', message: error.message });
    return;
  }

  if (error instanceof Error && isAgentFailure(error.message)) {
    res.status(502).json({ ok: false, code: 'AGENT', message: error.message });
    return;
  }

  if (isRouteError(error)) {
    const status = statusForFirebaseCode(error.code);
    if (status >= 500) console.error('[api]', error.message, error);
    res.status(status).json({
      ok: false,
      code: appCodeFor(status, error.details?.code),
      message: error.message,
    });
    return;
  }

  const err = error as ErrorLike;
  const status = statusForFirebaseCode(err?.code);
  const message = err?.message ?? (error instanceof Error ? error.message : 'Request failed');
  const appCode = err?.details?.code ?? appCodeFor(status);
  if (status >= 500) {
    console.error('[api]', message, error);
  }
  res.status(status).json({ ok: false, code: appCode, message });
}

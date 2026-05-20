import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { AGENT_API_VERSION } from './config';
import type { AgentInvokeRequest, AgentInvokeResponse } from './contracts';

type InvokeParams = Omit<AgentInvokeRequest, 'version'> & { publicUrl?: string };

function extractCallableMessage(error: FirebaseError): string {
  const raw = error.message?.trim() ?? '';
  if (raw && raw.toLowerCase() !== 'internal') {
    return raw;
  }

  const custom = (error as FirebaseError & { customData?: { message?: string } }).customData;
  if (typeof custom?.message === 'string' && custom.message.length > 0) {
    return custom.message;
  }

  const details = (error as FirebaseError & { details?: unknown }).details;
  if (typeof details === 'string' && details.length > 0) {
    return details;
  }

  if (error.code === 'functions/unavailable' || error.code === 'functions/deadline-exceeded') {
    return `${raw || error.code} — Is the Functions emulator running? Run: pnpm run functions:serve`;
  }

  if (error.code === 'functions/internal') {
    return `${raw || 'Internal server error'} — Check the terminal where functions:serve is running for the real error.`;
  }

  return raw || error.code || 'Agent request failed';
}

function mapCallableError(error: unknown): AgentInvokeResponse {
  if (error instanceof FirebaseError) {
    const message = extractCallableMessage(error);
    const code = error.code;
    if (code === 'functions/unauthenticated' || code.includes('unauthenticated')) {
      return { ok: false, code: 'AUTH', message };
    }
    if (code === 'functions/resource-exhausted') {
      return { ok: false, code: 'QUOTA', message };
    }
    if (code === 'functions/invalid-argument' || code === 'functions/not-found') {
      return { ok: false, code: 'VALIDATION', message };
    }
    if (code === 'functions/failed-precondition') {
      return { ok: false, code: 'INTERNAL', message };
    }
    return { ok: false, code: 'INTERNAL', message };
  }

  return {
    ok: false,
    code: 'INTERNAL',
    message: error instanceof Error ? error.message : 'Agent request failed',
  };
}

/** Callable proxy to Firebase Functions — OpenRouter stays server-side. */
export async function invokeBlogAgent(params: InvokeParams): Promise<AgentInvokeResponse> {
  if (!functions) {
    return {
      ok: false,
      code: 'INTERNAL',
      message: 'Firebase Functions are not configured.',
    };
  }

  const callable = httpsCallable<AgentInvokeRequest, AgentInvokeResponse>(
    functions,
    'invokeBlogAgent',
    { timeout: 180_000 }
  );

  try {
    const result = await callable({
      version: AGENT_API_VERSION,
      ...params,
    });
    const data = result.data;
    if (data && typeof data === 'object' && 'ok' in data) {
      return data;
    }
    return { ok: false, code: 'INTERNAL', message: 'Unexpected agent response shape.' };
  } catch (error) {
    return mapCallableError(error);
  }
}

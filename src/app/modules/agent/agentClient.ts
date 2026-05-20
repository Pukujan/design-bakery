import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { AGENT_API_VERSION } from './config';
import type { AgentInvokeRequest, AgentInvokeResponse } from './contracts';

type InvokeParams = Omit<AgentInvokeRequest, 'version'> & { publicUrl?: string };

function mapCallableError(error: unknown): AgentInvokeResponse {
  if (error instanceof FirebaseError) {
    const code = error.code;
    if (code === 'functions/unauthenticated' || code.includes('unauthenticated')) {
      return { ok: false, code: 'AUTH', message: error.message };
    }
    if (code === 'functions/resource-exhausted') {
      return { ok: false, code: 'QUOTA', message: error.message };
    }
    if (code === 'functions/invalid-argument' || code === 'functions/not-found') {
      return { ok: false, code: 'VALIDATION', message: error.message };
    }
    if (code === 'functions/failed-precondition') {
      return { ok: false, code: 'INTERNAL', message: error.message };
    }
    return { ok: false, code: 'INTERNAL', message: error.message };
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
    'invokeBlogAgent'
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

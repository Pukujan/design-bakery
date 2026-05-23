import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from './firebaseApp.js';

const DAILY_CALL_LIMIT = 30;
const DAILY_TOKEN_LIMIT = 120_000;

export type UsageSnapshot = {
  calls: number;
  tokens: number;
  dateKey: string;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getUsage(uid: string): Promise<UsageSnapshot> {
  const db = adminFirestore();
  const ref = db.collection('agent_usage').doc(uid);
  const snap = await ref.get();
  const dateKey = todayKey();

  if (!snap.exists) {
    return { calls: 0, tokens: 0, dateKey };
  }

  const data = snap.data() as { dateKey?: string; calls?: number; tokens?: number };
  if (data.dateKey !== dateKey) {
    return { calls: 0, tokens: 0, dateKey };
  }

  return {
    calls: data.calls ?? 0,
    tokens: data.tokens ?? 0,
    dateKey,
  };
}

export async function assertWithinLimits(uid: string): Promise<UsageSnapshot> {
  const usage = await getUsage(uid);
  if (usage.calls >= DAILY_CALL_LIMIT) {
    throw new Error('QUOTA: Daily agent call limit reached.');
  }
  if (usage.tokens >= DAILY_TOKEN_LIMIT) {
    throw new Error('QUOTA: Daily token limit reached.');
  }
  return usage;
}

export async function recordUsage(
  uid: string,
  delta: { calls?: number; tokens?: number }
): Promise<UsageSnapshot> {
  const db = adminFirestore();
  const ref = db.collection('agent_usage').doc(uid);
  const dateKey = todayKey();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.data() as { dateKey?: string; calls?: number; tokens?: number } | undefined;
    const reset = !prev || prev.dateKey !== dateKey;
    const calls = (reset ? 0 : (prev?.calls ?? 0)) + (delta.calls ?? 0);
    const tokens = (reset ? 0 : (prev?.tokens ?? 0)) + (delta.tokens ?? 0);
    tx.set(ref, { dateKey, calls, tokens, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  });

  return getUsage(uid);
}

export function remainingFromUsage(usage: UsageSnapshot) {
  return {
    remainingDailyCalls: Math.max(0, DAILY_CALL_LIMIT - usage.calls),
    remainingDailyTokens: Math.max(0, DAILY_TOKEN_LIMIT - usage.tokens),
  };
}

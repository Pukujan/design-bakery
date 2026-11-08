import { useEffect, useRef, useState } from 'react';
import { useCopilot, type CopilotMessage } from './store';
import { useVoice } from './voice';

/** The latest reply, flattened to one line, or what it is doing while the reply has no words yet. */
export function previewOf(messages: CopilotMessage[]): string {
  const reply = [...messages].reverse().find((message) => message.role === 'assistant');
  if (!reply) return 'Ask me anything about my work.';
  if (reply.text) return reply.text.replace(/\s+/g, ' ').trim();
  return reply.steps.length ? 'Looking that up…' : 'Thinking…';
}

/** How long a finished reply stays in the bubble before it folds into the pill's "New reply". */
const SHOW_MS = 12_000;

export type ReplyPeek = { kind: 'dots' | 'text'; text: string };

/**
 * What a text chat is doing for a visitor who cannot see the chat (the hero is scrolled away and the panel is shut):
 * dots while it works, then the start of the reply for a few seconds. `unseen` stays true until the chat is opened,
 * so the pill can say there is a new reply. Never on a call, where the moon and its voice already say it.
 */
export function useReplyPeek(): { peek: ReplyPeek | null; unseen: boolean } {
  const { messages, busy, open, heroVisible } = useCopilot();
  const call = useVoice();
  const last = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastId = last?.id ?? 0;
  const watching = open || heroVisible;
  const [seenId, setSeenId] = useState(lastId);
  const [doneAt, setDoneAt] = useState(0);
  const [, setTick] = useState(0);
  const doneId = useRef(lastId);

  // Seen once the chat is on screen. Each reply starts the bubble's clock as it ends (a saved reply ends at once).
  useEffect(() => {
    if (watching) setSeenId(lastId);
  }, [watching, lastId, busy]);
  useEffect(() => {
    if (busy || doneId.current === lastId) return;
    doneId.current = lastId;
    setDoneAt(Date.now());
  }, [busy, lastId]);
  useEffect(() => {
    if (!doneAt) return;
    const timer = setTimeout(() => setTick((n) => n + 1), SHOW_MS + 50);
    return () => clearTimeout(timer);
  }, [doneAt]);

  if (call.status !== 'idle' || watching || !last || last.error) return { peek: null, unseen: false };
  const unseen = last.id !== seenId;
  if (busy) return { peek: { kind: 'dots', text: '' }, unseen: false };
  if (!unseen || Date.now() - doneAt > SHOW_MS) return { peek: null, unseen };
  const text = previewOf(messages);
  return { peek: { kind: 'text', text: text.length > 120 ? `${text.slice(0, 117).trimEnd()}…` : text }, unseen };
}

/** How long the way to keep talking sparkles once a reply has ended. */
const NUDGE_MS = 4_500;

/**
 * True for a few seconds after a text reply ends, so the way to go on (the "Continue chat" pill when the chat is shut,
 * the call button when it is open) can sparkle and invite the next turn. Never on a call, after an error, or for the
 * replies already on the thread when the page loads.
 */
export function useReplyNudge(): boolean {
  const { messages, busy } = useCopilot();
  const call = useVoice();
  const last = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastId = last?.id ?? 0;
  const doneId = useRef(lastId);
  const [nudging, setNudging] = useState(false);

  useEffect(() => {
    if (busy || doneId.current === lastId) return;
    doneId.current = lastId;
    if (!last || last.error || call.status !== 'idle') return;
    setNudging(true);
    const timer = setTimeout(() => setNudging(false), NUDGE_MS);
    return () => clearTimeout(timer);
  }, [busy, lastId, last, call.status]);

  return nudging && !busy && call.status === 'idle';
}

/**
 * Songs on the owner's Flow Music plan (TASK-DB-0160). The song maker (music-agent/, `design-bakery-music` on the VPS)
 * does the making: a signed-in Chrome that starts for each song and closes after, about a minute a song. This module is
 * the site's side: the cache (a request with the same style, subject and lyrics plays the saved song and costs nothing),
 * the limits (a few songs a day for one visitor, a ceiling for the whole site) and the status the chat's player polls.
 * Rows live in Octo, public.copilot_songs (supabase/migrations/014_copilot_songs.sql). Off unless MUSIC_URL is set.
 */
import { createHash, createHmac } from 'node:crypto';
import { dbExec, dbQueryOne, isDataLayerConfigured } from '../../services/lib/db.js';

const musicUrl = () => process.env.MUSIC_URL?.trim().replace(/\/$/, '') ?? '';
const perVisitor = () => Number(process.env.SONGS_PER_VISITOR_DAY ?? 2);
const perDay = () => Number(process.env.SONGS_PER_DAY ?? 20);

export const songsConfigured = () => Boolean(musicUrl()) && isDataLayerConfigured();

export type SongAsk = { style: string; about: string; lyrics?: string; instrumental?: boolean };
export type SongStart =
  | { ok: true; id: string; cached: boolean; title?: string | null }
  | { ok: false; reason: 'visitor_limit' | 'daily_limit' | 'busy' | 'down' };
export type SongStatus = { id: string; state: 'making' | 'done' | 'failed'; title?: string | null; seconds?: number | null; lyrics?: string | null; takes?: number };

const norm = (text = '') => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** The same ask, however it is spaced or capitalised, is the same song. */
export function songKey(ask: SongAsk): string {
  return createHash('sha256').update([norm(ask.style), norm(ask.about), norm(ask.lyrics), ask.instrumental ? 'i' : 'v'].join('\0')).digest('hex');
}

/** What Flow Music's producer is asked for: short, and nothing that copies a real person. */
export function songPrompt(ask: SongAsk): string {
  return `A short, fun ${ask.style.trim()} song about ${ask.about.trim()}. Keep it under two minutes. No real people's names and no imitation of any named artist.`.slice(0, 600);
}

function visitorId(session: string): string {
  const secret = process.env.COPILOT_RATE_SECRET ?? process.env.COPILOT_PASS_SECRET ?? 'songs';
  return createHmac('sha256', secret).update(`song\0${session}`).digest('hex').slice(0, 64);
}

const id16 = (id: string) => /^[0-9a-f]{16}$/.test(id);

/** Start a song, or hand back the saved one for the same ask. `exempt` (the owner's own address) skips the limits. */
export async function startSong(ask: SongAsk, session: string, exempt = false): Promise<SongStart> {
  const key = songKey(ask);
  const saved = await dbQueryOne<{ id: string; title: string | null }>(
    "select id, title from public.copilot_songs where key = $1 and state = 'done' order by created_at desc limit 1", [key]);
  if (saved) return { ok: true, id: saved.id, cached: true, title: saved.title };
  const visitor = visitorId(session);
  if (!exempt) {
    const counts = await dbQueryOne<{ mine: number; total: number }>(
      "select count(*) filter (where visitor = $1)::int as mine, count(*)::int as total from public.copilot_songs where created_at > now() - interval '1 day' and state <> 'failed'",
      [visitor]);
    if ((counts?.mine ?? 0) >= perVisitor()) return { ok: false, reason: 'visitor_limit' };
    if ((counts?.total ?? 0) >= perDay()) return { ok: false, reason: 'daily_limit' };
  }
  const prompt = songPrompt(ask);
  let res: Response;
  try {
    res = await fetch(`${musicUrl()}/songs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, lyrics: ask.lyrics, instrumental: ask.instrumental }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return { ok: false, reason: 'down' };
  }
  if (res.status === 429) return { ok: false, reason: 'busy' };
  const body = (await res.json().catch(() => ({}))) as { id?: string };
  if (!res.ok || !body.id || !id16(body.id)) return { ok: false, reason: 'down' };
  await dbExec('insert into public.copilot_songs (id, key, visitor, prompt) values ($1, $2, $3, $4)', [body.id, key, visitor, prompt]);
  return { ok: true, id: body.id, cached: false };
}

/** Where a song is. A finished one is answered from Octo; one being made is asked of the song maker, and saved once done. */
export async function songStatus(id: string): Promise<SongStatus | null> {
  if (!id16(id)) return null;
  const row = await dbQueryOne<{ state: SongStatus['state']; title: string | null; seconds: number | null; lyrics: string | null; takes: number }>(
    'select state, title, seconds, lyrics, takes from public.copilot_songs where id = $1', [id]);
  if (!row) return null;
  if (row.state !== 'making') return { id, ...row };
  const res = await fetch(`${musicUrl()}/songs/${id}`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
  const job = res?.ok ? ((await res.json()) as { state?: string; title?: string; seconds?: number; lyrics?: string; takes?: number; error?: string }) : null;
  // The song maker forgets a job when it restarts (a deploy): that song is lost, and the visitor can ask again.
  if (!job || job.state === 'failed') {
    await dbExec("update public.copilot_songs set state = 'failed', error = $2, done_at = now() where id = $1", [id, (job?.error ?? 'lost').slice(0, 300)]);
    return { id, state: 'failed' };
  }
  if (job.state !== 'done') return { id, state: 'making' };
  // Flow Music names a session after its song a little later; until then it reads like "Today at 7:20 AM".
  const named = job.title && !/^(today|yesterday)\b|^\d+\/\d+/i.test(job.title) ? job.title : null;
  const done = { title: named?.slice(0, 120) ?? null, seconds: job.seconds ?? null, lyrics: job.lyrics?.slice(0, 6000) ?? null, takes: job.takes === 2 ? 2 : 1 };
  await dbExec("update public.copilot_songs set state = 'done', title = $2, seconds = $3, lyrics = $4, takes = $5, done_at = now() where id = $1", [id, done.title, done.seconds, done.lyrics, done.takes]);
  return { id, state: 'done', ...done };
}

/** One take of the song's audio (Flow Music makes two), from the song maker's volume. */
export async function songAudio(id: string, take = 1): Promise<Response | null> {
  if (!id16(id)) return null;
  const res = await fetch(`${musicUrl()}/songs/${id}/audio${take === 2 ? '?take=2' : ''}`).catch(() => null);
  return res?.ok ? res : null;
}

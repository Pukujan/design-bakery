/**
 * The chat's replies, spoken (TASK-DB-0165). Outside a call the copilot reads its typed replies aloud in AI Pujan's own
 * voice (Pocket TTS on the Pro, through the shared speech gateway: voice-agent-research docs/speech-gateway.md). Only the
 * API decides what is said: /chat registers each finished reply here and hands the page an id; the page fetches
 * GET /speech/:id. There is no "say anything" endpoint.
 *
 * Every clip is kept as a public Octo file, keyed by a hash of its words (public.copilot_speech, migration 018), so the same
 * words play at once for every later visitor. A clip not yet made is synthesised once, as soon as the reply is finished,
 * while the page is still typing it out. Failure is silence: no cloud voice, never.
 */
import { createHash } from 'node:crypto';
import { dbExec, dbQueryOne, isDataLayerConfigured } from '../../services/lib/db.js';
import { isAssetStorageConfigured, uploadOctoPublicFile } from '../../services/lib/octoFiles.js';

/** Bump when the voice changes, so old clips are not played in a new voice. */
const VOICE = 'v1|english-fast|en';
const SAMPLE_RATE = 24_000;
/** A cold Pro loads the models first (21 s measured 2026-11-14); past this the reply stays silent. */
const SYNTH_TIMEOUT_MS = 30_000;
const MAX_WORDS_CHARS = 1200;
/** Recently used clips, in memory, so a hot clip skips the trip to Octo. */
const MEMORY_BYTES = 48 * 1024 * 1024;

const gateway = () => process.env.SPEECH_GATEWAY_URL?.trim().replace(/\/$/, '') ?? '';
export const speechConfigured = () => Boolean(gateway());

/** What is read aloud: the reply's words without markdown, links, emoji or list marks. */
export function spokenText(reply: string): string {
  return reply
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|[-*+]|\d+[.)])\s+/gm, '')
    .replace(/[*_~>|]+/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, MAX_WORDS_CHARS);
}

/** The English voice reads English: a reply mostly in another script is left unspoken rather than read badly. */
export function speakable(words: string): boolean {
  const letters = words.match(/\p{L}/gu) ?? [];
  if (letters.length < 2) return false;
  const latin = letters.filter((ch) => /[A-Za-zÀ-ɏ]/.test(ch)).length;
  return latin / letters.length > 0.9;
}

/** Shorter than this, a sentence is said with its neighbour: a clip under half a second is refused, and a lone "Yes." sounds clipped. */
const PART_MIN_CHARS = 40;
const PART_TAIL_CHARS = 25;

/**
 * The spoken words cut into clips of one or two sentences, in order (TASK-DB-0166). The gateway makes a whole clip before it
 * sends any of it, at about a quarter of its length: a 19 s reply was 4 to 5 s of silence. Cut up, the first sentence is
 * ready in about a second and the rest are made while it plays.
 */
export function sentenceParts(words: string): string[] {
  // An end is a full stop, ! or ? followed by a space and a capital or a digit: not the dot in 2.5, 9.11 or "a.m. today".
  const sentences = words.split(/(?<=[.!?]["')\]]?)\s+(?=["'(]?[A-Z0-9])/).map((part) => part.trim()).filter(Boolean);
  // A long opening sentence is cut once more at its first colon, semicolon or dash (a pause when spoken anyway), so the
  // voice starts on a few words and not on a paragraph.
  const lead = sentences[0] ?? '';
  const pause = lead.length > 110 ? /[:;](?=\s)|\s[—–](?=\s)/.exec(lead.slice(PART_MIN_CHARS)) : null;
  if (pause) {
    const cut = PART_MIN_CHARS + pause.index + pause[0].length;
    if (lead.length - cut >= PART_MIN_CHARS) sentences.splice(0, 1, lead.slice(0, cut).trim(), lead.slice(cut).trim());
  }
  const parts: string[] = [];
  let open = '';
  for (const sentence of sentences) {
    open = open ? `${open} ${sentence}` : sentence;
    if (open.length >= PART_MIN_CHARS) {
      parts.push(open);
      open = '';
    }
  }
  if (open) {
    if (parts.length && open.length < PART_TAIL_CHARS) parts[parts.length - 1] += ` ${open}`;
    else parts.push(open);
  }
  // Nothing may be lost in the cutting: if the pieces do not add up to the words, the reply is one clip.
  return parts.join(' ').replace(/\s+/g, ' ') === words.replace(/\s+/g, ' ') ? parts : [words];
}

export const speechId = (words: string) => createHash('sha256').update(`${VOICE}\n${words}`).digest('hex').slice(0, 32);

type Clip = { audio: Buffer; at: number };
const memory = new Map<string, Clip>();
let memoryBytes = 0;
function remember(id: string, audio: Buffer) {
  if (memory.has(id)) return;
  memory.set(id, { audio, at: Date.now() });
  memoryBytes += audio.byteLength;
  for (const [key, clip] of memory) {
    if (memoryBytes <= MEMORY_BYTES) break;
    memory.delete(key);
    memoryBytes -= clip.audio.byteLength;
  }
}

/** Clips being made, by id: one synthesis per clip however many ask. Words registered by /chat but not made yet wait here too. */
const making = new Map<string, Promise<Buffer | null>>();
const registered = new Map<string, { words: string; at: number }>();
const REGISTERED_MS = 15 * 60_000;

/** A WAV header for 16-bit mono PCM at the gateway's rate. */
export function wav(pcm: Buffer): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.byteLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.byteLength, 40);
  return Buffer.concat([header, pcm]);
}

async function savedUrl(id: string): Promise<string | null> {
  if (!isDataLayerConfigured()) return null;
  const row = await dbQueryOne<{ audio_url: string }>('select audio_url from public.copilot_speech where id = $1', [id]).catch(() => null);
  return row?.audio_url ?? null;
}

async function synthesise(id: string, words: string): Promise<Buffer | null> {
  const url = gateway();
  if (!url) return null;
  try {
    const response = await fetch(`${url}/tts`, {
      method: 'POST',
      // A project, no call id: the gateway puts it on the first server with room for the English stack, unpinned.
      headers: { 'content-type': 'application/json', 'x-speech-project': 'design-bakery' },
      body: JSON.stringify({ text: words, stack: 'english-fast', lang: 'en' }),
      signal: AbortSignal.timeout(SYNTH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`gateway ${response.status}`);
    const pcm = Buffer.from(await response.arrayBuffer());
    if (pcm.byteLength < SAMPLE_RATE) throw new Error('too short');
    const audio = wav(pcm);
    remember(id, audio);
    void keep(id, words, audio);
    return audio;
  } catch (error) {
    console.warn('[speech] no clip:', error instanceof Error ? error.message.slice(0, 120) : 'unknown');
    return null;
  }
}

/** Saved to Octo for every later visitor. A failure only means the next visitor waits for a fresh one. */
async function keep(id: string, words: string, audio: Buffer) {
  if (!isAssetStorageConfigured() || !isDataLayerConfigured()) return;
  try {
    const file = await uploadOctoPublicFile({ buffer: audio, contentType: 'audio/wav', logicalPath: `copilot-speech/${id}.wav` });
    await dbExec(
      'insert into public.copilot_speech (id, words, audio_url, bytes) values ($1, $2, $3, $4) on conflict (id) do nothing',
      [id, words, file.url, audio.byteLength],
    );
  } catch (error) {
    console.warn('[speech] not kept:', id, error instanceof Error ? error.message.slice(0, 120) : 'unknown');
  }
}

export type ReplySpeech = {
  /** The whole reply as one clip: what a page from before TASK-DB-0166 fetches, and what plays when it is already kept. */
  id: string;
  ready: boolean;
  /** The reply in sentence clips, in order, when it is new and has more than one: the page plays them one after another. */
  parts?: { id: string; ready: boolean }[];
};

function note(id: string, words: string, now: number) {
  registered.set(id, { words, at: now });
}

const have = async (id: string) => memory.has(id) || Boolean(await savedUrl(id));

/**
 * A finished reply, to be spoken: returns its id and whether a clip is ready, and starts making it if not, so it is ready
 * (or nearly) by the time the page asks. A new reply of several sentences is made as one clip a sentence or two, first
 * sentence first, so the voice starts after the first and not after all of them. Null when the reply has nothing to say
 * aloud or speech is not set up here.
 */
export async function registerReply(reply: string): Promise<ReplySpeech | null> {
  if (!speechConfigured()) return null;
  const words = spokenText(reply);
  if (!speakable(words)) return null;
  const id = speechId(words);
  const now = Date.now();
  for (const [key, entry] of registered) if (now - entry.at > REGISTERED_MS) registered.delete(key);
  note(id, words, now);
  if (memory.has(id) || making.has(id)) return { id, ready: memory.has(id) };
  if (await savedUrl(id)) return { id, ready: true };
  const pieces = sentenceParts(words).filter(speakable);
  if (pieces.length < 2) {
    start(id, words);
    return { id, ready: false };
  }
  // The whole clip is not made unless a page asks for it by its id (clipFor): the parts are what a current page plays.
  const ids = pieces.map(speechId);
  const readies = await Promise.all(ids.map(have));
  const parts = ids.map((partId, index) => ({ id: partId, ready: readies[index] }));
  let before: Promise<unknown> = Promise.resolve();
  pieces.forEach((piece, index) => {
    const partId = ids[index];
    note(partId, piece, now);
    if (readies[index] || making.has(partId)) return;
    // One after another, so the first sentence is never waiting behind the last.
    const after = before;
    const job = after.then(() => synthesise(partId, piece)).finally(() => making.delete(partId));
    making.set(partId, job);
    before = job;
  });
  return { id, ready: false, parts };
}

function start(id: string, words: string) {
  const job = synthesise(id, words).finally(() => making.delete(id));
  making.set(id, job);
  return job;
}

/** The clip for an id /chat handed out (or one already kept): its WAV bytes, or null. */
export async function clipFor(id: string): Promise<Buffer | null> {
  if (!/^[0-9a-f]{32}$/.test(id)) return null;
  const hot = memory.get(id);
  if (hot) {
    hot.at = Date.now();
    return hot.audio;
  }
  const pending = making.get(id);
  if (pending) return pending;
  const url = await savedUrl(id);
  if (url) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (response.ok) {
        const audio = Buffer.from(await response.arrayBuffer());
        remember(id, audio);
        return audio;
      }
    } catch {
      /* fall through: made again below if the words are known */
    }
  }
  const entry = registered.get(id);
  return entry ? start(id, entry.words) : null;
}

/* ---------- Page-button summaries ---------- */

/** A summary is the same for every visitor on that page, so it is answered once and kept: the same words, the same clip. */
export const SUMMARY_QUESTION = 'Summarise this for me.';
const SUMMARY_DAYS = 7;

export type KeptReply = { text: string; actions: unknown[] };

/** Bump when what a summary's reply or buttons may hold changes, so the old ones are answered afresh (2: TASK-DB-0166, no "Jump to" a project's sidebar). */
const SUMMARY_VERSION = 2;
export const summaryKey = (path: string) => `summary:${SUMMARY_VERSION}:${VOICE}:${path.slice(0, 200)}`;

export async function keptSummary(path: string): Promise<KeptReply | null> {
  if (!isDataLayerConfigured()) return null;
  const row = await dbQueryOne<{ reply: string }>(
    `select reply from public.copilot_summaries where key = $1 and created_at > now() - interval '${SUMMARY_DAYS} days'`,
    [summaryKey(path)],
  ).catch(() => null);
  if (!row) return null;
  try {
    const reply = JSON.parse(row.reply) as KeptReply;
    return typeof reply.text === 'string' && reply.text.trim() && Array.isArray(reply.actions) ? reply : null;
  } catch {
    return null;
  }
}

export async function keepSummary(path: string, reply: KeptReply): Promise<void> {
  if (!isDataLayerConfigured()) return;
  await dbExec(
    `insert into public.copilot_summaries (key, reply) values ($1, $2)
     on conflict (key) do update set reply = excluded.reply, created_at = now()`,
    [summaryKey(path), JSON.stringify(reply)],
  ).catch((error) => console.warn('[speech] summary not kept:', error instanceof Error ? error.message.slice(0, 120) : 'unknown'));
}

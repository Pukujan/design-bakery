import { useEffect, useRef, useState } from 'react';
import { Music, X } from 'lucide-react';
import { copilot, useCopilot } from './store';
import { useVoice, voice } from './voice';

type Status = { state: 'making' | 'done' | 'failed'; title?: string | null; seconds?: number | null; lyrics?: string | null; takes?: number };

const POLL_MS = 4000;
const GIVE_UP_MS = 6 * 60_000;
// Songs that already played by themselves. Kept outside the player so a remount (the chat reopening, a reload of the
// module in dev) does not start the song over.
const autoplayed = new Set<string>();

/** Polls a song until it is made (about a minute). */
function useSong(id: string) {
  const [status, setStatus] = useState<Status>({ state: 'making' });
  useEffect(() => {
    let stop = false;
    const started = Date.now();
    const tick = async () => {
      try {
        const res = await fetch(copilot.songUrl(id));
        const body = (await res.json()) as Status & { ok?: boolean };
        if (!stop && res.ok) setStatus(body);
        if (!res.ok || body.state !== 'making') return;
      } catch {
        /* try again on the next tick */
      }
      if (!stop && Date.now() - started < GIVE_UP_MS) setTimeout(() => void tick(), POLL_MS);
      else if (!stop) setStatus({ state: 'failed' });
    };
    void tick();
    return () => { stop = true; };
  }, [id]);
  return status;
}

/**
 * A song the copilot is making (make_song, backend/src/copilot/songs.ts). In the chat it sits under the reply; on a call it
 * floats over the page like the booking card. While it plays on a call the microphone is held, so the song is not heard as
 * the visitor talking. Flow Music makes two takes of every song; the first plays by itself and the visitor can switch.
 */
export function SongPlayer({ id, title, floating = false }: { id: string; title?: string | null; floating?: boolean }) {
  const status = useSong(id);
  const audio = useRef<HTMLAudioElement>(null);
  const { status: call } = useVoice();
  const [showLyrics, setShowLyrics] = useState(false);
  const [take, setTake] = useState(1);
  const name = status.title || title || 'Your song';

  useEffect(() => {
    if (status.state !== 'done' || autoplayed.has(id) || !audio.current) return;
    autoplayed.add(id);
    audio.current.play().catch(() => { /* blocked: the visitor presses play */ });
  }, [status.state, id]);

  const onCall = call === 'connected';
  // Switching takes keeps playing if a take was playing.
  const resume = useRef(false);
  const pick = (n: number) => {
    resume.current = Boolean(audio.current && !audio.current.paused);
    setTake(n);
  };
  useEffect(() => {
    if (resume.current) audio.current?.play().catch(() => {});
    resume.current = false;
  }, [take]);
  return (
    <aside className={`cp-song${floating ? ' cp-song--floating' : ''}`} aria-label={`Song: ${name}`}>
      {floating && (
        <button type="button" className="cp-book-close" aria-label="Close" onClick={() => copilot.dismissSong()}>
          <X size={14} aria-hidden />
        </button>
      )}
      <p className="cp-song-kicker"><Music size={12} aria-hidden /> {status.state === 'done' ? name : 'Song'}</p>
      {status.state === 'making' && (
        <p className="cp-song-wait"><span className="cp-song-bars" aria-hidden><i /><i /><i /><i /></span> Writing it now, about a minute…</p>
      )}
      {status.state === 'failed' && <p className="cp-song-wait">That one did not come out. Ask me again in a minute.</p>}
      {status.state === 'done' && (
        <>
          <audio
            ref={audio}
            className="cp-song-audio"
            controls
            preload="auto"
            src={copilot.songUrl(id, true, take)}
            onPlay={() => { if (onCall) void voice.holdMic(true); }}
            onPause={() => { if (onCall) void voice.holdMic(false); }}
            onEnded={() => { if (onCall) void voice.holdMic(false); }}
          />
          {(status.takes ?? 1) > 1 && (
            <div className="cp-song-takes" role="group" aria-label="Takes">
              {[1, 2].map((n) => (
                <button key={n} type="button" className="cp-song-take" aria-pressed={take === n} onClick={() => pick(n)}>
                  Take {n}
                </button>
              ))}
            </div>
          )}
          {status.lyrics && (
            <button type="button" className="cp-song-lyrics-toggle" onClick={() => setShowLyrics((v) => !v)}>
              {showLyrics ? 'Hide lyrics' : 'Lyrics'}
            </button>
          )}
          {showLyrics && status.lyrics && <pre className="cp-song-lyrics">{status.lyrics}</pre>}
        </>
      )}
    </aside>
  );
}

/** The song a call asked for, over the page. */
export function SongCard() {
  const { song } = useCopilot();
  if (!song) return null;
  return <SongPlayer key={song.id} id={song.id} title={song.title} floating />;
}

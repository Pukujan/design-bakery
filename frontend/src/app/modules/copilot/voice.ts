import { useSyncExternalStore } from 'react';
import { copilot, requestVoiceGrant } from './store';
import type { LocalAudioTrack, Room } from 'livekit-client';
import { noteActivity, pauseNudges, preloadHold, resumeNudges, startHold, startNudges, startThinking, stopHold, stopNudges, type Thinking } from './holdAudio';
import { pickOrigin, type SkyOrigin } from './skyOrigin';

/** Who is talking right now, so the orb can show it. */
export type Speaking = 'none' | 'user' | 'agent';
type VoiceState = {
  status: 'idle' | 'connecting' | 'connected';
  error: string;
  audioBlocked: boolean;
  speaking: Speaking;
  muted: boolean;
  /** The pre-recorded line being spoken while the call connects, or ''. */
  hold: string;
  /** An answer is being worked out for the visitor's last question. */
  thinking: boolean;
  /** Where this call seems to come from, picked when it starts. */
  origin: SkyOrigin | null;
};
let state: VoiceState = { status: 'idle', error: '', audioBlocked: false, speaking: 'none', muted: false, hold: '', thinking: false, origin: null };

/** A level meter on one audio stream: the visitor's mic or the agent's voice. */
type Meter = { source: MediaStreamAudioSourceNode; analyser: AnalyserNode; samples: Float32Array<ArrayBuffer> };
let context: AudioContext | null = null;
const meters: Record<'user' | 'agent', Meter | null> = { user: null, agent: null };
let room: Room | null = null;
let microphone: LocalAudioTrack | null = null;
let generation = 0;
let pending: AbortController | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let agentTimer: ReturnType<typeof setTimeout> | undefined;
/** The fillers playing while an answer is worked out, and the page scrolls timed to the answer being spoken. */
let thinking: Thinking | null = null;
let thinkingSince = 0;
let stepTimers: Array<ReturnType<typeof setTimeout>> = [];
/** How fast the agent speaks, in characters a second, to time scrolls to the words. */
const SPEECH_CHARS_PER_S = 14;
/** The agent needs a moment after it receives an answer before the first word is heard. */
const SPEECH_LEAD_MS = 800;
const audioElements = new Set<HTMLMediaElement>();
const listeners = new Set<() => void>();
const set = (patch: Partial<VoiceState>) => {
  // Once the call is up, failed or over, the hold lines stop; they only belong to connecting.
  if (patch.status && patch.status !== 'connecting') {
    stopHold();
    patch = { ...patch, hold: '' };
  }
  // A connected call that goes quiet is nudged with saved lines; they stop when the call ends or fails.
  if (patch.status === 'connected' && state.status !== 'connected') {
    startNudges((hold) => set({ hold }), () => state.muted);
  } else if (patch.status === 'idle') {
    stopNudges();
  }
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};
export const useVoice = () => useSyncExternalStore(
  (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
  () => state,
  () => state,
);

/**
 * Create the audio context inside the click that starts the call, before any await, so the
 * browser lets it run. Analysers read the streams; they never play them, so audio is unchanged.
 */
function openContext() {
  if (context) return;
  try {
    context = new AudioContext();
    void context.resume().catch(() => undefined);
  } catch {
    context = null;
  }
}

function attachMeter(side: 'user' | 'agent', track: MediaStreamTrack) {
  if (!context) return;
  try {
    meters[side]?.source.disconnect();
    const source = context.createMediaStreamSource(new MediaStream([track]));
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    meters[side] = { source, analyser, samples: new Float32Array(analyser.fftSize) };
  } catch {
    meters[side] = null;
  }
}

function detachMeters() {
  for (const side of ['user', 'agent'] as const) {
    meters[side]?.source.disconnect();
    meters[side] = null;
  }
  void context?.close().catch(() => undefined);
  context = null;
}

/** Loudness of the visitor's mic or the agent's voice, 0 to 1. Silence or no stream reads 0. */
export function audioLevel(side: 'user' | 'agent'): number {
  const meter = meters[side];
  if (!meter) return 0;
  meter.analyser.getFloatTimeDomainData(meter.samples);
  let sum = 0;
  for (const value of meter.samples) sum += value * value;
  const rms = Math.sqrt(sum / meter.samples.length);
  const gated = Math.max(0, rms - 0.006);
  return Math.min(1, Math.sqrt(gated) * 2.2);
}

function close(error = '') {
  generation += 1;
  pending?.abort();
  pending = null;
  clearTimeout(timer);
  clearTimeout(agentTimer);
  thinking?.cancel();
  thinking = null;
  for (const timer of stepTimers) clearTimeout(timer);
  stepTimers = [];
  microphone?.stop();
  microphone = null;
  const current = room;
  room = null;
  if (current) void current.disconnect();
  for (const audio of audioElements) audio.remove();
  audioElements.clear();
  detachMeters();
  set({ status: 'idle', error, audioBlocked: false, speaking: 'none', muted: false, origin: null });
}

export const voice = {
  stop: () => close(),
  /** Fetch the hold lines ahead of the click so the first one starts at once. */
  preload: () => preloadHold(),
  /** Mutes or unmutes the visitor's microphone on the call. */
  async toggleMute() {
    const track = microphone;
    if (!track) return;
    const next = !state.muted;
    try {
      if (next) await track.mute();
      else await track.unmute();
      if (microphone === track) set({ muted: next });
    } catch {
      /* keep the current mute state */
    }
  },
  async enableAudio() {
    try {
      await room?.startAudio();
      set({ audioBlocked: room ? !room.canPlaybackAudio : false });
    } catch {
      set({ audioBlocked: true });
    }
  },
  async start() {
    if (state.status !== 'idle') return;
    const run = ++generation;
    const controller = new AbortController();
    pending = controller;
    openContext();
    set({ status: 'connecting', error: '', muted: false, origin: pickOrigin() });
    // Inside the click: the first hold line plays now, while the call connects behind it.
    startHold((hold) => set({ hold }));
    try {
      // The grant is requested at once, in parallel with the microphone prompt, so neither waits for the other.
      // Microphone permission is still only asked after the visitor explicitly starts a call.
      const grantRequest = requestVoiceGrant(controller.signal);
      void grantRequest.catch(() => undefined);
      const lk = await import('livekit-client');
      const [mic, grantResult] = await Promise.allSettled([
        lk.createLocalAudioTrack({ echoCancellation: true, noiseSuppression: true, autoGainControl: true }),
        grantRequest,
      ]);
      if (mic.status === 'fulfilled' && (generation !== run || grantResult.status === 'rejected')) mic.value.stop();
      if (generation !== run) return;
      if (mic.status === 'rejected') throw mic.reason;
      if (grantResult.status === 'rejected') throw grantResult.reason;
      const track = mic.value;
      const grant = grantResult.value;
      microphone = track;
      attachMeter('user', track.mediaStreamTrack);
      const call = new lk.Room({ adaptiveStream: false, dynacast: false });
      room = call;
      const isAgent = (identity: string) => call.remoteParticipants.get(identity)?.isAgent === true;
      call.registerRpcMethod('copilot.greet', async (data) => {
        if (!isAgent(data.callerIdentity)) throw new Error('Unrecognized voice participant');
        return JSON.stringify({ say: "Hi, I'm AI Pujan. Ask me about my work, my writing, or my research." });
      });
      call.registerRpcMethod('copilot.turn', async (data) => {
        if (!isAgent(data.callerIdentity)) throw new Error('Unrecognized voice participant');
        let question = '';
        try { question = String(JSON.parse(data.payload || '{}').text ?? '').slice(0, 2000); } catch { /* invalid speech payload */ }
        if (!question || generation !== run) return JSON.stringify({ say: 'Could you say that again?' });
        // Nothing is quiet while an answer is worked out: the reminders hold off, and fillers fill the wait.
        pauseNudges();
        set({ thinking: true });
        const waiting = startThinking((hold) => set({ hold }));
        thinking = waiting;
        thinkingSince = Date.now();
        let answer = '';
        try {
          answer = await copilot.send(question, { path: window.location.pathname, title: document.title }, { voice: true });
        } finally {
          // A clip in progress ends first, then a closer ("Ahh, here it is"), so the answer is never cut across.
          await waiting.finish();
          if (thinking === waiting) thinking = null;
          set({ thinking: false });
          resumeNudges();
        }
        if (generation !== run) return JSON.stringify({ say: '' });
        // Passage by passage: each scroll fires as the spoken answer reaches that part.
        for (const step of copilot.takeSteps()) {
          stepTimers.push(setTimeout(() => copilot.go(step.path, { slow: true, agent: true }), SPEECH_LEAD_MS + (step.at / SPEECH_CHARS_PER_S) * 1000));
        }
        return JSON.stringify({ say: answer || 'Please try that again.' });
      });
      call.on(lk.RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== lk.Track.Kind.Audio || generation !== run) return;
        attachMeter('agent', track.mediaStreamTrack);
        const audio = track.attach();
        audio.hidden = true;
        document.body.appendChild(audio);
        audioElements.add(audio);
      });
      call.on(lk.RoomEvent.ParticipantConnected, (participant) => {
        if (participant.isAgent && generation === run) { clearTimeout(timer); clearTimeout(agentTimer); set({ status: 'connected' }); }
      });
      call.on(lk.RoomEvent.ParticipantDisconnected, (participant) => {
        if (!participant.isAgent || generation !== run) return;
        clearTimeout(agentTimer);
        agentTimer = setTimeout(() => {
          if (generation === run && call.state === lk.ConnectionState.Connected && ![...call.remoteParticipants.values()].some((p) => p.isAgent)) {
            close('The voice agent disconnected. You can continue typing.');
          }
        }, 5000);
      });
      call.on(lk.RoomEvent.Reconnecting, () => { if (generation === run) set({ status: 'connecting' }); });
      call.on(lk.RoomEvent.Reconnected, () => {
        if (generation !== run) return;
        if ([...call.remoteParticipants.values()].some((p) => p.isAgent)) set({ status: 'connected' });
        else close('The voice agent disconnected. You can continue typing.');
      });
      call.on(lk.RoomEvent.ActiveSpeakersChanged, (speakers) => {
        if (generation !== run) return;
        if (speakers.length) noteActivity();
        // The visitor talks over a filler: stop it at once.
        // (Not in the first moments: the tail of their own question still reads as speech.)
        if (speakers.some((speaker) => speaker.isLocal) && Date.now() - thinkingSince > 1500) thinking?.cancel();
        const agent = speakers.some((speaker) => speaker.isAgent && !speaker.isLocal);
        const user = speakers.some((speaker) => speaker.isLocal);
        set({ speaking: agent ? 'agent' : user ? 'user' : 'none' });
      });
      call.on(lk.RoomEvent.AudioPlaybackStatusChanged, () => {
        if (generation === run) set({ audioBlocked: !call.canPlaybackAudio });
      });
      call.on(lk.RoomEvent.Disconnected, () => {
        if (generation === run) close('The call disconnected. You can continue typing.');
      });
      timer = setTimeout(() => {
        if (generation === run && state.status === 'connecting') close('The voice agent did not answer. You can continue typing.');
      }, 60_000);
      await call.connect(grant.url, grant.token);
      if (generation !== run) return;
      await call.localParticipant.publishTrack(track, { source: lk.Track.Source.Microphone });
      if ([...call.remoteParticipants.values()].some((participant) => participant.isAgent)) {
        clearTimeout(timer);
        set({ status: 'connected' });
      }
    } catch (error) {
      if (generation !== run) return;
      const name = error instanceof Error ? error.name : '';
      close(name === 'NotAllowedError' || name === 'SecurityError'
        ? 'Microphone access is blocked. Allow it in your browser or continue typing.'
        : 'Voice is unavailable right now. You can continue typing.');
    }
  },
};

// Development only: pretend a call is on, to try the moon and its bubbles from the console.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __voiceSet?: typeof set }).__voiceSet = set;

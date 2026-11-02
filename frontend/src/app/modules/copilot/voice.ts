import { useSyncExternalStore } from 'react';
import { copilot, requestVoiceGrant } from './store';
import type { LocalAudioTrack, Room } from 'livekit-client';

type VoiceState = { status: 'idle' | 'connecting' | 'connected'; error: string; audioBlocked: boolean };
let state: VoiceState = { status: 'idle', error: '', audioBlocked: false };
let room: Room | null = null;
let microphone: LocalAudioTrack | null = null;
let generation = 0;
let pending: AbortController | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let agentTimer: ReturnType<typeof setTimeout> | undefined;
const audioElements = new Set<HTMLMediaElement>();
const listeners = new Set<() => void>();
const set = (patch: Partial<VoiceState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};
export const useVoice = () => useSyncExternalStore(
  (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
  () => state,
  () => state,
);

function close(error = '') {
  generation += 1;
  pending?.abort();
  pending = null;
  clearTimeout(timer);
  clearTimeout(agentTimer);
  microphone?.stop();
  microphone = null;
  const current = room;
  room = null;
  if (current) void current.disconnect();
  for (const audio of audioElements) audio.remove();
  audioElements.clear();
  set({ status: 'idle', error, audioBlocked: false });
}

export const voice = {
  stop: () => close(),
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
    set({ status: 'connecting', error: '' });
    try {
      // Request permission only after the visitor explicitly starts a call.
      const lk = await import('livekit-client');
      const track = await lk.createLocalAudioTrack({ echoCancellation: true, noiseSuppression: true, autoGainControl: true });
      if (generation !== run) { track.stop(); return; }
      microphone = track;
      const grant = await requestVoiceGrant(controller.signal);
      if (generation !== run) return;
      const call = new lk.Room({ adaptiveStream: false, dynacast: false });
      room = call;
      const isAgent = (identity: string) => call.remoteParticipants.get(identity)?.isAgent === true;
      call.registerRpcMethod('copilot.greet', async (data) => {
        if (!isAgent(data.callerIdentity)) throw new Error('Unrecognized voice participant');
        return JSON.stringify({ say: "Hi, I'm the Design Baker assistant. Ask me about Pujan's work, writing, or research." });
      });
      call.registerRpcMethod('copilot.turn', async (data) => {
        if (!isAgent(data.callerIdentity)) throw new Error('Unrecognized voice participant');
        let question = '';
        try { question = String(JSON.parse(data.payload || '{}').text ?? '').slice(0, 2000); } catch { /* invalid speech payload */ }
        if (!question || generation !== run) return JSON.stringify({ say: 'Could you say that again?' });
        const answer = await copilot.send(question, { path: window.location.pathname, title: document.title });
        return JSON.stringify({ say: answer || 'Please try that again.' });
      });
      call.on(lk.RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== lk.Track.Kind.Audio || generation !== run) return;
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

/**
 * The voice call's redial (frontend/src/app/modules/copilot/voice.ts, TASK-DB-0137): a call that had reached an agent and
 * then drops without the visitor hanging up is redialled once, silently. Runs the real voice.ts bundled with esbuild (the
 * one inside vite), against a fake LiveKit room, so no microphone, browser or voice service is needed.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('..', import.meta.url);
const frontend = new URL('./frontend/', root).pathname;
const require = createRequire(path.join(frontend, 'package.json'));
const viteDir = path.dirname(require.resolve('vite/package.json'));
const esbuild = createRequire(path.join(viteDir, 'package.json'))('esbuild');

// Fakes: only what voice.ts touches. Fake rooms and grant requests are kept on globalThis so the test can drive them.
const modules = {
  react: 'export const useSyncExternalStore = (subscribe, get) => get();',
  'livekit-client': `
    globalThis.__rooms ??= [];
    export const ConnectionState = { Connected: 'connected' };
    export const RoomEvent = { ActiveSpeakersChanged: 'as', AudioPlaybackStatusChanged: 'ap', Disconnected: 'dis', ParticipantConnected: 'pc', ParticipantDisconnected: 'pd', Reconnected: 're', Reconnecting: 'rc', TrackSubscribed: 'ts' };
    export const Track = { Kind: { Audio: 'audio' }, Source: { Microphone: 'mic' } };
    export const createLocalAudioTrack = async () => ({ stop() {}, mute: async () => {}, unmute: async () => {}, mediaStreamTrack: {} });
    export class Room {
      handlers = {}; remoteParticipants = new Map(); state = 'disconnected'; canPlaybackAudio = true; closed = false;
      localParticipant = { performRpc: async () => '', publishTrack: async () => {} };
      constructor() { globalThis.__rooms.push(this); }
      on(event, fn) { this.handlers[event] = fn; return this; }
      emit(event, ...args) { this.handlers[event]?.(...args); }
      registerRpcMethod() {}
      async connect() {
        this.state = 'connected';
        if (globalThis.__agentJoins !== false) {
          const agent = { isAgent: true };
          this.remoteParticipants.set('agent', agent);
          queueMicrotask(() => this.emit('pc', agent));
        }
      }
      async disconnect() { this.closed = true; this.state = 'disconnected'; }
    }`,
  './store': `
    globalThis.__grants ??= 0;
    export const requestVoiceGrant = async () => { globalThis.__grants += 1; return { url: 'wss://x', token: 't' }; };
    export const typedReply = { hook: null };
    export const copilot = new Proxy({}, { get: () => () => undefined });`,
  './holdAudio': ['noteActivity', 'pauseNudges', 'playSpokenReply', 'preloadHold', 'isNudge', 'resumeNudges', 'setCallOn', 'startHold', 'startNudges', 'startThinking', 'stopHold', 'stopNudges', 'withoutEcho']
    .map((name) => `export const ${name} = () => undefined;`).join('\n'),
  './skyOrigin': 'export const pickOrigin = () => null;',
};
const virtual = {
  name: 'virtual',
  setup(build) {
    build.onResolve({ filter: /^(react|livekit-client|\.\/store|\.\/holdAudio|\.\/skyOrigin)$/ }, (args) => ({ path: args.path, namespace: 'fake' }));
    build.onLoad({ filter: /.*/, namespace: 'fake' }, (args) => ({ contents: modules[args.path], loader: 'js', resolveDir: frontend }));
  },
};
const built = await esbuild.build({
  entryPoints: [path.join(frontend, 'src/app/modules/copilot/voice.ts')],
  bundle: true, write: false, format: 'esm', platform: 'node', plugins: [virtual],
  define: { 'import.meta.env.DEV': 'false' }, logLevel: 'error',
});
const dir = await mkdtemp(path.join(tmpdir(), 'voice-redial-'));
const file = path.join(dir, 'voice.mjs');
await writeFile(file, built.outputFiles[0].text);

globalThis.__rooms = [];
globalThis.__grants = 0;
globalThis.__agentJoins = true;
globalThis.window = {};
globalThis.AudioContext = class { resume() { return Promise.resolve(); } close() { return Promise.resolve(); } };
const { voice, useVoice } = await import(pathToFileURL(file).href);

const tick = () => new Promise((resolve) => setTimeout(resolve, 20));
const rooms = () => globalThis.__rooms;
const grants = () => globalThis.__grants;
const status = () => useVoice().status;
const error = () => useVoice().error;
const reset = () => { voice.stop(); globalThis.__rooms.length = 0; globalThis.__grants = 0; globalThis.__agentJoins = true; };

// 1. A call that reached the agent and drops is redialled once, silently.
reset();
await voice.start(); await tick();
assert.equal(status(), 'connected');
assert.equal(rooms().length, 1);
rooms()[0].emit('dis');
await tick();
assert.equal(rooms().length, 2, 'a second room is dialled');
assert.equal(grants(), 2, 'with a fresh grant');
assert.equal(status(), 'connected', 'and the call is back');
assert.equal(error(), '', 'with no message shown');
assert.equal(rooms()[0].closed, true, 'the dead room is closed');

// 2. A second drop ends the call with the message: one redial only.
rooms()[1].emit('dis');
await tick();
assert.equal(rooms().length, 2, 'no third room');
assert.equal(status(), 'idle');
assert.match(error(), /call disconnected/i);

// 3. Hanging up, then starting again, gives the call its redial back.
voice.stop();
await voice.start(); await tick();
rooms().at(-1).emit('dis'); await tick();
assert.equal(status(), 'connected', 'a new call can redial again');
const before = rooms().length;
voice.stop(); await tick();
assert.equal(status(), 'idle');
assert.equal(rooms().length, before, 'hanging up never redials');
assert.equal(error(), '');

// 4. A call that never reached an agent does not redial: it ends as before.
reset();
globalThis.__agentJoins = false;
await voice.start(); await tick();
assert.equal(status(), 'connecting');
rooms()[0].emit('dis'); await tick();
assert.equal(rooms().length, 1, 'no redial without an agent ever joining');
assert.equal(status(), 'idle');
assert.match(error(), /call disconnected/i);

// 5. The agent leaving the room (not the whole call) redials once too, after the short grace.
reset();
await voice.start(); await tick();
const room = rooms()[0];
room.remoteParticipants.delete('agent');
room.emit('pd', { isAgent: true });
await new Promise((resolve) => setTimeout(resolve, 5200));
assert.equal(rooms().length, 2, 'an agent that leaves is redialled');
assert.equal(status(), 'connected');
voice.stop();

console.log('voice redial: drop redials once, second drop ends it, hang-up resets, no agent means no redial');
process.exit(0);

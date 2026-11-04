/**
 * A LiveKit access token for one voice call, minted here so the call is answered by design-bakery's own voice agent
 * (voice-agent/agent.py, registered as VOICE_AGENT_NAME) and not the copilot lab's. The token's room configuration asks
 * for that agent by name; LiveKit then dispatches only it, never the lab's unnamed agent (livekit-server
 * pkg/rtc/room.go, createAgentDispatchesFromRoomAgent). Off unless VOICE_LIVEKIT_KEY and VOICE_LIVEKIT_SECRET are set:
 * route.ts then asks the lab's /api/voice/token as before.
 */
import { createHmac, randomUUID } from 'node:crypto';

export type VoiceGrant = { url: string; token: string; room: string };

export function voiceTokenConfigured(): boolean {
  return Boolean(process.env.VOICE_LIVEKIT_KEY?.trim() && process.env.VOICE_LIVEKIT_SECRET?.trim());
}

/** The token for a caller in a new room. `stack` is the voice stack (voice-agent/stacks.json) the agent loads. */
export function mintVoiceToken(stack = process.env.VOICE_STACK?.trim() || 'english-fast'): VoiceGrant {
  const key = process.env.VOICE_LIVEKIT_KEY?.trim() ?? '';
  const secret = process.env.VOICE_LIVEKIT_SECRET?.trim() ?? '';
  const agentName = process.env.VOICE_AGENT_NAME?.trim() || 'design-bakery-voice';
  const url = process.env.VOICE_LIVEKIT_PUBLIC_URL?.trim() || 'wss://copilot.design-bakery.com';
  const room = `db-call-${randomUUID().slice(0, 8)}`;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
    iss: key,
    sub: `caller-${randomUUID().slice(0, 8)}`,
    nbf: now - 5,
    exp: now + 3600,
    attributes: { 'copilot.stack': stack, 'copilot.language': '' },
    video: { room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true, canUpdateOwnMetadata: true },
    roomConfig: { agents: [{ agentName }] },
  })}`;
  return { url, room, token: `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}` };
}

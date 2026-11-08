import { LANE_NAMES, type Channel, type Lane } from './types.js';

/** The lane for a channel: COPILOT_LANE_VOICE / COPILOT_LANE_CHAT, else COPILOT_LANE, else hybrid (the chain as it was before lanes). */
export function laneNameFor(channel: Channel, env: Record<string, string | undefined> = process.env): (typeof LANE_NAMES)[number] {
  const wanted = env[channel === 'voice' ? 'COPILOT_LANE_VOICE' : 'COPILOT_LANE_CHAT'] ?? env.COPILOT_LANE ?? 'hybrid';
  return (LANE_NAMES as readonly string[]).includes(wanted) ? (wanted as (typeof LANE_NAMES)[number]) : 'hybrid';
}

const loaded = new Map<string, Lane>();

/** Loads one lane and nothing else: the others stay on disk. */
export async function loadLane(name: (typeof LANE_NAMES)[number]): Promise<Lane> {
  const cached = loaded.get(name);
  if (cached) return cached;
  const mod = (await import(`./${name}/index.js`)) as { lane: Lane };
  loaded.set(name, mod.lane);
  return mod.lane;
}

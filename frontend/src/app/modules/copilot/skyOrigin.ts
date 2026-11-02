/**
 * Where the call seems to come from. Each call picks a star, planet or cluster (never the one the last
 * call used in this session) and a phrase, so the orb reads "Listening from Betelgeuse", "I'm just Pujan
 * from Titan" and the like, and a different one every time.
 */
const PLACES = [
  'Alpha Centauri',
  'Betelgeuse',
  'Sirius',
  'Vega',
  'Rigel',
  'Antares',
  'Arcturus',
  'Aldebaran',
  'Altair',
  'Fomalhaut',
  'Canopus',
  'Deneb',
  'Polaris',
  'Proxima Centauri',
  'Tau Ceti',
  "Barnard's Star",
  'TRAPPIST-1',
  'the Orion Nebula',
  'Andromeda',
  'Sagittarius A*',
  'Omega Centauri',
  'the Pleiades',
  'the Crab Nebula',
  'Kepler-452b',
  'Proxima b',
  'Titan',
  'Europa',
] as const;

const KEY = 'db-voice-star-v1';

/** The two labels the orb shows for this call: while I listen and while I speak. */
export type SkyOrigin = { place: string; listening: string; speaking: string };

/** How a call announces itself. Each is picked at random, with the place filled in. */
const PHRASES: Array<(place: string) => { listening: string; speaking: string }> = [
  (place) => ({ listening: `Listening from ${place}`, speaking: `Speaking from ${place}` }),
  (place) => ({ listening: `Hearing you from ${place}`, speaking: `Transmitting from ${place}` }),
  (place) => ({ listening: `Tuned in from ${place}`, speaking: `Broadcasting from ${place}` }),
  (place) => ({ listening: `I'm just Pujan from ${place}`, speaking: `I'm just Pujan from ${place}` }),
];

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

export function pickOrigin(): SkyOrigin {
  let last = '';
  try {
    last = sessionStorage.getItem(KEY) ?? '';
  } catch {
    /* storage is optional */
  }
  const place = pick(PLACES.filter((name) => name !== last));
  try {
    sessionStorage.setItem(KEY, place);
  } catch {
    /* storage is optional */
  }
  return { place, ...pick(PHRASES)(place) };
}

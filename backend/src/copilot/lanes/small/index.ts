import type { Lane } from '../types.js';
import { adjustBody } from './fixes/body.js';
import { manifest } from './manifest.js';

export const lane: Lane = { manifest, adjustBody };

import net from 'node:net';

const DEFAULT_BASE = 5300;
const MAX_TRIES = 32;
const PROBE_TIMEOUT_MS = 350;

/** Hosts Vite may use (dual-stack / IPv6-first on macOS). */
const PROBE_HOSTS = ['127.0.0.1', '::1', 'localhost'];

/**
 * True when something is already accepting TCP on this port (connect succeeds).
 * @param {number} port
 * @param {string} host
 * @returns {Promise<boolean>}
 */
function isPortBusy(port, host) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (busy) => {
      clearTimeout(timer);
      socket.removeAllListeners();
      socket.destroy();
      resolve(busy);
    };
    const timer = setTimeout(() => done(false), PROBE_TIMEOUT_MS);
    socket.once('connect', () => done(true));
    socket.once('error', (err) => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        done(false);
        return;
      }
      // ECONNRESET, etc. — something touched the port
      done(true);
    });
  });
}

/**
 * True if we cannot bind (port taken on this host).
 * @param {number} port
 * @param {string} host
 * @returns {Promise<boolean>}
 */
function cannotBind(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, host);
  });
}

/**
 * @param {number} port
 * @returns {Promise<boolean>}
 */
async function isPortAvailable(port) {
  for (const host of PROBE_HOSTS) {
    if (await isPortBusy(port, host)) return false;
  }
  // Match Vite: try dual-stack bind (no host = :: / 0.0.0.0 depending on OS)
  if (await cannotBind(port, '::')) return false;
  if (await cannotBind(port, '0.0.0.0')) return false;
  return true;
}

/**
 * First free port in [base, base + maxTries).
 * @param {number} [base]
 * @param {number} [maxTries]
 * @returns {Promise<number>}
 */
export async function resolveDevPort(base = DEFAULT_BASE, maxTries = MAX_TRIES) {
  for (let offset = 0; offset < maxTries; offset++) {
    const port = base + offset;
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No free dev port in range ${base}–${base + maxTries - 1}`);
}

export function readDevPortBase() {
  const raw = process.env.VITE_DEV_PORT_BASE ?? process.env.DEV_PORT_BASE;
  const n = raw ? Number.parseInt(String(raw), 10) : DEFAULT_BASE;
  return Number.isFinite(n) && n > 0 && n < 65536 ? n : DEFAULT_BASE;
}

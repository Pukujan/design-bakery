/**
 * Bot check for the copilot. The browser solves Cloudflare Turnstile once; the server
 * verifies it and returns a signed visitor pass (HS256, two hours) that every copilot
 * call carries. Without TURNSTILE_SECRET_KEY (local dev) the pass is issued without a
 * challenge. COPILOT_PASS_SECRET signs the pass.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';

const PASS_TTL = '2h';

// Without COPILOT_PASS_SECRET each process signs with its own random key, so passes
// lapse on restart; visitors just get a new one.
const fallbackSecret = randomBytes(32);
const secret = () => {
  const value = process.env.COPILOT_PASS_SECRET?.trim();
  return value ? new TextEncoder().encode(value) : fallbackSecret;
};

export const turnstileSiteKey = () => process.env.TURNSTILE_SITE_KEY?.trim() || null;

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const key = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!key) return true;
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: key, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.json()) as { success?: boolean };
    return body.success === true;
  } catch {
    return false;
  }
}

/** A pass for a visitor who solved the challenge, or null. */
export async function issuePass(turnstileToken: string, ip: string, visitorProof?: string, owner = false): Promise<{ pass: string; session: string; visitor: string } | null> {
  // `owner`: the address is on the owner's exemption list (COPILOT_RATE_EXEMPT_IPS), so the owner's network is never challenged.
  if (!owner && !(await verifyTurnstile(turnstileToken, ip))) return null;
  let session: string | undefined;
  if (visitorProof) {
    try {
      const { payload } = await jwtVerify(visitorProof, secret(), { algorithms: ['HS256'] });
      if (payload.kind === 'copilot-visitor' && typeof payload.sub === 'string') session = payload.sub;
    } catch { /* An expired or invalid proof gets a new visitor identity. */ }
  }
  session ??= randomUUID();
  const visitor = await new SignJWT({ kind: 'copilot-visitor' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret());
  const pass = await new SignJWT({ kind: 'copilot' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session)
    .setIssuedAt()
    .setExpirationTime(PASS_TTL)
    .sign(secret());
  return { pass, session, visitor };
}

/** The pass's session id, or null when it is missing, forged or expired. */
export async function checkPass(pass: string | undefined): Promise<string | null> {
  if (!pass) return null;
  try {
    const { payload } = await jwtVerify(pass, secret(), { algorithms: ['HS256'] });
    return payload.kind === 'copilot' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export function clientIp(headers: Record<string, string | string[] | undefined>, fallback = ''): string {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.split(',')[0]?.trim();
  return first(headers['cf-connecting-ip']) || first(headers['x-forwarded-for']) || fallback;
}

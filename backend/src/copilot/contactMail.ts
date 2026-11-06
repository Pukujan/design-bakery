/**
 * A visitor's message to Pujan, emailed through the Apps Script web app in his Google account
 * (deploy/contact-mail/). The script holds the only mail permission; this side holds its URL and token.
 */
export type ContactMessage = { name: string; email: string; message: string; page?: string };
export type ContactResult = { ok: true } | { ok: false; reason: 'not_set_up' | 'daily_limit' | 'failed' };

/** At most this many a day from one API process, under Google's own 100. */
const DAILY_LIMIT = 20;
let day = '';
let sent = 0;

export function contactMailConfigured(): boolean {
  return Boolean(process.env.CONTACT_MAIL_URL?.trim() && process.env.CONTACT_MAIL_TOKEN?.trim());
}

export async function sendContactMessage(msg: ContactMessage, fetcher: typeof fetch = fetch): Promise<ContactResult> {
  const url = process.env.CONTACT_MAIL_URL?.trim();
  const token = process.env.CONTACT_MAIL_TOKEN?.trim();
  if (!url || !token) return { ok: false, reason: 'not_set_up' };
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    sent = 0;
  }
  if (sent >= DAILY_LIMIT) return { ok: false, reason: 'daily_limit' };
  try {
    // Apps Script answers a POST with a redirect to the result; fetch follows it.
    const res = await fetcher(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, ...msg }),
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => null)) as { ok?: unknown } | null;
    if (!res.ok || data?.ok !== true) return { ok: false, reason: 'failed' };
    sent += 1;
    return { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

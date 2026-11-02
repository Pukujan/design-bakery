/**
 * Cloudflare Turnstile, loaded only when the first question is asked. The widget runs
 * in "interaction-only" mode: visitors who look human never see it, others get a small
 * challenge in the corner.
 */
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

let loading: Promise<TurnstileApi> | null = null;

function load(): Promise<TurnstileApi> {
  const existing = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
  if (existing) return Promise.resolve(existing);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolve((window as unknown as { turnstile: TurnstileApi }).turnstile);
    script.onerror = () => {
      loading = null;
      reject(new Error('turnstile failed to load'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export async function getTurnstileToken(siteKey: string, signal?: AbortSignal): Promise<string> {
  const turnstile = await Promise.race([
    load(),
    new Promise<never>((_, reject) => {
      const timeout = AbortSignal.timeout(15_000);
      const cancel = signal ? AbortSignal.any([signal, timeout]) : timeout;
      cancel.addEventListener('abort', () => reject(cancel.reason), { once: true });
    }),
  ]);
  if (signal?.aborted) throw signal.reason;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483000';
  document.body.appendChild(host);
  return new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => finish(() => reject(new Error('turnstile timed out'))), 60_000);
    let widget = '';
    const onAbort = () => finish(() => reject(signal?.reason));
    const finish = (settle: () => void) => {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      try {
        if (widget) turnstile.remove(widget);
      } catch {
        /* already gone */
      }
      host.remove();
      settle();
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    try { widget = turnstile.render(host, {
      sitekey: siteKey,
      appearance: 'interaction-only',
      callback: (token: string) => finish(() => resolve(token)),
      'error-callback': () => finish(() => reject(new Error('turnstile error'))),
    }); } catch (error) { finish(() => reject(error)); }
  });
}

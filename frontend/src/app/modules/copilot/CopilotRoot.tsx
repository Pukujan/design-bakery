import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { copilot, warmVoice } from './store';

// The voice agent sleeps after 10 idle minutes and takes about 10 s to wake, so it is woken as soon as the site loads
// and kept awake while the tab is in front (warmVoice sends at most one wake every 4 minutes).
const KEEP_AWAKE_MS = 5 * 60_000;

const CopilotDock = lazy(() => import('./CopilotDock'));

/**
 * Mounted once inside the router. It gives the store the router's navigate, so the
 * copilot can change page without a reload, and loads the dock after the page is idle.
 */
export function CopilotRoot() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    copilot.setNavigate((path) => navigate(path));
    return () => copilot.setNavigate(null);
  }, [navigate]);

  const admin = pathname.startsWith('/admin');
  useEffect(() => {
    if (admin) return;
    const wake = () => { if (document.visibilityState === 'visible') warmVoice(); };
    wake();
    const timer = window.setInterval(wake, KEEP_AWAKE_MS);
    document.addEventListener('visibilitychange', wake);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [admin]);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1200));
    const handle = idle(() => setReady(true));
    return () => {
      if (window.cancelIdleCallback && typeof handle === 'number') window.cancelIdleCallback(handle);
    };
  }, []);

  if (!ready || admin) return null;
  return (
    <Suspense fallback={null}>
      <CopilotDock />
    </Suspense>
  );
}

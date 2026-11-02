import { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { copilot } from './store';

const CopilotDock = lazy(() => import('./CopilotDock'));
const VoicePlanet = lazy(() => import('./VoicePlanet'));

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

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1200));
    const handle = idle(() => setReady(true));
    return () => {
      if (window.cancelIdleCallback && typeof handle === 'number') window.cancelIdleCallback(handle);
    };
  }, []);

  if (!ready || pathname.startsWith('/admin')) return null;
  return (
    <Suspense fallback={null}>
      <CopilotDock />
      <VoicePlanet />
    </Suspense>
  );
}

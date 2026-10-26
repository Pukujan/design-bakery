import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useDarkMode } from '../hooks/useDarkMode';

/**
 * The starting theme is resolved before first paint by the inline script in
 * `frontend/index.html` (a stored choice wins, otherwise the OS preference).
 * Until the visitor picks a theme, this keeps following the OS; a click records
 * an explicit choice that then wins.
 */
export function ThemeSwitcher() {
  const isDark = useDarkMode();
  const [followsSystem, setFollowsSystem] = useState(() => !hasStoredPreference());

  useEffect(() => {
    if (!followsSystem) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => applyTheme(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, [followsSystem]);

  const toggleDarkMode = () => {
    const next = !document.documentElement.classList.contains('dark');
    applyTheme(next);
    storePreference(next ? 'dark' : 'light');
    setFollowsSystem(false);
  };

  return (
    <div className="">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleDarkMode}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        className="rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 dark:hover:bg-yellow-600 transition-all w-14 h-14"
      >
        {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </Button>

    </div>
  );
}

function hasStoredPreference(): boolean {
  try {
    const stored = localStorage.getItem('mode');
    return stored === 'light' || stored === 'dark';
  } catch {
    return false;
  }
}

function storePreference(mode: 'light' | 'dark'): void {
  try {
    localStorage.setItem('mode', mode);
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
}

function applyTheme(isDark: boolean): void {
  document.documentElement.classList.toggle('dark', isDark);
}

import { useSearchParams } from 'react-router-dom';

export type ReadMode = 'quick' | 'full';

/** Reading depth kept in the URL (`?read=quick`) so a quick-read link can be shared.
 *  Default is the full paper. */
export function useReadMode(): [ReadMode, (mode: ReadMode) => void] {
  const [params, setParams] = useSearchParams();
  const mode: ReadMode = params.get('read') === 'quick' ? 'quick' : 'full';
  const setMode = (next: ReadMode) => {
    const updated = new URLSearchParams(params);
    if (next === 'quick') updated.set('read', 'quick');
    else updated.delete('read');
    setParams(updated, { replace: true, preventScrollReset: true });
  };
  return [mode, setMode];
}

/** "Quick read / Full read" switch. Quick read hides `details.deep-dive` blocks
 *  and the appendices; it only appears when the paper has deep-dive blocks. */
export function ReadModeToggle({ mode, onChange }: { mode: ReadMode; onChange: (mode: ReadMode) => void }) {
  return (
    <div className="rp-readmode" role="group" aria-label="Reading depth">
      {(['quick', 'full'] as const).map((value) => (
        <button
          key={value}
          type="button"
          className="rp-readmode-option"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
        >
          {value === 'quick' ? 'Quick read' : 'Full read'}
        </button>
      ))}
    </div>
  );
}

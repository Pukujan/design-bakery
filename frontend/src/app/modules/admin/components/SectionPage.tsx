/**
 * Wraps any array-based content section with load / save / status UI.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../../../components/ui/button';
import { SaveIcon, RefreshCw } from 'lucide-react';

interface SectionPageProps<T extends object> {
  title: string;
  load: () => Promise<T[]>;
  save: (items: T[]) => Promise<void>;
  reloadKey?: string;
  children: (items: T[], onChange: (items: T[]) => void) => ReactNode;
}

export function SectionPage<T extends object>({
  title,
  load,
  save,
  reloadKey = '',
  children,
}: SectionPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  async function fetch() {
    setLoading(true);
    setStatus('');
    try {
      setItems(await load());
    } catch (e) {
      setStatus('Failed to load. Check Firebase config.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetch();
  }, [reloadKey]);

  async function handleSave() {
    setSaving(true);
    setStatus('');
    try {
      await save(items);
      setStatus('Saved ✓');
    } catch {
      setStatus('Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-3">
          {status && <span className="text-sm text-gray-500">{status}</span>}
          <Button variant="outline" size="icon" onClick={fetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            <SaveIcon className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        children(items, setItems)
      )}
    </div>
  );
}

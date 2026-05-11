import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../../../components/ui/button';
import { SaveIcon, RefreshCw } from 'lucide-react';

interface ObjectSectionPageProps<T extends object> {
  title: string;
  load: () => Promise<T>;
  save: (item: T) => Promise<void>;
  children: (item: T, onChange: (item: T) => void) => ReactNode;
}

export function ObjectSectionPage<T extends object>({
  title,
  load,
  save,
  children,
}: ObjectSectionPageProps<T>) {
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  async function fetch() {
    setLoading(true);
    setStatus('');
    try {
      setItem(await load());
    } catch {
      setStatus('Failed to load. Check Firebase config.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetch();
  }, []);

  async function handleSave() {
    if (!item) return;
    setSaving(true);
    setStatus('');
    try {
      await save(item);
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
          <Button onClick={handleSave} disabled={saving || loading || !item}>
            <SaveIcon className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {loading || !item ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        children(item, setItem)
      )}
    </div>
  );
}

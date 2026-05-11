import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';

interface JsonObjectEditorProps<T extends object> {
  item: T;
  onChange: (item: T) => void;
}

export function JsonObjectEditor<T extends object>({ item, onChange }: JsonObjectEditorProps<T>) {
  const [draft, setDraft] = useState(JSON.stringify(item, null, 2));
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(JSON.stringify(item, null, 2));
  }, [item]);

  function applyDraft() {
    try {
      const parsed = JSON.parse(draft) as T;
      onChange(parsed);
      setError('');
    } catch {
      setError('Invalid JSON');
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
      <Textarea
        className="font-mono text-xs"
        rows={26}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError('');
        }}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <Button size="sm" className="mt-2" onClick={applyDraft}>
        Apply
      </Button>
    </div>
  );
}

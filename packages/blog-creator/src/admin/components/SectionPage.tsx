import { useEffect, useState, type ReactNode } from 'react';

type SectionPageProps<T> = {
  title: string;
  load: () => Promise<T>;
  save: (items: T) => Promise<void>;
  children: (items: T, onChange: (items: T) => void) => ReactNode;
};

export function SectionPage<T>({ title, load, save, children }: SectionPageProps<T>) {
  const [items, setItems] = useState<T | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    load().then(setItems).catch((e) => setStatus(e instanceof Error ? e.message : 'Load failed'));
  }, [load]);

  const onSave = async () => {
    if (!items) return;
    setStatus('Saving…');
    try {
      await save(items);
      setStatus('Saved');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Save failed');
    }
  };

  if (!items) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">{status ?? 'Loading…'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-black">{title}</h1>
        <button
          type="button"
          onClick={onSave}
          className="rounded-lg border-2 border-black bg-black px-4 py-2 text-sm font-bold text-white"
        >
          Save
        </button>
      </div>
      {status ? <p className="mb-4 text-sm font-medium">{status}</p> : null}
      {children(items, setItems)}
    </div>
  );
}

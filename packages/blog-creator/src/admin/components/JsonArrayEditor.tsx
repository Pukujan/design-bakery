type JsonArrayEditorProps<T extends Record<string, unknown>> = {
  items: T[];
  onChange: (items: T[]) => void;
  template: T;
  getLabel: (item: T) => string;
};

export function JsonArrayEditor<T extends Record<string, unknown>>({
  items,
  onChange,
  template,
  getLabel,
}: JsonArrayEditorProps<T>) {
  const update = (index: number, patch: Partial<T>) => {
    const next = items.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border-2 border-black bg-white p-4 dark:bg-gray-900"
        >
          <p className="mb-3 font-bold">{getLabel(item)}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {Object.keys(template).map((key) => (
              <label key={key} className="block text-xs font-bold uppercase">
                {key}
                <input
                  className="mt-1 w-full rounded border-2 border-black px-2 py-1 text-sm"
                  value={String(item[key] ?? '')}
                  onChange={(e) => update(index, { [key]: e.target.value } as Partial<T>)}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-xs font-bold text-red-600"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="rounded-lg border-2 border-dashed border-black px-4 py-2 text-sm font-bold"
        onClick={() => onChange([...items, { ...template }])}
      >
        Add row
      </button>
    </div>
  );
}

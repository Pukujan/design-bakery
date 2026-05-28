import { useEffect, useState } from 'react';

type Props = {
  url: string;
  label: string;
  size?: 'compact' | 'large';
};

export function ImagePreview({ url, label, size = 'compact' }: Props) {
  const trimmed = url.trim();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [trimmed]);

  if (!trimmed) return null;

  const maxH = size === 'large' ? 'max-h-52' : 'max-h-36';
  const isData = trimmed.startsWith('data:');

  return (
    <div className="mt-2 min-w-0 space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        {!isData && !failed && (
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Open
          </a>
        )}
      </div>
      {failed ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Preview could not load.
          {isData ? ' (Data URL — use Download or Save to gallery.)' : ''}
        </p>
      ) : (
        <img
          src={trimmed}
          alt={label}
          className={`w-full rounded-md border border-gray-200 object-cover dark:border-gray-700 ${maxH}`}
          onError={() => setFailed(true)}
          onLoad={() => setFailed(false)}
        />
      )}
    </div>
  );
}

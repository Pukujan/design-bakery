import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

type Props = {
  url: string;
  label: string;
  /** Larger preview after generate (publish kit panel). */
  size?: 'compact' | 'large';
};

export function PublishImagePreview({ url, label, size = 'compact' }: Props) {
  const trimmed = url.trim();
  const [failed, setFailed] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    setFailed(false);
    setHint(null);
    if (!trimmed || trimmed.startsWith('data:')) return;

    let cancelled = false;
    void fetch(trimmed, { method: 'HEAD' })
      .then(async (res) => {
        if (cancelled || res.ok) return;
        if (res.url.includes('.supabase.co/storage/')) {
          setHint(
            'Supabase Storage returned an error — open Supabase → Storage → design-bakery → enable Public bucket, then Save again.',
          );
        }
      })
      .catch(() => {
        /* img onError handles display */
      });

    return () => {
      cancelled = true;
    };
  }, [trimmed]);

  if (!trimmed) return null;

  const maxH = size === 'large' ? 'max-h-52' : 'max-h-36';
  const isData = trimmed.startsWith('data:');

  return (
    <div className="mt-2 min-w-0 space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {!isData && !failed && (
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Open
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      {failed ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {hint ?? 'Preview could not load. Check the URL field or Storage permissions.'}
          {isData ? ' (Local data URL — save post after generate.)' : ''}
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

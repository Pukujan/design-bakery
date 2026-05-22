import { ArrowRight } from 'lucide-react';
import type { SeoFieldChange } from './seoChanges';

type SeoChangesSummaryProps = {
  title: string;
  subtitle?: string;
  changes: SeoFieldChange[];
};

const ACTION_LABEL: Record<SeoFieldChange['action'], string> = {
  added: 'Added',
  updated: 'Updated',
  removed: 'Removed',
  unchanged: 'Unchanged',
};

const ACTION_STYLE: Record<SeoFieldChange['action'], string> = {
  added: 'bg-green-600 text-white',
  updated: 'bg-indigo-600 text-white',
  removed: 'bg-amber-600 text-white',
  unchanged: 'bg-gray-500 text-white',
};

export function SeoChangesSummary({ title, subtitle, changes }: SeoChangesSummaryProps) {
  if (changes.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border-3 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-gray-900">
      <h3 className="text-sm font-black uppercase tracking-wide text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
      )}

      <ul className="mt-4 grid gap-4">
        {changes.map((c) => (
          <li
            key={c.field}
            className="rounded-lg border-2 border-black/15 bg-gray-50 p-3 dark:border-white/10 dark:bg-gray-950/60"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-bold text-gray-900 dark:text-gray-100">{c.label}</span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${ACTION_STYLE[c.action]}`}
              >
                {ACTION_LABEL[c.action]}
              </span>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-start">
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                  Before
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words font-medium text-gray-800 dark:text-gray-200">
                  {c.before}
                </p>
              </div>
              <ArrowRight
                className="mx-auto hidden h-4 w-4 shrink-0 text-gray-400 sm:block sm:mt-6"
                aria-hidden
              />
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                  After
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words font-medium text-gray-900 dark:text-gray-100">
                  {c.after}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

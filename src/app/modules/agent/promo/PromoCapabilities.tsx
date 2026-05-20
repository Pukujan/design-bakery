import { MessageSquare, RefreshCw, Sparkles, XCircle } from 'lucide-react';

/** Roadmap vs what ships today — sets expectations on Promo panel. */
export function PromoCapabilities() {
  const rows = [
    {
      feature: 'Generate LinkedIn draft',
      status: 'live' as const,
      note: 'One-shot AI write from your blog markdown',
    },
    {
      feature: 'Regenerate',
      status: 'live' as const,
      note: 'New draft with same or changed tone / instructions',
    },
    {
      feature: 'Refine via extra instructions',
      status: 'live' as const,
      note: 'Text box before generate — not a back-and-forth chat yet',
    },
    {
      feature: 'Chatbot / multi-turn edits',
      status: 'planned' as const,
      note: 'Future: “make it shorter”, “add emoji”, etc. without full regenerate',
    },
    {
      feature: 'Auto-post to LinkedIn',
      status: 'no' as const,
      note: 'Copy + paste only (by design)',
    },
    {
      feature: 'Save drafts to Firestore',
      status: 'planned' as const,
      note: 'Future: history per post',
    },
  ];

  return (
    <div className="mb-4 overflow-hidden rounded-lg border-2 border-black text-xs">
      <div className="bg-gray-900 px-3 py-2 font-bold text-white">Promo agent — what exists today</div>
      <table className="w-full bg-white dark:bg-gray-900">
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.feature}
              className="border-t border-gray-200 dark:border-gray-700"
            >
              <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 w-[40%]">
                {row.feature}
              </td>
              <td className="px-2 py-2">
                {row.status === 'live' && (
                  <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 font-bold">
                    <Sparkles className="h-3 w-3" /> Live
                  </span>
                )}
                {row.status === 'planned' && (
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                    <MessageSquare className="h-3 w-3" /> Planned
                  </span>
                )}
                {row.status === 'no' && (
                  <span className="inline-flex items-center gap-1 text-gray-500 font-bold">
                    <XCircle className="h-3 w-3" /> No
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <RefreshCw className="inline h-3 w-3 mr-1" />
        Regenerate = same as Generate, but after you already have a draft.
      </p>
    </div>
  );
}

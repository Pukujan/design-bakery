import { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import {
  notifyPortfolioContentPushed,
  pushAllPortfolioDefaultsToCms,
  pushPortfolioDefaultsToCms,
} from '../../../lib/adminContentService';
import { isSupabaseContentEnabled } from '../../../lib/contentApi';
import { useAdminPortfolio } from '../AdminPortfolioContext';
import { getPortfolioConfig } from '../../../portfolios/registry';

type PushScope = 'current' | 'all';

export function AdminPushDefaults() {
  const portfolioId = useAdminPortfolio();
  const portfolioLabel = getPortfolioConfig(portfolioId).label;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [confirmScope, setConfirmScope] = useState<PushScope | null>(null);

  async function runPush(scope: PushScope) {
    setBusy(true);
    setStatus('');
    if (!isSupabaseContentEnabled()) {
      setStatus('CMS API not configured. Set VITE_BLOG_API_URL in frontend/.env and run pnpm run dev:stack.');
      setBusy(false);
      setConfirmScope(null);
      return;
    }
    try {
      if (scope === 'all') {
        const ids = await pushAllPortfolioDefaultsToCms();
        notifyPortfolioContentPushed();
        setStatus(`Updated ${ids.length} portfolios from repo JSON.`);
      } else {
        await pushPortfolioDefaultsToCms(portfolioId);
        notifyPortfolioContentPushed();
        setStatus(`${portfolioLabel} updated from repo JSON.`);
      }
    } catch (error) {
      console.error('Push repo defaults failed:', error);
      const detail = error instanceof Error ? error.message : String(error);
      setStatus(`Push failed: ${detail}`);
    } finally {
      setBusy(false);
      setConfirmScope(null);
    }
  }

  const confirmTitle =
    confirmScope === 'all'
      ? 'Push repo defaults for all portfolios?'
      : `Push repo defaults for ${portfolioLabel}?`;

  const confirmDescription =
    confirmScope === 'all'
      ? 'This overwrites Supabase CMS data for all portfolios with the JSON files in the repo. Unsaved admin edits in those sections will be lost.'
      : `This overwrites Supabase CMS data for ${portfolioLabel} with the JSON files in the repo. Unsaved admin edits in those sections will be lost.`;

  return (
    <div className="border-t border-gray-200 px-3 py-3 dark:border-gray-800">
      <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <Database className="h-3 w-3" />
        Sync from repo
      </p>
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        Seed CMS from repo JSON — hero, about, skills, projects, experience, community, contact,
        footer, social links.
      </p>
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs"
          disabled={busy}
          onClick={() => setConfirmScope('current')}
        >
          {busy && confirmScope === 'current' ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Database className="mr-2 h-3.5 w-3.5" />
          )}
          Push defaults — this portfolio
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs"
          disabled={busy}
          onClick={() => setConfirmScope('all')}
        >
          {busy && confirmScope === 'all' ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Database className="mr-2 h-3.5 w-3.5" />
          )}
          Push defaults — all portfolios
        </Button>
      </div>
      {status && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{status}</p>}

      <AlertDialog
        open={confirmScope !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmScope(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || confirmScope === null}
              onClick={(event) => {
                event.preventDefault();
                if (confirmScope) void runPush(confirmScope);
              }}
            >
              {busy ? 'Pushing…' : 'Push to CMS'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

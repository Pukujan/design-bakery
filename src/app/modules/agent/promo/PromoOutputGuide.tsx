import type { PromoAgentData } from './promoTypes';

type PromoOutputGuideProps = {
  variant: 'before' | 'after';
  result?: PromoAgentData | null;
};

/** Explains what Promo generates — before and after a run. */
export function PromoOutputGuide({ variant, result }: PromoOutputGuideProps) {
  if (variant === 'before') {
    return (
      <div className="mb-4 rounded-xl border-2 border-dashed border-indigo-400 bg-indigo-50/80 p-4 text-sm dark:bg-indigo-950/30">
        <p className="font-black text-indigo-900 dark:text-indigo-200 mb-2">
          What will Generate create?
        </p>
        <ul className="list-disc space-y-1.5 pl-4 text-gray-800 dark:text-gray-200">
          <li>
            <strong>LinkedIn post</strong> — 1 draft (~900–1300 chars) summarizing your article in
            the tone you picked
          </li>
          <li>
            <strong>3 hook lines</strong> — alternate opening sentences (pick one or merge into
            the post)
          </li>
          <li>
            <strong>4–8 hashtags</strong> — appended at the bottom when you copy
          </li>
        </ul>
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          It reads your post from Firestore and calls OpenRouter (Qwen). It does{' '}
          <strong>not</strong> change the blog, SEO meta, or post to LinkedIn for you.
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="mb-4 rounded-xl border-3 border-black bg-indigo-100 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:bg-indigo-950/50">
      <p className="font-black text-sm uppercase tracking-wide text-indigo-900 dark:text-indigo-100 mb-2">
        Generated just now
      </p>
      <ul className="grid gap-2 text-sm text-gray-900 dark:text-gray-100">
        <li>
          <span className="font-bold">Main post:</span> {result.linkedInPost.length} characters
          (paste into LinkedIn body)
        </li>
        <li>
          <span className="font-bold">Hooks:</span> {result.hooks.length} opening options
        </li>
        <li>
          <span className="font-bold">Hashtags:</span>{' '}
          {result.hashtags.length > 0 ? result.hashtags.join(', ') : 'none'}
        </li>
      </ul>
      <p className="mt-2 text-xs text-gray-700 dark:text-gray-300">
        Not happy? Change tone or extra instructions, then click <strong>Regenerate</strong> for a
        new draft (uses another API call).
      </p>
    </div>
  );
}

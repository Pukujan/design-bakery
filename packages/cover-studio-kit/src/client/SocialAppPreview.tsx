import type { ReactNode } from 'react';
import type { SocialPreviewFrame } from '../socialFormats.js';

export type SocialVariantPreview = {
  id: string;
  label: string;
  platform: string;
  width: number;
  height: number;
  previewFrame: SocialPreviewFrame | string;
  previewDataUrl: string;
};

type Props = {
  variant: SocialVariantPreview;
  onDownload?: () => void;
};

function FrameChrome({
  frame,
  children,
}: {
  frame: SocialPreviewFrame | string;
  children: ReactNode;
}) {
  const base = 'overflow-hidden rounded-xl border bg-white shadow-md dark:border-gray-700 dark:bg-gray-900';

  switch (frame) {
    case 'instagram-feed':
    case 'instagram-portrait':
      return (
        <div className={base}>
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-semibold">your_account</p>
              <p className="text-[0.55rem] text-gray-400">Sponsored</p>
            </div>
          </div>
          <div className="bg-black">{children}</div>
          <div className="flex gap-3 px-3 py-2 text-gray-400">
            <span className="text-sm">♥</span>
            <span className="text-sm">💬</span>
            <span className="text-sm">↗</span>
          </div>
        </div>
      );

    case 'instagram-story':
      return (
        <div className={`${base} max-w-[220px] mx-auto`}>
          <div className="flex items-center justify-between bg-black px-2 py-1.5 text-white">
            <span className="text-[0.55rem]">your_account</span>
            <span className="text-[0.5rem] opacity-70">Story</span>
          </div>
          <div className="bg-black">{children}</div>
        </div>
      );

    case 'linkedin-feed':
      return (
        <div className={base}>
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <div className="h-8 w-8 rounded-full bg-[#0a66c2]" />
            <div>
              <p className="text-[0.65rem] font-semibold">Your Name</p>
              <p className="text-[0.55rem] text-gray-500">Just now · 🌐</p>
            </div>
          </div>
          {children}
          <div className="border-t border-gray-100 px-3 py-1.5 text-[0.55rem] text-gray-500 dark:border-gray-800">
            👍 Like · 💬 Comment · ↗ Repost
          </div>
        </div>
      );

    case 'linkedin-cover':
      return (
        <div className={base}>
          <div className="relative h-8 bg-gray-100 dark:bg-gray-800">{children}</div>
          <div className="relative px-3 pb-2 pt-6">
            <div className="absolute -top-4 left-3 h-10 w-10 rounded-full border-2 border-white bg-[#0a66c2] dark:border-gray-900" />
            <p className="text-[0.65rem] font-semibold pt-1">Your Name</p>
            <p className="text-[0.55rem] text-gray-500">Headline · Location</p>
          </div>
        </div>
      );

    case 'facebook-feed':
      return (
        <div className={base}>
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <div className="h-8 w-8 rounded-full bg-[#1877f2]" />
            <div>
              <p className="text-[0.65rem] font-semibold">Your Page</p>
              <p className="text-[0.55rem] text-gray-500">Just now · 🌎</p>
            </div>
          </div>
          {children}
          <div className="border-t border-gray-100 px-3 py-1.5 text-[0.55rem] text-gray-500 dark:border-gray-800">
            👍 Like · Comment · Share
          </div>
        </div>
      );

    case 'facebook-cover':
      return (
        <div className={base}>
          <div className="relative">{children}</div>
          <div className="relative px-3 pb-2">
            <div className="absolute -top-5 left-3 h-12 w-12 rounded-full border-4 border-white bg-[#1877f2] dark:border-gray-900" />
            <p className="pt-8 text-[0.7rem] font-bold">Your Page</p>
          </div>
        </div>
      );

    case 'tiktok':
      return (
        <div className={`${base} relative max-w-[200px] mx-auto bg-black border-gray-800`}>
          <div className="flex justify-between px-2 py-1 text-[0.5rem] text-white">
            <span>Following</span>
            <span>For You</span>
          </div>
          <div className="relative bg-black">{children}</div>
          <div className="pointer-events-none absolute right-2 bottom-14 flex flex-col gap-2 text-xs text-white opacity-80">
            <span>♥</span>
            <span>💬</span>
            <span>↗</span>
          </div>
        </div>
      );

    case 'x-feed':
      return (
        <div className={base}>
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <div className="h-8 w-8 rounded-full bg-black dark:bg-white" />
            <div>
              <p className="text-[0.65rem] font-semibold">@you</p>
              <p className="text-[0.55rem] text-gray-500">Just now</p>
            </div>
          </div>
          {children}
          <div className="flex gap-4 border-t border-gray-100 px-3 py-1.5 text-[0.55rem] text-gray-500 dark:border-gray-800">
            <span>💬</span>
            <span>↻</span>
            <span>♥</span>
            <span>↗</span>
          </div>
        </div>
      );

    default:
      return <div className={base}>{children}</div>;
  }
}

export function SocialAppPreview({ variant, onDownload }: Props) {
  const aspect = variant.width / variant.height;
  const isTall = aspect < 0.7;
  const isWide = aspect > 2;

  return (
    <article className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{variant.label}</p>
          <p className="text-[0.65rem] text-gray-500">
            {variant.platform} · {variant.width}×{variant.height}
          </p>
        </div>
        {onDownload ? (
          <button
            type="button"
            className="text-[0.65rem] text-indigo-600 hover:underline dark:text-indigo-400"
            onClick={onDownload}
          >
            Download
          </button>
        ) : null}
      </div>

      <FrameChrome frame={variant.previewFrame}>
        <div
          className={`relative w-full overflow-hidden bg-gray-900 ${
            isTall ? 'max-h-[320px]' : isWide ? 'max-h-[100px]' : 'max-h-[220px]'
          }`}
          style={{ aspectRatio: `${variant.width} / ${variant.height}` }}
        >
          <img
            src={variant.previewDataUrl}
            alt={variant.label}
            className="h-full w-full object-cover"
          />
        </div>
      </FrameChrome>
    </article>
  );
}

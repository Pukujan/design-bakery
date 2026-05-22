import { ExternalLink } from 'lucide-react';
import type { BlogPost } from '@/lib/adminContentService';
import {
  resolveBlogMetaDescription,
  resolveBlogMetaTitle,
  type BlogSeo,
} from '@/modules/blog/seo/blogSeo';
import { Button } from '@/components/ui/button';

type SeoLivePreviewProps = {
  post: BlogPost;
  draftSeo: BlogSeo;
  siteLabel: string;
  publicUrl: string;
};

function sourceLabel(custom: string | undefined, fallback: string): string {
  return custom?.trim() ? 'custom field' : `fallback: ${fallback}`;
}

/** Shows exactly what the public blog page will use for meta tags. */
export function SeoLivePreview({ post, draftSeo, siteLabel, publicUrl }: SeoLivePreviewProps) {
  const effective: BlogSeo = {
    metaTitle: draftSeo.metaTitle?.trim() || undefined,
    metaDescription: draftSeo.metaDescription?.trim() || undefined,
    ogImage: draftSeo.ogImage?.trim() || undefined,
  };

  const metaTitle = resolveBlogMetaTitle(post.title, effective);
  const metaDescription = resolveBlogMetaDescription(post.excerpt, effective);
  const tabTitle = `${metaTitle} | ${siteLabel}`;
  const ogImage = effective.ogImage;

  const saved = post.seo;
  const savedTitle = saved?.metaTitle?.trim();
  const savedDesc = saved?.metaDescription?.trim();

  return (
    <div className="mb-6 rounded-xl border-3 border-black bg-yellow-100 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:bg-yellow-950/50">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black uppercase tracking-wide text-gray-900 dark:text-gray-100">
          Live preview (what the public post uses)
        </h3>
        {publicUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-2 border-black font-bold h-8"
            asChild
          >
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Open public post
            </a>
          </Button>
        )}
      </div>

      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="font-bold text-gray-800 dark:text-gray-200">Browser tab title</dt>
          <dd className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">{tabTitle}</dd>
          <dd className="text-xs text-gray-600 dark:text-gray-400">
            {sourceLabel(draftSeo.metaTitle, 'post title')}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-gray-800 dark:text-gray-200">
            Meta description (Google / previews)
          </dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-gray-900 dark:text-gray-100">
            {metaDescription}
          </dd>
          <dd className="text-xs text-gray-600 dark:text-gray-400">
            {sourceLabel(draftSeo.metaDescription, 'post excerpt')}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-gray-800 dark:text-gray-200">
            Share image (OG image)
          </dt>
          <dd className="mt-0.5 text-gray-900 dark:text-gray-100">
            {ogImage ? (
              <span className="break-all font-mono text-xs">{ogImage}</span>
            ) : (
              <span className="text-gray-600 italic">
                None — LinkedIn/Slack may show a generic preview. Paste a full image URL below
                if you have one.
              </span>
            )}
          </dd>
        </div>
      </dl>

      {(savedTitle || savedDesc || saved?.ogImage) && (
        <div className="mt-3 border-t-2 border-black/10 pt-3 text-xs text-gray-700 dark:text-gray-300">
          <p className="font-bold text-gray-900 dark:text-gray-100">Already saved on this post</p>
          <dl className="mt-2 grid gap-2">
            <div>
              <dt className="font-semibold">Meta title</dt>
              <dd className="whitespace-pre-wrap break-words">
                {savedTitle ?? '(none — uses post title on live site)'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Meta description</dt>
              <dd className="whitespace-pre-wrap break-words">
                {savedDesc ?? '(none — uses excerpt on live site)'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Share image</dt>
              <dd className="break-all font-mono">
                {saved?.ogImage?.trim() ?? '(none)'}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Edits in the form above are not live until you click <strong>Apply to post</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

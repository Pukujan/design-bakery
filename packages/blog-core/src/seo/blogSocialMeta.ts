export type BlogSocialMetaTag = {
  attr: 'name' | 'property';
  key: string;
  content: string;
};

export function readClientSocialEnv() {
  return {
    fbAppId: import.meta.env.VITE_FB_APP_ID?.trim() ?? '',
    twitterSite: import.meta.env.VITE_TWITTER_SITE?.trim() ?? '',
  };
}

export function collectBlogSocialMetaTags(params: {
  pageTitle: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  imageAlt?: string;
  author?: string;
  publishedTime?: string;
  fbAppId?: string;
  twitterSite?: string;
}): BlogSocialMetaTag[] {
  const tags: BlogSocialMetaTag[] = [
    { attr: 'property', key: 'og:title', content: params.pageTitle },
    { attr: 'property', key: 'og:description', content: params.description },
    { attr: 'property', key: 'og:url', content: params.canonicalUrl },
    { attr: 'name', key: 'twitter:card', content: 'summary_large_image' },
    { attr: 'name', key: 'twitter:title', content: params.pageTitle },
    { attr: 'name', key: 'description', content: params.description },
  ];
  if (params.ogImage) {
    tags.push({ attr: 'property', key: 'og:image', content: params.ogImage });
    tags.push({ attr: 'name', key: 'twitter:image', content: params.ogImage });
  }
  return tags;
}

export function applyBlogSocialMetaToDocument(tags: BlogSocialMetaTag[]): () => void {
  const created: HTMLMetaElement[] = [];
  for (const tag of tags) {
    const el = document.createElement('meta');
    el.setAttribute(tag.attr, tag.key);
    el.setAttribute('content', tag.content);
    document.head.appendChild(el);
    created.push(el);
  }
  return () => created.forEach((el) => el.remove());
}

export function upsertCanonicalLink(href: string): () => void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const created = !link;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  const prev = link.href;
  link.href = href;
  return () => {
    if (created) link?.remove();
    else if (link) link.href = prev;
  };
}

/**
 * User-agents that fetch link preview HTML (must receive server-rendered OG tags, not SPA shell).
 * Telegram, Discord, Slack, WhatsApp, iMessage, Facebook, LinkedIn, X, Mastodon, etc.
 */
export const LINK_PREVIEW_CRAWLER_UA_RE =
  /bot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Slack-ImgProxy|Slackbot-LinkExpanding|Discordbot|discordbot|WhatsApp|whatsapp|TelegramBot|telegram|MicroMessenger|SkypeUriPreview|Mastodon|Bluesky|bsky|pinterest|embedly|quora link preview|Googlebot|bingbot|Applebot|iMessage|Line\/|Viber|Signal/i;

export function isLinkPreviewCrawler(userAgent: string): boolean {
  return LINK_PREVIEW_CRAWLER_UA_RE.test(userAgent);
}

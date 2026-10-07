/**
 * User-agents that need server-rendered HTML (link previews + search/AI crawlers).
 * SPA shells are invisible to most of these without JS execution.
 */
export const LINK_PREVIEW_CRAWLER_UA_RE =
  /bot|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Slack-ImgProxy|Slackbot-LinkExpanding|Discordbot|discordbot|WhatsApp|whatsapp|TelegramBot|telegram|MicroMessenger|SkypeUriPreview|Mastodon|Bluesky|bsky|pinterest|embedly|quora link preview|Googlebot|Google-Extended|bingbot|Applebot|iMessage|Line\/|Viber|Signal|GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-Web|anthropic-ai|PerplexityBot|Perplexity|YouBot|Amazonbot|cohere-ai|Bytespider|CCBot|Diffbot|Meta-ExternalAgent|meta-externalagent|ia_archiver|SemrushBot|AhrefsBot/i;

export function isLinkPreviewCrawler(userAgent: string): boolean {
  return LINK_PREVIEW_CRAWLER_UA_RE.test(userAgent);
}

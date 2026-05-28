export function isPublishKitEnabled(): boolean {
  const flag = import.meta.env.VITE_ENABLE_BLOG_PUBLISH_KIT;
  if (flag === '0' || flag === 'false') return false;
  if (flag === '1' || flag === 'true') return true;
  return import.meta.env.PROD;
}

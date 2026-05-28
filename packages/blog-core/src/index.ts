export { BlogHostProvider, useBlogHost } from './host/index.js';
export type { BlogHostConfig, BlogHostContextValue } from './host/index.js';

export {
  useBlogData,
  useBlogPost,
  useBlogCategories,
  invalidateBlogCache,
  resolveBlogNumericId,
  findBlogByNumericId,
  blogPostMergeKey,
  nextBlogNumericId,
  type Blog,
  type BlogSummary,
  type BlogCategory,
} from './data/blogData.js';

export {
  getBlogs,
  saveBlog,
  deleteBlog,
  syncBlogPostsFromSeed,
  getBlogCategories,
  setBlogCategories,
  type BlogPost,
} from './api/adminApi.js';

export { getBlogApiBaseUrl, isBlogApiEnabled, postBlogApi } from './api/blogApi.js';
export { isPublicBlogSourceEnabled, isSupabaseDirectReadEnabled } from './api/blogSource.js';
export { getAdminAccessToken, setAdminAccessToken, getAuthApiBaseUrl } from './api/adminToken.js';

export { normalizeBlogSeo, resolveBlogOgPreviewUrl } from './seo/blogMeta.js';
export { MAX_BLOG_TAGS, mergeTags, parseCommaSeparatedTags } from './lib/parseBlogTags.js';
export {
  createNewBlogPostDraft,
  DEFAULT_BLOG_AUTHOR,
  formatBlogDisplayDate,
  prepareBlogPostForSave,
} from './lib/blogPostDefaults.js';

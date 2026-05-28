#!/usr/bin/env node
/**
 * Rewrites @/ and @design-bakery paths in packages/blog-* after copy from frontend.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

const REPLACEMENTS = [
  [/@\/modules\/blog\/data\/blogData/g, '@design-bakery/blog-core'],
  [/@\/modules\/blog\/data\//g, '@design-bakery/blog-core/data/'],
  [/@\/modules\/blog\/lib\//g, '@design-bakery/blog-core/lib/'],
  [/@\/modules\/blog\/seo\//g, '@design-bakery/blog-core/seo/'],
  [/@\/modules\/blog\/shared\//g, '@design-bakery/blog-ui/shared/'],
  [/@\/modules\/blog\/render\//g, '@design-bakery/blog-ui/render/'],
  [/@\/modules\/blog\/studio\//g, '@design-bakery/blog-creator/studio/'],
  [/@\/modules\/blog\/admin\//g, '@design-bakery/blog-creator/admin/'],
  [/@\/lib\/adminContentService/g, '@design-bakery/blog-core/admin'],
  [/@\/lib\/blogApi/g, '@design-bakery/blog-core'],
  [/@\/lib\/blogFeatureFlags/g, '@design-bakery/blog-creator/studio/blogFeatureFlags'],
  [/@\/lib\/blogSource/g, '@design-bakery/blog-core'],
  [/@\/lib\/contentApi/g, '@design-bakery/blog-core'],
  [/@\/lib\/adminToken/g, '@design-bakery/blog-core'],
  [/@\/lib\/supabasePublic/g, '@design-bakery/blog-core'],
  [/@\/hooks\/useInView/g, '@design-bakery/blog-ui/hooks/useInView'],
  [/@\/hooks\/useDarkMode/g, '@design-bakery/blog-ui/hooks/useDarkMode'],
  [/@\/portfolios\/PortfolioContext/g, '@design-bakery/blog-core/host'],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const packagesDir = join(root, 'packages');
for (const pkg of readdirSync(packagesDir)) {
  if (!pkg.startsWith('blog-')) continue;
  const src = join(packagesDir, pkg, 'src');
  try {
    statSync(src);
  } catch {
    continue;
  }
  for (const file of walk(src)) {
    let text = readFileSync(file, 'utf8');
    let changed = false;
    for (const [from, to] of REPLACEMENTS) {
      if (from.test(text)) {
        text = text.replace(from, to);
        changed = true;
      }
    }
    if (changed) writeFileSync(file, text);
  }
}

// blog-core internal data layer
const blogDataPath = join(packagesDir, 'blog-core/src/data/blogData.ts');
let blogData = readFileSync(blogDataPath, 'utf8');
blogData = blogData
  .replace(/from '@\/lib\/contentApi'/g, "from '../api/contentApi.js'")
  .replace(/from '@\/lib\/adminToken'/g, "from '../api/adminToken.js'")
  .replace(/from '@\/lib\/blogSource'/g, "from '../api/blogSource.js'")
  .replace(/from '@\/modules\/blog\/lib\/blogPostDefaults'/g, "from '../lib/blogPostDefaults.js'")
  .replace(/from '@\/modules\/blog\/seo\/blogMeta'/g, "from '../seo/blogMeta.js'");
writeFileSync(blogDataPath, blogData);

const blogSupaPath = join(packagesDir, 'blog-core/src/data/blogSupabase.ts');
let blogSupa = readFileSync(blogSupaPath, 'utf8');
blogSupa = blogSupa.replace(
  /from '@\/lib\/supabasePublic'/g,
  "from '../api/supabasePublic.js'",
);
writeFileSync(blogSupaPath, blogSupa);

console.log('Import paths updated in packages/blog-*');

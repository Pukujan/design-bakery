#!/usr/bin/env node
/** Run after `pnpm --dir backend run build`: crawler metadata replaces homepage tags. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { injectSocialMetaIntoHtmlHead } from '../backend/lib/og/blogShareHtml.js';

const shell = (await readFile(new URL('../frontend/index.html', import.meta.url), 'utf8'))
  // Give the shell deliberately different dimensions, to detect leaked tags.
  .replace('property="og:image:width" content="1200"', 'property="og:image:width" content="777"')
  .replace('property="og:image:height" content="630"', 'property="og:image:height" content="333"');
const meta = {
  pageTitle: 'An article & its image',
  description: 'A distinct description',
  canonicalUrl: 'https://www.design-bakery.com/blogs/23',
  ogImage: 'https://example.com/article.jpg',
  imageAlt: 'Article artwork',
};
const html = injectSocialMetaIntoHtmlHead(shell, meta);
for (const [property, value] of Object.entries({
  'og:image': meta.ogImage,
  'og:image:alt': meta.imageAlt,
})) {
  const tags = [...html.matchAll(new RegExp(`<meta\\s+property="${property}"[^>]*>`, 'g'))];
  assert.equal(tags.length, 1, `expected exactly one ${property}`);
  assert.ok(tags[0][0].includes(`content="${value}"`), `${property} must belong to the article`);
}
for (const property of ['og:image:width', 'og:image:height']) {
  const tags = [...html.matchAll(new RegExp(`<meta\\s+property="${property}"[^>]*>`, 'g'))];
  assert.ok(tags.length <= 1, `homepage ${property} must not be duplicated`);
  assert.ok(!tags[0]?.[0].includes('content="777"') && !tags[0]?.[0].includes('content="333"'), `homepage ${property} must not leak`);
}
assert.ok(!html.includes('Design Baker — AI/ML, product and design engineering'), 'homepage image alt must not leak into article metadata');
assert.ok(html.includes('href="/favicon.ico"'), 'the crawler shell retains the favicon');
assert.ok(html.includes('<title>An article &amp; its image</title>'), 'title is escaped');
console.log('og-injection: article image tags replace homepage image tags');

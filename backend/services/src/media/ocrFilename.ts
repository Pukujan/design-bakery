import { callOpenRouterVision } from '../openrouterVision.js';
import { slugifyFilename } from './slugifyFilename.js';

const OCR_SYSTEM = `You name image files for a media library. Read all visible text in the image (OCR) and infer what the picture shows.
Reply with ONE filesystem-safe basename only: lowercase kebab-case, no file extension, no quotes, no explanation.
Prefer distinctive words from labels, titles, UI, or document headings in the image. Max 80 characters.`;

const OCR_USER = `Perform OCR on this image and return a single descriptive filename basename.`;

const TAG_SYSTEM = `You generate concise search tags for one image.
Return ONLY comma-separated lowercase tags.
No numbering, no markdown, no explanation.
Use 8-12 tags, each 2-5 words.
Tags must be SEO-style and diverse:
- primary subject
- visual style / medium
- context or setting
- intent/use-case (e.g. blog hero, product launch)
- industry/topic
- mood/descriptor
Avoid generic words like image, photo, screenshot.
Avoid repeating the filename words as plain duplicates.`;

const TAG_USER = `Read the image and produce useful retrieval tags for OCR text, subject, and context.`;

function normalizeTags(raw: string): string[] {
  const tags = new Set<string>();
  for (const token of raw.split(/[,\n]/)) {
    const t = token.trim().toLowerCase().replace(/[^a-z0-9 -]+/g, '').replace(/\s+/g, ' ');
    if (!t || t.length < 4) continue;
    if (['image', 'photo', 'picture', 'screenshot'].includes(t)) continue;
    tags.add(t.slice(0, 40));
  }
  return [...tags].slice(0, 12);
}

function fallbackTagsFromText(...parts: string[]): string[] {
  const stop = new Set([
    'the',
    'and',
    'for',
    'with',
    'from',
    'this',
    'that',
    'image',
    'photo',
    'screenshot',
    'png',
    'jpg',
    'jpeg',
  ]);
  const tags = new Set<string>();
  for (const part of parts) {
    for (const token of part.toLowerCase().split(/[^a-z0-9]+/g)) {
      if (token.length < 3 || stop.has(token)) continue;
      tags.add(token.slice(0, 30));
    }
  }
  const core = [...tags].slice(0, 4);
  const seo = new Set<string>([
    ...core.map((t) => `${t} concept art`),
    ...core.map((t) => `${t} visual design`),
    ...core.map((t) => `${t} blog hero`),
    'digital illustration',
    'seo image asset',
  ]);
  return [...seo].slice(0, 10);
}

export async function suggestFilenameFromImage(params: {
  apiKey: string;
  imageUrl: string;
  model?: string;
}): Promise<{ filename: string; raw: string; model: string }> {
  const { content, model } = await callOpenRouterVision({
    apiKey: params.apiKey,
    model: params.model,
    system: OCR_SYSTEM,
    userText: OCR_USER,
    imageUrl: params.imageUrl,
  });

  const filename = slugifyFilename(content);
  return { filename, raw: content, model };
}

export async function suggestMediaMetaFromImage(params: {
  apiKey: string;
  imageUrl: string;
  model?: string;
}): Promise<{
  filename: string;
  slug: string;
  tags: string[];
  rawFilename: string;
  rawTags: string;
  model: string;
}> {
  const [nameResult, tagResult] = await Promise.all([
    callOpenRouterVision({
      apiKey: params.apiKey,
      model: params.model,
      system: OCR_SYSTEM,
      userText: OCR_USER,
      imageUrl: params.imageUrl,
    }),
    callOpenRouterVision({
      apiKey: params.apiKey,
      model: params.model,
      system: TAG_SYSTEM,
      userText: TAG_USER,
      imageUrl: params.imageUrl,
      maxTokens: 180,
    }),
  ]);

  const filename = slugifyFilename(nameResult.content);
  const slug = slugifyFilename(filename);
  const tags =
    normalizeTags(tagResult.content).length > 0
      ? normalizeTags(tagResult.content)
      : fallbackTagsFromText(filename, nameResult.content, tagResult.content);

  return {
    filename,
    slug,
    tags,
    rawFilename: nameResult.content,
    rawTags: tagResult.content,
    model: nameResult.model,
  };
}

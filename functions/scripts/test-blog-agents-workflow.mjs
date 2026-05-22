#!/usr/bin/env node
/**
 * End-to-end blog agents workflow test (publish kit + promo).
 *
 * Default (offline, no API cost):
 *   pnpm run test:blog-workflow
 *
 * Live OpenRouter (meta, tags, promo + template visual):
 *   pnpm run test:blog-workflow:live
 *
 * Live + hybrid AI hero images (slow, uses image model):
 *   pnpm run test:blog-workflow:live:ai
 *
 * Include Storage upload checks (needs gcloud ADC or client upload path):
 *   pnpm run test:blog-workflow:storage
 *
 * Probe Functions emulator HTTP (pnpm run dev in another terminal):
 *   pnpm run test:blog-workflow:emulator
 */
import {
  WorkflowReporter,
  SAMPLE_BLOG,
  TINY_PNG_BASE64,
  functionsDir,
  loadAllEnv,
  parseArgs,
  readFirebaseProjectId,
  hasOpenRouterKey,
  resolveModel,
  isDataImageUrl,
  isHttpsUrl,
  runFunctionsBuild,
} from './lib/test-helpers.mjs';

const PROMO_FIXTURE = JSON.stringify({
  linkedInPost:
    'I wrote about how we wired publish kit previews to commit on save instead of uploading during generate. ' +
    'The post walks through OpenRouter meta, template fallbacks, and Storage paths. Worth a read if you run Firebase Functions locally.',
  hashtags: ['firebase', 'openrouter', 'engineering'],
  hooks: [
    'Generate previews first, upload on save — here is why.',
    'Our blog admin agents share one snapshot shape for promo and publish kit.',
    'Template visuals still work when the image API times out.',
  ],
});

function kitRequest(action, blogId, extra = {}) {
  return {
    version: 1,
    action,
    blogId,
    blogSnapshot: { ...SAMPLE_BLOG, numericId: blogId },
    publicUrl: 'http://localhost:5300/blogs/1',
    preferences: {
      metaTone: 'technical',
      visualStyle: 'line_art',
      visualMode: 'template',
      variationOffset: 0,
      ...extra.preferences,
    },
    ...extra,
  };
}

async function probeEmulator(projectId) {
  const url = `http://127.0.0.1:5001/${projectId}/us-central1/invokeBlogPublishKit`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: kitRequest('commit_visual', SAMPLE_BLOG.numericId, {
          visualCommit: {
            ogPreviewDataUrl: `data:image/png;base64,${TINY_PNG_BASE64}`,
            sameImageForCoverAndOg: true,
          },
        }),
      }),
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    return { ok: false, status: 0, text: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log(`Usage: test-blog-agents-workflow [options]

Options:
  --offline          Template visuals + parsing only (default)
  --live             OpenRouter meta, tags, promo (+ template visual)
  --with-ai-images   With --live: hybrid visual (image model API)
  --storage          Assert HTTPS URLs from commit_visual / uploadBlogImage
  --emulator         HTTP probe against Functions emulator (:5001)
  --blog-id=N        Numeric blog id for Storage paths (default ${SAMPLE_BLOG.numericId})
`);
    process.exit(0);
  }

  const blogId = flags.blogId;
  const r = new WorkflowReporter();

  console.log('Blog agents workflow test');
  console.log(`  mode: ${flags.live ? (flags.withAiImages ? 'live+ai-images' : 'live') : 'offline'}`);
  console.log(`  storage checks: ${flags.storage ? 'yes' : 'no'}`);
  console.log(`  emulator probe: ${flags.emulator ? 'yes' : 'no'}`);
  console.log(`  blog numericId: ${blogId}`);

  loadAllEnv();

  r.step('Build functions');
  try {
    runFunctionsBuild();
    r.ok('tsc OK');
  } catch (err) {
    r.fail('build', err);
    process.exit(1);
  }

  const { ensureFirebaseAdminApp, resolveStorageBucket } = await import('../lib/firebaseApp.js');
  const { interFontFaceDefs } = await import('../lib/blog/publishKit/fonts.js');
  const { handlePublishKit } = await import('../lib/blog/publishKit/handler.js');
  const { commitVisualImages } = await import('../lib/blog/publishKit/commitVisual.js');
  const { uploadBlogImage } = await import('../lib/blog/publishKit/storage.js');
  const { buildPromoPrompt, parsePromoResponse } = await import('../lib/promo.js');
  const { callOpenRouter } = await import('../lib/openrouter.js');

  r.step('Environment');
  console.log(`  OPENROUTER_API_KEY: ${hasOpenRouterKey() ? 'set' : 'missing'}`);
  console.log(`  OPENROUTER_MODEL: ${resolveModel()}`);
  console.log(`  storage bucket: ${resolveStorageBucket()}`);
  console.log(`  PUBLISH_KIT_VISUAL_MODE: ${process.env.PUBLISH_KIT_VISUAL_MODE ?? '(unset)'}`);
  ensureFirebaseAdminApp();
  r.ok('firebase-admin initialized');

  r.step('Inter fonts');
  try {
    const defs = interFontFaceDefs();
    if (!defs.includes('base64') || defs.length < 1000) throw new Error('missing embedded WOFF');
    r.ok('Inter WOFF embedded for sharp/SVG renders');
  } catch (err) {
    r.fail('fonts', err);
  }

  r.step('Promo JSON parse (offline)');
  try {
    const promo = parsePromoResponse(PROMO_FIXTURE);
    if (!promo.linkedInPost || promo.hashtags.length < 1 || promo.hooks.length < 1) {
      throw new Error('incomplete promo shape');
    }
    r.ok(`promo parse OK (${promo.hashtags.length} tags, ${promo.hooks.length} hooks)`);
  } catch (err) {
    r.fail('promo parse', err);
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim() ?? '';
  const model = resolveModel();
  const dummyKey = 'sk-test-offline';

  /** Admin flow: Generate (preview) → commit on save */
  r.step('Publish kit — Generate visual (template)');
  let visualPreviews = null;
  try {
    const res = await handlePublishKit({
      body: kitRequest('visual', blogId, { preferences: { visualMode: 'template' } }),
      apiKey: flags.live && hasOpenRouterKey() ? apiKey : dummyKey,
      model,
    });
    const v = res.visual;
    if (!v?.ogPreviewDataUrl || !v?.coverPreviewDataUrl) {
      throw new Error('missing visual previews');
    }
    if (!isDataImageUrl(v.ogPreviewDataUrl) || !isDataImageUrl(v.coverPreviewDataUrl)) {
      throw new Error('previews must be data:image URLs at generate time');
    }
    if (v.ogPreviewDataUrl.length < 500 || v.coverPreviewDataUrl.length < 500) {
      throw new Error('preview payloads too small');
    }
    visualPreviews = v;
    r.ok(`template visual (${v.templateFamily}/${v.layoutVariant}, usedAi=${v.usedAiArt ?? false})`);
  } catch (err) {
    r.fail('visual generate', err);
  }

  if (flags.live) {
    if (!hasOpenRouterKey()) {
      r.skip('Publish kit — meta + tags (live)', 'OPENROUTER_API_KEY missing in functions/.env');
      r.skip('Promo agent — OpenRouter (live)', 'OPENROUTER_API_KEY missing');
    } else {
      r.step('Publish kit — meta + tags (live OpenRouter)');
      try {
        const res = await handlePublishKit({
          body: kitRequest('meta_and_tags', blogId),
          apiKey,
          model,
        });
        const excerpt = res.meta?.excerpt?.trim();
        const title = res.meta?.metaTitle?.trim();
        const desc = res.meta?.metaDescription?.trim();
        const tags = res.tags?.tags ?? [];
        if (!excerpt || excerpt.length < 40 || excerpt.length > 220) {
          throw new Error(`excerpt length unexpected: ${excerpt?.length}`);
        }
        if (!title || title.length < 8 || title.length > 70) {
          throw new Error(`metaTitle length unexpected: ${title?.length}`);
        }
        if (!desc || desc.length < 40 || desc.length > 200) {
          throw new Error(`metaDescription length unexpected: ${desc?.length}`);
        }
        if (tags.length < 1 || tags.length > 5) {
          throw new Error(`expected 1–5 tags, got ${tags.length}`);
        }
        r.ok(`meta: "${title.slice(0, 48)}…"`);
        r.ok(`tags: ${tags.join(', ')}`);
      } catch (err) {
        r.fail('meta_and_tags', err);
      }

      r.step('Promo agent — OpenRouter (live)');
      try {
        const blog = { ...SAMPLE_BLOG, numericId: blogId };
        const { system, user } = buildPromoPrompt({
          title: blog.title,
          excerpt: blog.excerpt,
          content: blog.content,
          tags: blog.tags,
          category: blog.category,
          author: blog.author,
          publicUrl: 'http://localhost:5300/blogs/1',
          theme: 'technical',
        });
        const llm = await callOpenRouter({ apiKey, model, system, user });
        const promo = parsePromoResponse(llm.content);
        if (promo.linkedInPost.length < 200) throw new Error('linkedInPost too short');
        r.ok(`promo LLM OK (${promo.linkedInPost.length} chars, model ${llm.model})`);
      } catch (err) {
        r.fail('promo LLM', err);
      }
    }

    if (flags.withAiImages && hasOpenRouterKey()) {
      r.step('Publish kit — hybrid visual (live image model)');
      try {
        const res = await handlePublishKit({
          body: kitRequest('visual', blogId, {
            preferences: { visualMode: 'hybrid', imageModel: process.env.OPENROUTER_IMAGE_MODEL },
          }),
          apiKey,
          model,
        });
        const v = res.visual;
        if (!isDataImageUrl(v?.ogPreviewDataUrl)) throw new Error('missing hybrid preview');
        r.ok(`hybrid visual (usedAiArt=${v?.usedAiArt ?? false}, model=${v?.imageModel ?? 'n/a'})`);
      } catch (err) {
        r.fail('hybrid visual', err);
      }
    } else if (flags.withAiImages) {
      r.skip('hybrid visual', 'OPENROUTER_API_KEY missing');
    }
  } else {
    r.skip('meta + tags (live)', 'use --live');
    r.skip('promo LLM (live)', 'use --live');
    r.skip('hybrid visual', 'use --live --with-ai-images');
  }

  r.step('Publish kit — commit_visual (save simulation)');
  const ogDataUrl =
    visualPreviews?.ogPreviewDataUrl ?? `data:image/png;base64,${TINY_PNG_BASE64}`;
  try {
    const res = await handlePublishKit({
      body: kitRequest('commit_visual', blogId, {
        visualCommit: {
          ogPreviewDataUrl: ogDataUrl,
          coverPreviewDataUrl: visualPreviews?.coverPreviewDataUrl ?? ogDataUrl,
          sameImageForCoverAndOg: true,
        },
      }),
      apiKey: dummyKey,
      model,
    });
    const v = res.visual;
    const hasHttp =
      isHttpsUrl(v?.ogImageUrl) &&
      isHttpsUrl(v?.coverImageUrl) &&
      isHttpsUrl(v?.thumbnailImageUrl);
    const stillData =
      isDataImageUrl(v?.ogImageUrl) ||
      isDataImageUrl(v?.coverImageUrl);

    if (hasHttp) {
      r.ok(`commit returned HTTPS URLs`);
      r.ok(`og: ${v.ogImageUrl.slice(0, 72)}…`);
    } else if (stillData || !v?.ogImageUrl) {
      if (flags.storage) {
        r.fail(
          'commit_visual',
          'expected HTTPS URLs (run gcloud auth application-default login or use admin client upload)',
        );
      } else {
        r.skip('commit HTTPS URLs', 'Storage not configured — use --storage to require uploads');
      }
    } else {
      r.fail('commit_visual', `unexpected URL shape: ${String(v?.ogImageUrl).slice(0, 80)}`);
    }
  } catch (err) {
    r.fail('commit_visual handler', err);
  }

  if (flags.storage) {
    r.step('Storage — uploadBlogImage + commitVisualImages');
    try {
      const png = Buffer.from(TINY_PNG_BASE64, 'base64');
      const single = await uploadBlogImage({ numericId: blogId, kind: 'og', png });
      if (!single?.url || !isHttpsUrl(single.url)) {
        throw new Error('uploadBlogImage returned no HTTPS url');
      }
      r.ok(`direct upload: ${single.url.slice(0, 72)}…`);

      const urls = await commitVisualImages({
        numericId: blogId,
        ogPreviewDataUrl: ogDataUrl,
        coverPreviewDataUrl: ogDataUrl,
        sameImageForCoverAndOg: true,
      });
      if (!isHttpsUrl(urls.ogImageUrl) || !isHttpsUrl(urls.coverImageUrl)) {
        throw new Error('commitVisualImages did not return HTTPS URLs');
      }
      r.ok('commitVisualImages uploaded og + cover + thumbs');
    } catch (err) {
      r.fail('storage', err);
    }
  } else {
    r.skip('Storage direct upload', 'use --storage');
  }

  if (flags.emulator) {
    r.step('Functions emulator HTTP probe');
    const project = await readFirebaseProjectId();
    const probe = await probeEmulator(project);
    if (probe.status === 0) {
      r.fail('emulator', probe.text);
    } else if (probe.status === 401 || probe.text.includes('unauthenticated')) {
      r.ok(`emulator reachable (HTTP ${probe.status} — auth required, expected for onCall)`);
    } else if (probe.ok) {
      const json = JSON.parse(probe.text);
      const og = json.result?.visual?.ogImageUrl ?? '';
      if (isHttpsUrl(og)) r.ok('emulator commit_visual returned HTTPS (unauthenticated path worked)');
      else r.ok(`emulator HTTP ${probe.status} — callable responded`);
    } else {
      r.fail('emulator', `HTTP ${probe.status}: ${probe.text.slice(0, 240)}`);
    }
  }

  const ok = r.summary();
  if (!ok) {
    console.log(`
Tips:
  • Offline (default): pnpm run test:blog-workflow
  • Full AI text:       pnpm run test:blog-workflow:live  (needs OPENROUTER_API_KEY in functions/.env)
  • AI hero images:     pnpm run test:blog-workflow:live:ai
  • Storage uploads:    pnpm run test:blog-workflow:storage  (+ gcloud auth application-default login)
  • Emulator probe:     pnpm run dev  then  pnpm run test:blog-workflow:emulator
`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

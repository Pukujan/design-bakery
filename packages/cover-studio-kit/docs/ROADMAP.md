# Cover Studio — roadmap (cache-first & cost reduction)

Goal: **minimize OpenRouter spend** while keeping illustration quality, using **deterministic local matching first**, then LLM only when confidence is low.

---

## Current state (shipped)

### Hero image cache (text-free PNG)

Already in `heroCache.ts` + migration `003`:

1. Normalize tags + category → slug set (`heroCacheSlugs.ts`).
2. Query `publish_kit_hero_cache` with GIN on `tag_slugs`.
3. Hard filter: `prompt_version`, `family`, `style_preset`.
4. Score: **Jaccard similarity** on slug sets.
5. Accept if `score ≥ PUBLISH_KIT_HERO_CACHE_MIN_SCORE` (default **0.55**) **and** overlap ≥ `MIN_TAGS` (default **2**).
6. On miss → OpenRouter image → store PNG + metadata (async).

### Tag suggestion agent

`suggestCoverStudioTags` — always calls LLM today. No local cache.

### Copy normalization agent

`normalizeCoverStudioCopy` — always calls LLM; falls back to local name-capitalization regex on failure.

---

## Planned — layered tag matching (local first)

### Layer 0 — Regex & rules (zero LLM)

| Check | Action |
|-------|--------|
| Title/description already well-formed (sentence case, no obvious typos via hunspell or simple dict) | Skip normalize agent |
| Tags already 3–5 Title Case tokens | Skip suggest agent |
| Blocklist / allowlist regex on tags (no hashtags, no URLs) | Reject or strip locally |

### Layer 1 — Deterministic slug overlap (same as hero cache)

Reuse `buildHeroMatchSlugs` + Jaccard for **tag suggestions**:

- Maintain `cover_studio_tag_profiles` (future table): `{ slug_set[], suggested_tags[], use_count }`.
- On suggest request: score profiles against `(title slugs ∪ description slugs ∪ category)`.
- If `score ≥ TAG_CACHE_MIN_SCORE` (e.g. **0.6**) and overlap ≥ **2** → return cached tag set, **no LLM**.

### Layer 2 — Local vector similarity (optional pgvector)

For richer matching without LLM:

1. Embed `(title + description)` with a **local** model (e.g. `transformers.js`, ONNX, or Supabase `vector` column filled offline).
2. Nearest neighbor in `tag_profile_embeddings` / `hero_cache_embeddings`.
3. Confidence formula (proposed):

```
confidence = w1 * jaccard(slugs) + w2 * cosine(vector) + w3 * regexBonus
```

Suggested weights: `w1=0.45`, `w2=0.45`, `w3=0.10`.

- `regexBonus = 1` if title matches domain regex (e.g. `/\b(youtube|streamer|gaming)\b/i` aligns with cached profile).
- Accept cache hit if `confidence ≥ 0.72` (tunable per env).

### Layer 3 — LLM (OpenRouter)

Only when Layers 0–2 fail or user clicks **“Suggest tags”** / **“Refresh”** explicitly.

---

## Planned — hero cache v2

| Item | Detail |
|------|--------|
| **Embedding column** | `publish_kit_hero_cache.embedding vector(384)` |
| **Pre-text guarantee** | OCR pass (existing vision model) rejects heroes with detected text → never cache |
| **Cover Studio pack cache** | Optional: cache full 9-size pack keyed by `(title slug, tag slugs, layout seed)` — heavy storage, big win for repeats |
| **Prompt version gate** | Already enforced — bump `HERO_IMAGE_PROMPT_VERSION` invalidates stale art |
| **Metrics** | Log `heroSource: cache|openrouter`, `tagSource: local|llm`, confidence scores |

---

## Env vars (proposed)

```env
COVER_STUDIO_TAG_CACHE=1
COVER_STUDIO_TAG_CACHE_MIN_SCORE=0.6
COVER_STUDIO_MATCH_MIN_CONFIDENCE=0.72
COVER_STUDIO_SKIP_NORMALIZE_IF_CLEAN=1
```

---

## Implementation order

1. Tag profile table + Jaccard suggest (reuse hero slug code).
2. Surface `tagSource` / `normalizeSource` in API response (mirror `heroSource`).
3. Regex “clean copy” gate before normalize agent.
4. pgvector column + offline embedding job (optional).
5. Pack-level cache for identical regeneration requests.

See `ARCHITECTURE.md` for module boundaries when implementing in an exported repo.

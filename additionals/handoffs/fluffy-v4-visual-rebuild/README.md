# Handoff — Fluffy Design Gallery V4 visual rebuild

| Field | Value |
|---|---|
| Document date | 2026-09-10 |
| Created | 2026-09-10 |
| Last updated | 2026-09-10 |
| Repo | `Pukujan/design-bakery` |
| Primary code | `frontend/public/experiments/fluffy-system-v4/` |
| First milestone | Study Partner only |

## Mission

Rebuild Fluffy Design Gallery V4 so the **real HTML pages** match the supplied visual references closely on desktop and feel intentionally designed on phone.

The user explicitly wants normal generated/static image assets plus normal HTML/CSS. Important page copy, buttons, stats, navigation, cards, labels, and links must remain real DOM content. Generated imagery should provide the photographic/illustrative scenes and supporting art — not replace the whole page.

## Read first

1. `/AGENTS.md`.
2. `additionals/guidelines/agent-devlog-contract.md`.
3. `additionals/guidelines/agent-devlog-index.md`.
4. This handoff and `manifest.json`.
5. Inspect the existing V4 files before editing.

Note: root `AGENTS.md` currently points at `guidelines/...`, while the actual devlog files live under `additionals/guidelines/...`.

## What went wrong previously

The failures were concrete:

- V4 detail pages embedded large `data:image/...;base64,...` payloads inside CSS.
- Gallery previews were at one point whole detail pages rendered inside scaled iframes.
- A later gallery fix changed preview mechanics but did not repair the source artwork.
- Study Partner was then replaced with one generated image file, but that image did **not** match the supplied Study Partner direction.
- Existing Study Partner HTML also represented an older/different information hierarchy, so swapping the background could never reproduce the reference.
- Original Study Partner CSS used artwork sizing like `64% 100%`, which can distort aspect ratio.
- The work was being judged from code changes instead of a repeated browser screenshot comparison loop.

PR #37 merged a real image asset for Study Partner, which fixed the base64 mechanism but **not visual fidelity**. The currently merged `frontend/public/experiments/fluffy-system-v4/assets/fluffy-study-partner.avif` is known-wrong art and is not a visual reference.

At handoff creation, `main` was at `83aa6e99944b5bf785ceee890091e6321a5fcb47`. Re-check `main` when Work starts.

## Non-negotiable architecture

Use:

```text
reference screenshot
  -> analyze visual regions + content hierarchy
  -> generate separate visual assets
  -> real HTML/CSS layout
  -> intentional mobile rearrangement
  -> browser screenshot comparison
  -> iterate until close
```

Do not use:

```text
one full-page generated image
  -> CSS background
  -> unrelated HTML overlay
```

Do **not** reintroduce:

- inline `data:image/...;base64,...` art in production V4 HTML;
- `.b64` runtime image files;
- nested iframe previews;
- JavaScript that fetches another HTML file and regex-extracts its image;
- forced width/height image sizing that changes aspect ratio;
- a screenshot containing important copy as the webpage itself.

Real `.webp`, `.avif`, `.png`, `.jpg`, and `.svg` files are expected. GitHub may encode binary bytes internally while uploading; that is only transport. Runtime files must be normal assets.

## Reference files in this bundle

- `references/study-partner-reference.webp` — detailed Study Partner source of truth for the first rebuild.
- `references/v4-all-directions-contact-sheet.webp` — overview of all eight V4 directions so the visual variation is clear.

These are reference images, not production page backgrounds. Generate clean production art from the Study Partner reference instead of baking the entire reference screenshot into the page.

## First milestone — Study Partner

Target file:

`frontend/public/experiments/fluffy-system-v4/fluffy-study-partner.html`

Visual target:

`additionals/handoffs/fluffy-v4-visual-rebuild/references/study-partner-reference.webp`

### Real HTML content to reproduce

**Top nav**
- `Fluffy System` + `v4`
- `Human context for AI work.`
- `Gallery`, `Product`, `Research`, `Use Cases`, `About`
- `Open on GitHub ↗`

**Hero**
- eyebrow: `FLUFFY STUDY PARTNER`
- headline: `Turn your repo into a story people actually care about.`
- body: `Fluffy helps AI agents understand your product, your market, and your audience — so the pages they create sound human, not generic. Same code. A more human story.`
- primary CTA: `Try the interactive demo →`
- secondary CTA: `View product page`
- value prop: `Real context from your repo`
- value prop: `Built for creators, teams, and AI agents`
- value prop: `Human-sounding results, not templates`

**Feature card 01**
- `From code to credible stories.`
- `Turn your README, docs, and code into beautiful product pages that resonate with real people.`
- CTA: `Explore product page`
- visual concept: warm notebook/checklist/plant/papers
- checklist language from reference: `Read your repo`, `Understand the product`, `Find the story`, `Write like a human`, `Deliver ready-to-use pages`
- decorative note: `Same inputs. A clearer story.`

**Feature card 02**
- `Plan with real confidence.`
- `PAM (Project Assurance Matrix) helps AI agents do the homework before they build, so you get real plans, real research, and fewer surprises.`
- CTA: `Try the demo`
- visual: dark blue planning/checklist UI
- labels visible in reference: `Your Repository`, `Analyze Context`, `Find the Story`, `Generate Page`, ending with `A story people care about.`
- decorative note: `From messy inputs to a clear plan.`

**Feature card 03**
- `Beautiful visuals for bolder ideas.`
- `Generate illustrations, diagrams, and social visuals that capture your story and make it shareable.`
- CTA: `See examples`
- visual: portrait/robot/night-city collage
- decorative note: `Ideas look better together. ♡`

**Trust/stats row**
- eyebrow: `TRUSTED BY BUILDERS`
- heading: `Same tools. Different possibilities.`
- `10K+` / `Repositories analyzed`
- `2.3K` / `Product pages generated`
- `96%` / `Say it sounds more human`
- testimonial: `“Fluffy helped me explain my project in a way I’m actually proud to share.”` — `A builder`

**Footer**
- Fluffy System + `v4`
- `Human context for AI work.`
- `Gallery`, `About`, `Process`, `Research`, `Use Cases`
- `Built with intention. Not just generation.` + `v4.0`

Where the current repo already has correct destination URLs, preserve those link targets while matching the reference labels/layout.

## Study Partner art decomposition

Do not solve this page with one image. Create separate production assets under something like:

```text
frontend/public/experiments/fluffy-system-v4/assets/study-partner/
  hero.webp
  card-code-story.webp
  card-plan.webp
  card-visuals.webp
  avatar.webp          # only if actually needed
```

### Hero visual

Generate the **scene only**:

- warm night workspace / studio;
- woman centered-right, leaning on hand;
- friendly white desktop robot to her right;
- cat asleep on desk foreground;
- laptop, mug, books, plants, pinboard, warm desk lamp;
- city/window glow behind subjects;
- deep navy/black left side with enough negative space for HTML hero copy;
- primary subjects around ~50–82% of width;
- no headline/navigation/buttons baked into the pixels.

The user rejected unrelated reinterpretations. Use the reference image as the visual direction when image-reference generation is available.

### Card 01 visual

Warm tactile desk/notebook/checklist composition. Let HTML/SVG render essential checklist words if generated lettering is unreliable.

### Card 02 visual

Dark product UI/checklist atmosphere. Prefer HTML/CSS/SVG for the actual checklist labels/check marks so the text is crisp.

### Card 03 visual

Collage/polaroid composition using portrait/robot/night-city imagery. Important text stays HTML.

## SVG starter icons

The bundle contains normal `currentColor` SVG primitives:

- `icons/book.svg`
- `icons/users.svg`
- `icons/lightning.svg`
- `icons/arrow-right.svg`
- `icons/check.svg`

Use/refine these rather than generating raster icon artwork. Production copies can be moved under the V4 asset folder or inlined as SVG markup.

## Desktop target

Primary comparison viewport: approximately 1448×1086 (the source reference is 4:3). Also test 1366×768, 1440×900, and 1920×1080.

Important relationships:

- compact top nav;
- hero is roughly the upper half of the composition;
- large cream/white serif headline on the left;
- hero art center/right, never stretched;
- three equal-weight feature cards immediately below;
- dark navy/black system with fine low-contrast borders;
- warm amber imagery, cream type, occasional peach handwriting;
- avoid generic glossy SaaS styling or large pill-card radii that change the art direction.

Use CSS Grid/Flex for major structure. Absolute positioning is acceptable for decorative notes/collage layers only.

## Mobile target

The current page was explicitly rejected on phone. Do **not** shrink or crop the desktop page and call it responsive.

Test at least:

- 390×844
- 430×932
- 360×800

Recommended order:

```text
compact nav
hero copy
CTAs
hero visual
three value props
feature card 1
feature card 2
feature card 3
trust heading
stats
testimonial
footer
```

Requirements:

- no horizontal scrolling at 320px+;
- headline never clips;
- woman/robot remain visible;
- use custom `object-position` or a dedicated mobile hero crop/source if needed;
- cards stack vertically with their imagery intact;
- decorative handwriting never blocks important content;
- practical tap targets around 44px+;
- avoid fixed desktop heights on phone;
- mobile nav can simplify intentionally.

A separate mobile hero asset/crop is preferable to one compromised image that works badly everywhere.

## Gallery after Study Partner works

Once the detail page is visually approved, update its gallery card to use a direct thumbnail/image asset. The eventual V4 gallery should use normal `<img>`/`<picture>` thumbnails with lazy loading and intentional crop/focal positions — no nested iframes and no parsing detail-page HTML.

Do not broaden the first PR to all eight directions unless necessary. One visually validated Study Partner PR is preferred.

## Mandatory visual QA loop

Do not mark this complete from code inspection.

1. Run `pnpm run dev`; use the actual Vite port (first free from 5300).
2. Open `/experiments/fluffy-system-v4/fluffy-study-partner.html`.
3. Capture desktop at ~1448×1086.
4. Compare side-by-side with `references/study-partner-reference.webp`.
5. Adjust composition, crop, type scale, spacing, card heights, borders, and visual balance.
6. Repeat until it clearly reads as the same design direction.
7. Capture 390×844 and fix mobile intentionally.
8. Test 360×800 and at least one wide desktop.
9. Verify image requests are normal `/assets/...` files returning 200.
10. Search the rebuilt page for `data:image` and ensure none remains.

Useful audit command:

```bash
rg -n "data:image|base64,|<iframe|--art" frontend/public/experiments/fluffy-system-v4
```

`--art` is fine when it references a normal asset. `data:image` is not.

## Acceptance criteria — Study Partner

Do not ask the user to approve it until all are true:

- reference is clearly recognizable as the same Study Partner direction;
- hero is a real image file, not base64;
- supporting cards have independent visuals/UI layers;
- important content is real HTML;
- icons are SVG/CSS;
- desktop hierarchy/atmosphere closely matches the reference;
- 390px phone layout is intentionally rearranged and usable;
- no forced aspect-ratio distortion;
- no nested iframe preview needed for this page;
- network requests for new art are normal assets and return 200;
- existing valid external links are preserved;
- desktop + mobile screenshots are attached to the PR or otherwise easy to review;
- devlog is updated according to the repo contract.

## After Study Partner approval

Repeat one direction at a time. The contact sheet shows the required variation. Recommended order:

1. Editorial
2. Interactive 3D
3. PAM Preflight
4. PAM Proof
5. Research Assurance Control Room
6. Research Assurance Lab
7. Experimental Mixed Media
8. final gallery consolidation

Do not force the pages into one visual template. Share only implementation primitives that genuinely repeat: reset, nav/footer mechanics, image loading, accessibility, responsive helpers, and icon treatment.

## User intent / communication

The user is specifically frustrated by base64 artwork, wrong replacement images, HTML that does not match the generated reference, loss of variation, poor phone layouts, and work being called finished before visual verification.

Be exact about what has been verified. Do not say “finished” until desktop and mobile have both been opened and compared visually.

The user does not want to manually upload or convert assets if Work can generate/write them itself.

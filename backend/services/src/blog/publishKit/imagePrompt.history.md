# Hero image prompt history

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-22 |
| **Created** | 2026-05-22 |
| **Last updated** | 2026-05-22 |

Active version: **`HERO_IMAGE_PROMPT_VERSION`** in `imagePrompt.ts` (currently **0.3**).

Bump the constant whenever you change prompt lines in `buildHeroImagePrompt` (auto-tagged in API output as `[hero prompt vX.Y]`).

## v0.3 (current)

- **Single square (1:1) master** hero for all formats — one OpenRouter call, then crop + overlay per size
- Square composition with safe center crop to cover (3:2) and OG (1.91:1)
- List/social thumbs: square 640×640 / 800×800 crops from composites
- Typography scales per output dimensions in `renderOverlay.ts`

## v0.2

- Flat vector / cartoon characters, friendly and approachable
- Line art accents, icons, light graphic shapes
- Category-specific scenes (`FAMILY_SCENE`)
- Respects admin **Visual style** preset (minimal / bold / line_art)
- Still: no text/logos in generated art; bottom third clear for overlay

## v0.1 (superseded — 2026-05-22)

Used before v0.2; kept here for reference if you need to revert tone.

```
Professional blog hero cover photograph or cinematic digital art.
Topic: {title}. Category: {label}.
Themes: {tags}.
Color palette anchored on {accentColor}, harmonious gradients.
{FAMILY_MOOD — editorial photo / diagram blueprint / neural nodes / grid}
Wide hero composition with negative space at the bottom third for text overlay.
No text, no letters, no words, no logos, no watermarks, no UI mockups.
High quality, natural lighting, not cheesy stock photo, not cartoon.
```

`FAMILY_MOOD` (v0.1):

| Family | Mood |
|--------|------|
| editorial | soft editorial photography, calm workspace |
| diagram | abstract technical diagram, blueprint feel |
| nodes | neural network shapes, AI lab atmosphere |
| grid | structured grid, modular blocks |

To roll back: set `HERO_IMAGE_PROMPT_VERSION = '0.1'` and restore the v0.1 builder from git history or this doc.

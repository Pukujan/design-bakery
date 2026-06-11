# Agent devlog — Blog page motion & decor

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-20 |
| **Created** | 2026-05-20 |
| **Last updated** | 2026-05-20 |

**For Cursor agents.** Read this **before** changing blog list/detail animations, `BlogPageMotion`, or related motion props.

### Revision history

| Date | Notes |
|------|--------|
| 2026-05-20 | `BlogPageMotion` shared presets; list + detail wiring |

**In-repo pointers:**
- `src/app/components/BlogPageMotion.tsx` — file header comment + all shared motion API
- `src/app/modules/engineering/BlogListPage/BlogListPage.tsx` — list page usage
- `src/app/modules/engineering/BlogDetailPage/BlogDetailPage.tsx` — detail page usage
- `.cursor/rules/blog-motion.mdc` — auto-attached when editing those files

**Test URLs (first free port from 5300):**
- List: http://localhost:5300/endtoend-engineer/blogs
- Detail: http://localhost:5300/endtoend-engineer/blogs/1

---

## Design goal

Match **engineering home** energy: floating bakery/flowers/stars, scroll reveals, and **jumpy** hover/tap on cards and buttons — without duplicating decor markup in every page file.

Home reference sections: `EngineeringProjects`, `EngineeringInsights`, `EngineeringSkills`, `Contact` (same float + `whileHover` patterns).

---

## Canonical module: `BlogPageMotion.tsx`

| Export | Purpose |
|--------|---------|
| `BlogPageDecor` | Background blobs + floating items + stars + flowers |
| `PlayfulBlogTitle` | Letter bounce on list hero (`BLOGS`) |
| `blogCardMotion` | `{ whileHover, whileTap }` for article/similar cards |
| `blogButtonMotion` | Category pills, sidebar buttons |
| `blogReveal` | `initial` / `whileInView` preset for sections |
| `MotionSection` | Wrapper applying `blogReveal` + optional delay |

### `BlogPageDecor` props

```tsx
<BlogPageDecor variant="list" seed={`blogs-${selectedCategory}`} />
<BlogPageDecor variant="detail" seed={blogId ?? blog.id} />
```

- **`variant`:** `'list'` | `'detail'` — different slot layouts and sizes
- **`seed`:** string | number — **deterministic** RNG for float durations, blob colors, star colors (same seed → same layout; change seed → fresh feel)

**Do not** copy-paste individual `motion.div` + `Cupcake` blocks into blog pages; extend `BlogPageMotion` instead.

---

## Motion presets (do not drift)

```ts
blogCardMotion   → hover: y -12, scale 1.06, rotate 1.5° | tap: scale 0.94
blogButtonMotion → hover: scale 1.05, y -3           | tap: scale 0.95
blogReveal       → opacity 0→1, y 30→0, viewport once, margin -40px
```

List grid cards use **`animate`** + stagger delay (filter changes re-animate). Detail sections use **`MotionSection`** / `whileInView` for scroll reveal.

---

## Where each page uses motion

### Blog list (`BlogListPage.tsx`)

| Element | Motion |
|---------|--------|
| Background | `<BlogPageDecor variant="list" seed={...} />` |
| Title | `<PlayfulBlogTitle text="BLOGS" />` |
| Category pills | `motion.div` + `blogButtonMotion` |
| Article cards | `motion.div` + `blogCardMotion` + stagger `animate` |

### Blog detail (`BlogDetailPage.tsx` in extras)

| Element | Motion |
|---------|--------|
| Background | `<BlogPageDecor variant="detail" seed={blogId} />` |
| Back button | spring entrance + `whileHover` / `whileTap` |
| Header / article / similar | `MotionSection` |
| Article card | light `whileHover={{ y: -4 }}` wrapper |
| Similar cards | `blogCardMotion` + stagger `whileInView` |
| Sidebar categories & quick actions | `blogButtonMotion` |

---

## Safe changes

| Want | Do |
|------|-----|
| New floating item type | Add to `FLOAT_SLOTS` / `renderBakery` in `BlogPageMotion.tsx` |
| Stronger/weaker card jump | Tune `blogCardMotion` constants only |
| New scroll section | Wrap in `<MotionSection delay={...}>` |
| Different colors per visit | Change `seed` input (e.g. include `blog.category`) |
| Home insights strip parity | Import `BlogPageDecor` into `EngineeringInsights.tsx` (optional) |

---

## Avoid

1. **Inlining home decor** in blog pages — duplicates drift from home sections
2. **`playful-text` CSS** on blog titles — design-hero only; blog uses `PlayfulBlogTitle` (motion)
3. **Disabling `pointer-events-none`** on decor wrapper — decor must not block clicks
4. **Removing `overflow-hidden`** on detail `<section>` — floats bleed without it
5. **Heavy motion on markdown prose** — keep motion on cards/chrome, not every heading inside article body

---

## Dependencies

- `motion/react` (same as rest of app)
- Shared visuals: `GraphicElements`, `BakeryItems`, `FlowerCharacter` from `src/app/components/`

---

## Related docs

- `guidelines/agent-devlog-index.md` — master index + agent workflow
- `guidelines/agent-devlog-mermaid.md` — blog detail diagrams (separate concern)
- `guidelines/dev-log-2026-05-20.md` — session log when motion was added

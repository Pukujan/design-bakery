# May 28, 2026 at 10:54 AM EDT — UX Audit

| Field | Value |
|-------|--------|
| **Created** | May 28, 2026 at 10:54 AM EDT |
| **Last updated** | May 28, 2026 at 10:54 AM EDT |
| **Scope** | Blog list, blog cards, carousel, category sidebar/nav — public UX flow |
| **Session** | Cursor agent transcript `71c5069c-e237-4143-88a3-6172a539a5ff` |

---

## Table of contents

- [Blog list — search & density](#blog-list--search--density)
- [Blog list — carousel layout](#blog-list--carousel-layout)
- [Blog list — scroll, wheel & arrows](#blog-list--scroll-wheel--arrows)
- [Blog card — cover image](#blog-card--cover-image)
- [Blog card — layout & alignment](#blog-card--layout--alignment)
- [Blog list — responsive & bleed](#blog-list--responsive--bleed)
- [Blog detail — category navigation](#blog-detail--category-navigation)
- [Open UX items](#open-ux-items)
- [Files touched (session)](#files-touched-session)

---

## Blog list — search & density

### Blog list — search & density — Thursday, May 28, 2026 — morning (session)

> *i think the blog page is starting to be too crowded, add pagination and a search query*

**Agent summary:**  
Added client-side search and paginated the blog list to reduce visual clutter. Introduced `blogListFilters.ts` and wired search into `BlogListPage.tsx`.

```text
blogListFilters.ts — filterBlogsBySearch, paginateItems
BlogListPage.tsx — search input, filtered blogs state
```

---

### Blog list — search & density — Thursday, May 28, 2026 — morning (session)

> *hide descriptions from this page to make the cards smaller*

**Agent summary:**  
Removed excerpt/description from list cards so each card is shorter and the grid feels less crowded. Updated `BlogPostCard.tsx` (and list wiring) to title + meta + tags only.

```text
BlogPostCard.tsx — dropped excerpt block from card body
```

---

## Blog list — carousel layout

### Blog list — carousel layout — Thursday, May 28, 2026 — morning (session)

> *instead of 3x3 grid, and pagination use 3x1 grid and make it a carousel instead*

**Agent summary:**  
Replaced the 3×3 paginated grid with a horizontal Embla carousel showing three cards per viewport on desktop. Added `BlogListCarousel.tsx`, carousel chunk helpers, and desktop/mobile split.

```text
BlogListCarousel.tsx — new module
blogListFilters.ts — BLOG_CAROUSEL_SLIDE_SIZE
BlogListPage.tsx — BlogListCarousel replaces grid pagination
```

---

### Blog list — carousel layout — Thursday, May 28, 2026 — morning (session)

> *in the carousel, the overflow cutoff is really bad, can you fix that*

**Agent summary:**  
Adjusted carousel CSS so horizontal clipping keeps slide shadows and hover lift visible (`overflow-y: visible` on track, clip only on X). Tuned `globals.css` `.blog-list-carousel` rules.

```text
globals.css — .blog-list-carousel overflow rules
BlogListCarousel.tsx — carousel wrapper classes
```

---

### Blog list — carousel layout — Thursday, May 28, 2026 — morning (session)

> *you can remove the carousel function from mobile screen and just keep it infinite scrolling, do add a go to top floating button and make sure lazy loading is there*

**Agent summary:**  
Mobile uses vertical infinite scroll with intersection-observer batching; desktop keeps the carousel. Added `BlogScrollToTopFab.tsx`, `useLoadMoreOnScroll.ts`, and lazy cover loading via existing `BlogCoverImage` in-view hook.

```text
BlogListCarousel.tsx — md:hidden feed vs hidden md:block carousel
BlogScrollToTopFab.tsx, useLoadMoreOnScroll.ts — new
blogListFilters.ts — BLOG_MOBILE_BATCH_SIZE
```

---

### Blog list — carousel layout — Thursday, May 28, 2026 — morning (session)

> *fix these gapping issue between the carousel, the carousel scroll is not working like drag and drop and i dont just mean same height per carousel i mean same height acrolls all card*

**Agent summary:**  
Refactored to one Embla slide per card, uniform 40px gaps (`!pl-10` / `!-ml-10`), and `items-stretch` so all visible cards share height. Added `blogCarouselLayout.ts` for shared basis/gap constants.

```text
blogCarouselLayout.ts — BLOG_CAROUSEL_GAP_*, SLIDE_BASIS_CLASS
BlogListCarousel.tsx — per-card CarouselItem, stretch row
```

---

## Blog list — scroll, wheel & arrows

### Blog list — scroll, wheel & arrows — Thursday, May 28, 2026 — morning (session)

> *the carousel currently requires click and drag, can we make it so the scrolling on the carousel does sideways scrolling for the carousel with an exit function that's similar to how we did it in mermaid chart in blogs-details page, also increase spacing size on the carousel gap*

**Agent summary:**  
Added horizontal wheel handling and increased inter-card gap to 40px. Introduced `useBlogCarouselWheel.ts` (later fixed to use Embla API, not `scrollLeft`).

```text
useBlogCarouselWheel.ts — wheel → scroll (v1)
blogCarouselLayout.ts — BLOG_CAROUSEL_GAP_PX = 40
```

---

### Blog list — scroll, wheel & arrows — Thursday, May 28, 2026 — morning (session)

> *actually the scrholl feature is very weird, can you fix it and make it the scroll has to be sideways for sideways scrolling, and default top down scrolling doesnt affect it?*

**Agent summary:**  
Wheel handler only reacts when `|deltaX| > |deltaY|` (plus Shift+vertical fallback) so vertical page scroll is unchanged. `preventDefault` only on horizontal intent.

```text
useBlogCarouselWheel.ts — deltaX vs deltaY gate, passive: false
globals.css — overscroll-behavior on carousel viewport
```

---

### Blog list — scroll, wheel & arrows — Thursday, May 28, 2026 — morning (session)

> *also a small scroll scrolls it way too much right now, can you fix it*  
> *like make it smooth enough to make it feel like its drag scrolling or swiping*

**Agent summary:**  
Tuned wheel to damped, one-slide-per-gesture with cooldown instead of multi-slide jumps. Iterated `WHEEL_DELTA_SCALE`, threshold, and reset pending delta after each step.

```text
useBlogCarouselWheel.ts — threshold 120, scale 0.28, cooldown 360ms, 1 step/burst
```

---

### Blog list — scroll, wheel & arrows — Thursday, May 28, 2026 — morning (session)

> *still issues and side scroll not working*

**Agent summary:**  
Root cause: wheel code set `container.scrollLeft` but Embla uses transforms. Switched to `api.scrollNext()` / `scrollPrev()`, fixed `!pl-10` gap overrides, and `watchDrag` for card vs button targets.

```text
useBlogCarouselWheel.ts — Embla scrollNext/Prev
blogCarouselLayout.ts — !pl-10, !-ml-10
BlogListCarousel.tsx — dragFree: false, keepSnaps, watchDrag
```

---

### Blog list — scroll, wheel & arrows — Thursday, May 28, 2026 — late morning (session)

> *maybe add a transparent arrow button over on the right and left size that goes over the cards as z index +1 so its more ux*

**Agent summary:**  
Re-added prev/next as frosted overlay buttons (`z-index: 11`) on the carousel edges without shrinking the track. Styles in `globals.css` `.blog-list-carousel-nav`.

```text
BlogListCarousel.tsx — overlay ChevronLeft/Right buttons
globals.css — .blog-list-carousel-nav*
```

---

## Blog card — cover image

### Blog card — cover image — Thursday, May 28, 2026 — morning (session)

> *CAN WE fix it so the cover picture is always fully visible?*

**Agent summary:**  
List cards use full cover URL with `object-contain` (`coverFit="full"`) instead of square thumbnails; backend thumbnail resize uses `fit: contain` for new publishes. Hero/detail also use contain.

```text
BlogCoverImage.tsx — coverFit full, resolveBlogCoverUrl on card
imageDerivatives.ts — resizeCoverThumbnail contain
globals.css — .blog-cover-shell--card-full
```

---

### Blog card — cover image — Thursday, May 28, 2026 — morning (session)

> *is there fixed dimension in the pictures itself? why is it being cut off like this?*

**Agent summary:**  
Explained 640×640 thumbnail `cover` crop vs list using full cover; aligned list to show full artwork and documented publish pipeline behavior.

```text
(imageDerivatives + BlogCoverImage — same as above)
```

---

### Blog card — cover image — Thursday, May 28, 2026 — late morning (session)

> *fix this cover image cut off issue so it gets cutoff by the outline*  
> *make it so read more and tags are bottom aligned instead*

**Agent summary:**  
Added `coverFit="cover"` — fixed 16:10 frame, `overflow-hidden` on bordered shell, `object-fit: cover` so image fills the outline. Card body uses flex + `mt-auto` footer for tags and CTA.

```text
BlogCoverImage.tsx — coverFit cover, .blog-cover-shell--card-cover
BlogPostCard.tsx — flex column, mt-auto on tags + Read Full Article
globals.css — .blog-cover-img--card-cover
```

---

## Blog card — layout & alignment

### Blog card — layout & alignment — Thursday, May 28, 2026 — morning (session)

> *i think you can add min height to each section of the cards so it is always the same height and same place maybe centered vertically*

**Agent summary:**  
Experiment: per-section `min-height` and desktop `h-[32rem]` on cards for row alignment (accent line, meta, title, tags).

```text
BlogPostCard.tsx — min-h sections, md:h-[32rem]
blogCarouselLayout.ts — BLOG_CAROUSEL_CARD_HEIGHT_CLASS
```

---

### Blog card — layout & alignment — Thursday, May 28, 2026 — morning (session)

> *dont use min height in the cover image btw, maybe we can add another container so the line starts from same vertical height no matter what the size of the cover image is*  
> *i think u should use figma mcp for these changes*  
> *also more issue pls check and fix*

**Agent summary:**  
Tried fixed cover slot (`h-[11.5rem]`), CSS grid rows, and `embedded` cover mode; attempted Figma capture (no file URL in repo). Partial alignment gains; user later asked to revert card layout.

```text
BlogPostCard.tsx — cover slot + grid
BlogCoverImage.tsx — embedded prop
blogCarouselLayout.ts — BLOG_CARD_BODY_GRID_CLASS
```

---

### Blog card — layout & alignment — Thursday, May 28, 2026 — late morning (session)

> *i think you should reset how each card is viewed to how it was upto where we fixed the cover picture cut off issue*

**Agent summary:**  
Reverted card to natural-flow layout (cover → accent → meta → title → tags → CTA) while keeping `coverFit="cover"` clip and bottom-aligned footer. Removed grid, fixed slot, and embedded cover.

```text
BlogPostCard.tsx — simple stack restored; coverFit cover kept
blogCarouselLayout.ts — removed grid/slot constants
BlogCoverImage.tsx — removed embedded mode
```

---

### Blog card — layout & alignment — Thursday, May 28, 2026 — late morning (session)

> *also add extra padding on. the bottom of the card container as there is weird cut off point right now*

**Agent summary:**  
Added bottom padding on bleed wrapper, Embla track, and progress area so 8px card shadows are not clipped by the carousel viewport.

```text
BlogListCarousel.tsx — pb-16 md:pb-20 on bleed
globals.css — carousel-content padding-bottom 2.75rem
```

---

## Blog list — responsive & bleed

### Blog list — responsive & bleed — Thursday, May 28, 2026 — late morning (session)

> *maybe show only 2 cards for smaller screens, you can now remove the side arrow buttons and make it the card container full screen upto browser's edges*  
> *mobile view still stays same btw*

**Agent summary:**  
md–lg shows 2 cards (`basis calc (100%-2.5rem)/2`); lg+ shows 3. Carousel breaks out to viewport width; removed side gutter arrows (later re-added as overlays). Mobile feed unchanged.

```text
blogCarouselLayout.ts — responsive basis, BLOG_CAROUSEL_BLEED_CLASS
useBlogCarouselVisibleCount.ts — 2 vs 3 at 1024px
BlogListPage.tsx — md:overflow-x-visible for bleed
```

---

## Blog detail — category navigation

### Blog detail — category navigation — Thursday, May 28, 2026 — morning (session)

> *also the cateogry add scroll overflow in mobile version while collapsible dropdown in bigger screen… quick action should be on top of the category… category selection is working proper…*

**Agent summary:**  
Built `BlogCategoryNav` (sidebar + mobile menu), fixed `?category=` routing, moved quick actions above categories on detail, mobile horizontal scroll for topic pills on list page.

```text
BlogCategoryNav.tsx, blogCategoryNav.ts — new
BlogDetailPage.tsx — sidebar nav, quick actions order
BlogListPage.tsx — category filter URL fix
```

---

### Blog detail — category navigation — Thursday, May 28, 2026 — late morning (session)

> *instead of this maybe its better to just keep it scrollable instead just a scroll overflow as well as show a mini scrollbar inside to help people navigate*

**Agent summary:**  
Replaced “Show more / fewer categories” expand/collapse with a single scrollable list and `scrollbar-mini` styling for sidebar and menu layouts.

```text
BlogCategoryNav.tsx — scroll container, removed expand UI
blogCategoryNav.ts — removed partitionCategoriesForNav
globals.css — .scrollbar-mini
```

---

### Blog detail — category navigation — Thursday, May 28, 2026 at 10:54 AM EDT (session)

> *the scrollbar needs to be always visible, also the buttons expand when hovered, need some buffer for the container as it cuts off awkwardly right now*

**Agent summary:**  
Forced `overflow-y-scroll`, `scrollbar-mini--always` with persistent track, padding shell for hover shadow, softer `categoryNavButtonMotion`, and `overflow-visible` on the Categories card.

```text
BlogCategoryNav.tsx — shell + categoryNavButtonMotion
globals.css — .scrollbar-mini--always, .blog-category-nav-*
BlogDetailPage.tsx — Card overflow-visible
```

---

## Open UX items

- **Cover on list:** `cover` mode clips artwork (by design); detail hero still shows full image with `contain` — confirm product preference if list should ever show full artwork again.
- **Figma sync:** No in-repo Figma URL; capture-to-new-file was started but not completed — link a file for design parity checks.
- **macOS overlay scrollbars:** Category track is always painted in CSS; system may still auto-hide thumb until scroll on some Safari settings.
- **Carousel at ~1000px:** Verify 2-up vs 3-up breakpoint and overlay arrows do not block first/last card CTAs on narrow desktop.

---

## Files touched (session)

| Area | Files |
|------|--------|
| List page | `BlogListPage.tsx`, `BlogListCarousel.tsx`, `BlogListFilters.ts`, `BlogScrollToTopFab.tsx` |
| Carousel | `blogCarouselLayout.ts`, `useBlogCarouselWheel.ts`, `useBlogCarouselVisibleCount.ts`, `useLoadMoreOnScroll.ts` |
| Cards / cover | `BlogPostCard.tsx`, `BlogCoverImage.tsx`, `globals.css` |
| Detail nav | `BlogCategoryNav.tsx`, `blogCategoryNav.ts`, `BlogDetailPage.tsx` |
| Backend (covers) | `backend/.../imageDerivatives.ts` |

---

*Re-export prompt: [UX-AUDIT-EXPORT-PROMPT.md](./UX-AUDIT-EXPORT-PROMPT.md)*

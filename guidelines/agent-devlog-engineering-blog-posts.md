# Agent devlog — Engineering blog posts

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-20 |
| **Created** | 2026-05-20 |
| **Last updated** | 2026-05-20 |

**For Cursor agents.** Read before adding or editing posts on the end-to-end engineer blog.

### Revision history

| Date | Notes |
|------|--------|
| 2026-05-20 | Post flow; Mermaid in body; post id 8; Firestore seed |

**List:** http://localhost:5300/endtoend-engineer/blogs (or next free port — Vite log)  
**Detail renderer:** `src/app/modules/engineering/BlogDetailPage/BlogDetailPage.tsx`  
**Canonical data:** Firestore `blog_posts` (edited at `/admin/endtoend-engineer/blog`).  
**Seed source:** `blog-data.json` — merged on the public site; copied into Firestore when the admin Blog editor loads (`syncBlogPostsFromSeed` → doc id `seed-<numericId>`).

---

## Adding a new post (correct flow)

1. **Author markdown** under `src/app/modules/engineering/posts/<slug>.md`.
2. **Append entry** to `blog-data.json` with the next numeric `id`.
3. **Open admin** → `/admin/endtoend-engineer/blog` on the port Vite prints at startup — missing JSON rows sync to Firestore automatically.
4. **Or** create/edit directly in admin (no JSON required for one-off posts).
5. **Category** must exist in `blog-categories.json` / admin categories editor.
6. **Verify** `/endtoend-engineer/blogs/<numericId>`.
7. **Optional SEO & images** (admin Blog Posts editor): `seo.metaTitle`, `seo.metaDescription`, `seo.ogImageUrl`, `coverImageUrl` — cover can mirror OG via checkbox.

Optional helper (from repo root):

```bash
node -e "
const fs=require('fs');
const blogs=JSON.parse(fs.readFileSync('src/app/modules/engineering/blog-data.json','utf8'));
const content='\n'+fs.readFileSync(process.argv[1],'utf8');
const max=blogs.reduce((m,b)=>Math.max(m,b.id),0);
blogs.push({ id: max+1, title: '...', excerpt: '...', date: 'May 2026', readTime: '...', tags: [], category: 'architecture', color: '#A8CC00', author: 'Design Baker', content });
fs.writeFileSync('src/app/modules/engineering/blog-data.json', JSON.stringify(blogs,null,2)+'\n');
" src/app/modules/engineering/posts/your-slug.md
```

Edit the pushed object fields before committing.

---

## Mermaid in post body

Blog detail uses `mermaid.render()` per fenced block. **Prefer vertical diagrams** so narrow/mobile layouts do not clip wide charts.

| Prefer | Avoid on blog posts |
|--------|---------------------|
| `flowchart TD` | `graph LR`, wide `graph TB` with many siblings |
| `sequenceDiagram` | Huge `subgraph` grids |
| Short node labels (`<br/>` for line breaks) | 10+ nodes in one row |

See **`agent-devlog-mermaid.md`** for render/CSS rules — do not change init theme or add post-render SVG hacks.

---

## Post id 8 (regulatory impact databases)

| Field | Value |
|-------|--------|
| **id** | 8 |
| **category** | `architecture` |
| **slug file** | `posts/regulatory-impact-database-architecture.md` |
| **Topic** | Postgres + Qdrant + Neo4j for regulatory `/analyze` demo |

Do not convert diagrams to `graph LR` when editing this post.

---

## Firestore

- **List / insights / nav:** `useBlogData()` → `getBlogSummariesLive()` — metadata only; **5 min** in-memory + localStorage (`blogLocalCache.ts` v2 keys).
- **Detail:** `useBlogPost(id)` → `getBlogByNumericIdLive()` — **always revalidates** from API/Supabase on visit (shows cached body first, then replaces). localStorage TTL **5 min** (not 24h). Compare `updatedAt` from list vs full post to drop stale bodies (#23).
- **Public merge:** JSON + Firestore by **`numericId` only** (Firestore wins on collision).
- **Admin:** `saveBlog()` / `deleteBlog()` call `invalidateBlogCache()`.
- **Public meta:** `BlogPostHead` on detail — reads `blog.seo` + fallbacks to title/excerpt.
- **Cover:** `coverImageUrl` below title; if empty, falls back to `seo.ogImageUrl`.
- **Admin auth:** 10 min idle auto sign-out (`adminAuth.tsx`, `adminSession.ts`).
- **Admin:** `getBlogs()` uses full merge; `syncBlogPostsFromSeed()` writes missing JSON rows to `blog_posts/seed-<numericId>`.
- **Do not** assume `blog-data.json` alone updates production — visit admin blog once after adding a seed row, or call `syncBlogPostsFromSeed()` from admin code.
- **ID collision:** `saveBlog()` calls `ensureUniqueNumericId()` — reassigns on clash. Do **not** hand-pick a `numericId` already used in JSON or Firestore. After a title edit, the post must keep the same `numericId` (merge is keyed by id, not title).
- **Legacy duplicates:** `findBlogByNumericId()` prefers the newest `date` when two rows still share an id until you re-save the admin post (which bumps a clashing id).

---

## Sort order

`sortBlogsByDateDesc()` — newest `date` string first, then higher `id`. Use a recent month/year in `date` so new posts surface at the top.

---

## Test checklist

- [ ] `/endtoend-engineer/blogs` — card appears, correct category chip
- [ ] `/endtoend-engineer/blogs/<id>` — title, TOC anchors, all Mermaid blocks render
- [ ] Manual TOC `1.` / `2.` ordered list shows **numbers**, not ▸ bullets (`BlogDetailPage` `ol` vs `ul` list renderers)
- [ ] Dark mode — diagram borders readable (`.blog-mermaid-chart` in `globals.css`)

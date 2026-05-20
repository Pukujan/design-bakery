# Agent devlog — Engineering blog posts

**For Cursor agents.** Read before adding or editing posts on the end-to-end engineer blog.

**List:** http://localhost:5300/endtoend-engineer/blogs  
**Detail renderer:** `extras/design changes to blog details/app/components/BlogDetailPage.tsx` (via `@blog-detail-v2`)  
**Canonical data:** Firestore `blog_posts` (edited at `/admin/endtoend-engineer/blog`).  
**Seed source:** `blog-data.json` — merged on the public site; copied into Firestore when the admin Blog editor loads (`syncBlogPostsFromSeed` → doc id `seed-<numericId>`).

---

## Adding a new post (correct flow)

1. **Author markdown** under `src/app/modules/engineering/posts/<slug>.md`.
2. **Append entry** to `blog-data.json` with the next numeric `id`.
3. **Open admin** → http://localhost:5300/admin/endtoend-engineer/blog — missing JSON rows sync to Firestore automatically.
4. **Or** create/edit directly in admin (no JSON required for one-off posts).
5. **Category** must exist in `blog-categories.json` / admin categories editor.
6. **Verify** `/endtoend-engineer/blogs/<numericId>`.

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

## Post id 7 (regulatory impact databases)

| Field | Value |
|-------|--------|
| **id** | 7 |
| **category** | `architecture` |
| **slug file** | `posts/regulatory-impact-database-architecture.md` |
| **Topic** | Postgres + Qdrant + Neo4j for regulatory `/analyze` demo |

Do not convert diagrams to `graph LR` when editing this post.

---

## Firestore

- **Public site:** `getBlogDataLive()` merges JSON + Firestore (Firestore wins on same `numericId` + title).
- **Admin:** `getBlogs()` uses the same merge; `syncBlogPostsFromSeed()` writes missing JSON rows to `blog_posts/seed-<numericId>`.
- **Do not** assume `blog-data.json` alone updates production — visit admin blog once after adding a seed row, or call `syncBlogPostsFromSeed()` from admin code.

---

## Sort order

`sortBlogsByDateDesc()` — newest `date` string first, then higher `id`. Use a recent month/year in `date` so new posts surface at the top.

---

## Test checklist

- [ ] `/endtoend-engineer/blogs` — card appears, correct category chip
- [ ] `/endtoend-engineer/blogs/<id>` — title, TOC anchors, all Mermaid blocks render
- [ ] Dark mode — diagram borders readable (`.blog-mermaid-chart` in `globals.css`)

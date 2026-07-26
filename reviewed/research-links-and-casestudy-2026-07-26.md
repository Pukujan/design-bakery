# Research citation links + Cortex case-study cross-links

**Date:** 2026-07-26
**Scope:** every internal link in the 8 research papers and 2 supporting sources, every
external citation URL in those files, and the Cortex case study at
`frontend/public/case-studies/cortex/a/index.html`.
**Verification:** production build (`pnpm --dir frontend run build`) served through a
Vercel-mimicking static server (filesystem first, then catch-all to `/index.html` for
non-`.html` paths) and rendered with headless Chrome. No conclusion below is from reading
code alone; every link status is an HTTP response and every layout claim is a measured
value from the rendered DOM.

---

## 1. Internal citation links

### 1.1 What was already correct

The `href` targets in the papers had already been migrated to extension-less React routes.
Grepping all non-external markdown links found 29 of them across five files and **every
`href` was already correct**. The remaining defects were in link *text*, in unlinked
citations, and in one stale identifier.

### 1.2 Links changed

| File | Line context | Before | After | Why |
|---|---|---|---|---|
| `content/db-r-2026-002.md` | References [3] | link text `/research/papers/db-r-2026-004.html` | `/research/papers/db-r-2026-004` | The visible text advertised a static path that no longer exists. The href was already right, so it read as a dead URL while working. |
| `content/db-r-2026-002.md` | References [10] | link text `/research/papers/db-r-2026-001.html` | `/research/papers/db-r-2026-001` | Same defect. |
| `content/db-r-2026-007.md` | §13 Provenance | bare `` `docs/research/ai-emotional-development-landscape-2026-07-23.md` `` | link to `/research/sources/ai-emotional-development-landscape` | `researchPapers.ts` publishes this note as a supporting source and its summary says "Cited by db-r-2026-007", but the paper never linked it. The citation now resolves to something a reader can open. |
| `content/db-r-2026-007.md` | §13 Provenance | bare `` `docs/research/self-learning-ai-survey-2026-07-23.md` `` | link to `/research/sources/self-learning-ai-survey` | Same. |
| `content/db-r-2026-007.md` | References [16] | plain text `db-r-2026-001, 2026 (pending)` | same text plus a link to `/research/papers/db-r-2026-001` | The one cross-paper citation in 007 was unlinked while every other paper links its siblings. |
| `content/db-r-2026-008.md` | "Cite as" footer | `Design Bakery Research db-r-2026-005 (pending)` | `Design Bakery Research db-r-2026-008 (pending; drafted as db-r-2026-005, reassigned 2026-07-26 to resolve an id collision)` | **Stale self-identifier from the 002 to 005 to 008 renumbering.** The page's own citation line told readers to cite it under an id that belongs to a different paper (NSCCP). The registry `bibtex` was already correct; the body was not. |
| `public/case-studies/cortex/a/flowchart.html` | line 332 | `href="/research/papers/db-r-2026-001.html"` | `href="/research/papers/db-r-2026-001"` | **Genuinely dead link on a live page** (404 confirmed). The static render it pointed at was deleted in the React migration. |

### 1.3 Cross-reference targets verified against `researchPapers.ts`

Every `db-r-2026-NNN` referenced anywhere in the corpus was checked against the registry.
Result: **no reference points at a non-existent id.** Referenced ids are 001, 002, 003,
004, 008; registered ids are 001 through 008. The known id-collision history left exactly
one stale artefact, the "Cite as" line above, plus the orphaned `.bib` file in §1.5.

The two remaining mentions of `db-r-2026-005` inside `db-r-2026-008.md` are in the
"Identifier note" and its editorial addendum, which narrate the renumbering. They are
deliberate history, correct as written, and were left alone.

### 1.4 Dead links found, and disposition

| Link | Status | Disposition |
|---|---|---|
| `/research/papers/db-r-2026-001.html` (in `flowchart.html`) | 404 | **Fixed** to the React route. |
| `specs.html`, `flowchart.html`, `case-study.html`, `index.html` as *relative* hrefs in the case-study navbar | **404 at two of the three entry URLs** | **Fixed** (see §3.2). |
| `https://anonymous.4open.science/r/PsychoAgent-19DD` | HTTP 401 via curl, 403 via browser fetch | **Reported, not replaced.** No substitute invented. The source file now says the link is unreachable as of 2026-07-26 so the claim "code available" is not left standing. |

### 1.5 Orphaned static BibTeX files, removed

`frontend/public/research/papers/*.bib` (5 files) survived the React migration. They were:

- **unreferenced** by anything, the React paper page renders BibTeX from `researchPapers.ts`;
- **pointing at deleted URLs**, every one had `url = {.../db-r-2026-NNN.html}`;
- **actively wrong in one case**, `db-r-2026-005.bib` carried paper 008's title and abstract
  under `number = {db-r-2026-005}`, which is the id the registry assigns to the NSCCP paper.
  Anyone finding that file would have mis-cited two papers at once.

They are the last remnant of the static system the module docstring says no longer exists
("There is no second system"). **Deleted.** This is the one judgement call in this pass and
is trivially reversible with `git revert`; flagging it explicitly so the owner can say no.

---

## 2. External citation URLs

All 28 distinct external URLs in the papers and sources were requested (curl, following
redirects, browser user-agent), and the ambiguous ones were re-checked with a real browser
fetch. **No URL was edited**; nothing was fabricated as a replacement.

**25 of 28 return HTTP 200.** This includes every future-dated 2026 arXiv identifier, which
was the most likely place for an invented citation to hide. Each was opened and its title
read back:

| arXiv id | Title returned | Verdict |
|---|---|---|
| 2604.02460 | Single-Agent LLMs Outperform Multi-Agent Systems on Multi-Hop Reasoning Under Equal Thinking Token Budgets | real |
| 2606.20158 | N-Version Programming with Coding Agents | real |
| 2606.28430 | Building to the Test: Coding Agents Deliver What You Check, Not What You Requested | real |
| 2607.02808 | A Systematic Methodology for Evaluating Failure Independence in LLM-Generated Code | real |

The three non-200 responses:

| URL | Code | Finding |
|---|---|---|
| `https://dl.acm.org/doi/10.1145/3143561` | 403 | **Not dead.** `https://doi.org/10.1145/3143561` resolves to exactly this URL; ACM returns 403 to non-browser clients. No change. |
| `https://mutationtesting.uni.lu/survey.pdf` | curl 000 / HEAD timeout | **Not dead.** A browser GET returned a valid 1.1 MB PDF. The host does not answer HEAD. No change. |
| `https://anonymous.4open.science/r/PsychoAgent-19DD` | 401 / 403 | **Unreachable.** Anonymous-review mirror, likely expired. Annotated in the source file, not replaced. |

No typos were found, so no external URL was rewritten.

**Out of scope but worth recording:** papers 005 and 006 cite exclusively by bare arXiv id
with no hyperlink, and 003's abstract already warns that some 2026 arXiv identifiers in it
are AI-suggested and unverified. Those identifiers were not systematically resolved here;
that is a separate verification pass and the papers' own `pending` status covers it.

---

## 3. Cortex case study

### 3.1 What was added

A new `#research` section in `frontend/public/case-studies/cortex/a/index.html`, placed
between `#evidence` (prior art) and `#status` (self-hosting), which is the point in the
argument where the reader has just been told the mechanisms are decades-proven and is most
likely to ask "so where is your version written down".

- **Eyebrow:** `WRITTEN UP · DESIGN BAKERY RESEARCH`
- **Heading:** "The design is on the record, not just in the product."
- **Four cards**, each a link, each mapped to a section the reader has already passed:

| Card | Route | Ties back to |
|---|---|---|
| 002 Deny-by-default authorization for tool-using agents | `/research/papers/db-r-2026-002` | the seven kernel mechanisms |
| 003 Mechanically constraining an LLM orchestrator | `/research/papers/db-r-2026-003` | the "inversion" section |
| 004 Black-box and grey-box validation of agent work | `/research/papers/db-r-2026-004` | the mutant/holdout gates |
| 008 Verification independence without opinion aggregation | `/research/papers/db-r-2026-008` | the sealed-holdout claim in `#status` |

- **A closing note** linking `/research/papers/db-r-2026-001` (composition status and
  evidence boundaries) and `/research`. Paper 001 is the honesty boundary, so it belongs in
  the note rather than as a fifth card.
- Every card carries a `WORKING PAPER · PENDING` chip. The papers are not owner-approved and
  the case study must not imply otherwise.
- No em dash anywhere in the added copy.

**Style:** the section reuses the page's existing `.refs` / `.ref` card system rather than
introducing anything new. The added CSS only supplies what a *link* card needs that a static
card does not: a hover affordance, an inline arrow, and the status chip. Measured proof that
it matches, computed styles of the new card versus a pre-existing prior-art card, in both
themes and at both widths:

```
theme=dark   NEW   border=rgb(34,43,61)    bg=color(srgb .0706 .0941 .1490/.92) radius=12px pad=20px id=rgb(245,182,64) title=rgb(242,245,250)
theme=dark   PRIOR border=rgb(34,43,61)    bg=color(srgb .0706 .0941 .1490/.92) radius=12px pad=20px id=rgb(245,182,64) title=rgb(242,245,250)
theme=light  NEW   border=rgb(207,214,219) bg=color(srgb 1 1 1/.92)             radius=12px pad=20px id=rgb(183,103,0)  title=rgb(12,17,20)
theme=light  PRIOR border=rgb(207,214,219) bg=color(srgb 1 1 1/.92)             radius=12px pad=20px id=rgb(183,103,0)  title=rgb(12,17,20)
MATCHES_PRIOR_ART=YES  (dark 390px, dark 1180px, light 390px, light 1180px)
```

One defect was caught by looking at the render rather than the code: with the title `h4` as
a flex container, the trailing arrow dropped onto its own line as soon as a title wrapped at
390px. Changed to an inline span with `white-space:nowrap`; `arrowInlineWithTitle=YES` at all
four theme/width combinations.

### 3.2 A real dead-link bug found while auditing, and fixed

The case-study navbar used **relative** hrefs (`specs.html`, `flowchart.html`,
`case-study.html`, `index.html`). The page is served at three different URLs by the
`vercel.json` rewrites, and relative resolution differs at each:

| Entry URL | `specs.html` resolves to | Result |
|---|---|---|
| `/case-studies/cortex/a/` | `/case-studies/cortex/a/specs.html` | 200 |
| `/case-studies/cortex/` | `/case-studies/cortex/specs.html` | 200 but a **different file** |
| `/case-studies/cortex` (the canonical rewrite) | `/case-studies/specs.html` | **404** |

`flowchart.html` and `case-study.html` 404 at two of the three entry URLs, and the brand
link 404s as well. Anyone reaching the case study at `/case-studies/cortex`, which is the
short URL and the one the rewrite exists to serve, hit a 404 on every nav click.

Fixed by making all 31 nav, brand and CTA hrefs absolute (`/case-studies/cortex/a/*.html`)
across all four `a/` pages. This matches the convention already used by
`cortex/index.html`, `cortex/b/index.html` and `cortex/c/index.html`, which were already
absolute. Verified: zero relative nav hrefs remain, and all four pages return 200 from
every entry URL.

Also removed the single em dash on the page (in a CSS comment), so the case study is now
em-dash-free too.

### 3.3 Mobile regression check

The 2026-07-26 `min-width:0` fix is intact. Measured at a 390px viewport:

```
/case-studies/cortex   viewport=375  documentElement.scrollWidth=375  body.scrollWidth=375
                       HORIZONTAL_PAGE_OVERFLOW=NO
```

25 elements are wider than the viewport, all of them the pre-existing `.cmp-inner`
comparison table and its cells, which live inside `.cmp{overflow-x:auto}` by design and
scroll in their own box. The page itself does not scroll horizontally, in either theme. The
new section adds nothing to that list: its grid collapses to one column at 760px and its
flex child carries `min-width:0`.

---

## 4. Render verification output

Build: `pnpm --dir frontend run build` → `✓ built in 49.23s`, no errors.
Server: filesystem first, `vercel.json`'s explicit cortex rewrites, then catch-all to
`/index.html` for non-`.html` paths. Renderer:
`chrome.exe --headless --disable-gpu --no-sandbox --virtual-time-budget=9000 --dump-dom`.

```
=== RENDER (desktop 1280) ===
/research                                            bytes=31016   emdash=0   notfound=0
/research/papers/db-r-2026-001                       bytes=18683   emdash=0   notfound=0
/research/papers/db-r-2026-002                       bytes=32283   emdash=0   notfound=0
/research/papers/db-r-2026-003                       bytes=29695   emdash=0   notfound=0
/research/papers/db-r-2026-004                       bytes=41962   emdash=0   notfound=0
/research/papers/db-r-2026-005                       bytes=62240   emdash=0   notfound=0
/research/papers/db-r-2026-006                       bytes=54512   emdash=0   notfound=0
/research/papers/db-r-2026-007                       bytes=29007   emdash=0   notfound=0
/research/papers/db-r-2026-008                       bytes=100168  emdash=0   notfound=0
/research/sources/ai-emotional-development-landscape bytes=25987   emdash=0   notfound=0
/research/sources/self-learning-ai-survey            bytes=23058   emdash=0   notfound=0
/case-studies/cortex                                 bytes=43486   emdash=0   notfound=0
/case-studies/cortex/                                bytes=43486   emdash=0   notfound=0
/case-studies/cortex/a/                              bytes=43486   emdash=0   notfound=0
/case-studies/cortex/a/specs.html                    bytes=33033   emdash=1   notfound=0
/case-studies/cortex/a/flowchart.html                bytes=65333   emdash=7   notfound=0
/case-studies/cortex/a/case-study.html               bytes=89271   emdash=52  notfound=0

=== INTERNAL LINK TARGETS (extracted from the rendered DOM) ===
OK 200 /                                              OK 200 /research/papers/db-r-2026-001
OK 200 /blogs                                         OK 200 /research/papers/db-r-2026-002
OK 200 /case-studies/cortex/                          OK 200 /research/papers/db-r-2026-003
OK 200 /case-studies/cortex/a/                        OK 200 /research/papers/db-r-2026-004
OK 200 /case-studies/cortex/a/case-study.html         OK 200 /research/papers/db-r-2026-005
OK 200 /case-studies/cortex/a/flowchart.html          OK 200 /research/papers/db-r-2026-006
OK 200 /case-studies/cortex/a/index.html              OK 200 /research/papers/db-r-2026-007
OK 200 /case-studies/cortex/a/specs.html              OK 200 /research/papers/db-r-2026-008
OK 200 /case-studies/cortex/b/                        OK 200 /research/sources/ai-emotional-development-landscape
OK 200 /case-studies/cortex/c/                        OK 200 /research/sources/self-learning-ai-survey
OK 200 /research

DEAD LINKS: 0

=== RELATIVE-LINK RESOLUTION CHECK ===
(no relative nav hrefs remain)

=== NARROW VIEWPORT 390px ===
/case-studies/cortex             HORIZONTAL_PAGE_OVERFLOW=NO
/case-studies/cortex/a/specs.html HORIZONTAL_PAGE_OVERFLOW=NO
```

All 12 research routes render with real content, **zero em dashes**, and no not-found
state. All 21 distinct internal link targets return 200. The em dashes still counted on
`specs.html` (1), `flowchart.html` (7) and `case-study.html` (52) are pre-existing prose on
the static case-study sub-pages; the no-em-dash rule was scoped to the research papers, and
those three files were not rewritten. That is the one piece of tidying deliberately left
undone, flagged here rather than done silently.

Screenshots reviewed: `#research` at 1200px dark, and at 390px light. Both render the four
cards in the page's own card style with correct spacing, wrapping and chip placement.

---

## 5. Not changed, deliberately

- **`sitemap.xml` lists no research routes.** It also lists no stale ones, so nothing is
  broken. Adding eight `pending` working papers to the sitemap is a publication decision,
  not a link fix, and is the owner's call.
- **Papers 005 and 006 have no "Related work in this series" section**, unlike 002, 003, 004
  and 008. Adding one would be authoring, not link repair.
- **`db-r-2026-008.md`'s identifier note refers to `catalog.js`**, a file the React migration
  deleted. It is dated historical narrative and the addendum directly below it explains the
  migration, so it reads correctly. Left as written.

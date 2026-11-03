# TASK-DB-0129: cite a section

## Goal
When AI Pujan talks about a blog post, project or paper he can point at a specific section: the page scrolls slowly to its heading, the moon taps it, and a quoted passage is highlighted. It follows posts added, renamed or deleted in the database with no hand tagging, and he never points at a heading that is not there.

## Done
- Anchors: `headingAnchors.ts` (a byte-for-byte copy in `backend/src/copilot/` and `frontend/src/app/lib/`, the test fails if they drift) makes an anchor from the heading text: markdown stripped, lower case, unicode letters and digits kept, punctuation dropped; repeats get `-2`, `-3` in reading order. Edits to body text never move an anchor.
- Pages: `Article` (blog posts and research papers, the live paper route is `PaperPage`) gives its headings their ids after render through `applyHeadingIds`, and the contents list (`lab/toc.ts`) uses the same function so its links match. The project page's four boxes have fixed ids (`what-it-is`, `highlights`, `built-with`, `go-deeper`).
- Server: `cite_section(path, heading, quote?)` in `tools.ts`, built on `sections.ts`. The path must be a real post/paper/project and the heading is matched (exact, anchor, or a unique partial match) against the live content from `loadBlogs`/`readBlog`/`readPaper`/projects. No match returns ok false plus the real headings and emits nothing. A quote is kept only if it is word for word inside one block of that section (max 160 chars); otherwise the page scrolls without a highlight. `read_blog` and `read_paper` now return a `sections` list so the model uses real headings. Action: `{ kind: 'cite', path, anchor, heading, quote? }`.
- Site: `copilot.cite` in `store.ts` goes to the page if needed (through the list, as before), waits for the heading, scrolls slowly with the wheel shown, the moon glides to the heading and taps it, then `quoteHighlight.ts` highlights the quote (CSS Custom Highlight API, with a block background fallback) for 9 seconds and the moon taps it. On a call the cite is queued after any navigation in `pendingMoves`, so it finishes before he speaks (the wait for moves is now up to 30 s). In text chat it is a "Show: <heading>" chip that does the same.
- Prompt: the voice note and system prompt tell the model to read first and cite only headings from the sections list.
- Tests: `node scripts/test-copilot-cite.mjs` (`pnpm run test:copilot-cite`): slugs (punctuation, markdown, unicode, numbering), duplicates and stability, sections and quote validation, and the tool against real projects (no invented heading, bad path, invented quote).

## Evidence
Backend build, frontend tsc and the copilot test scripts pass. In the browser with the local API and the real post 34: ids match the contents links, `cite` scrolled slowly (about 3 s in it was still mid-scroll), the moon tapped the heading and the quote was highlighted; same on a project page. Server anchors for the paper db-r-2026-001 equal the page's ids.

## Next
- Not tried on a live voice call (needs the voice agent); the move is queued the same way navigation is.
- `ResearchPaperPage.tsx` (the old `rp-*` renderer) is not routed and was left alone.

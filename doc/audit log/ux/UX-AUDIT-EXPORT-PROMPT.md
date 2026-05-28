# UX audit export — agent prompt

Copy everything below the line into a new Cursor chat when you want a **UX programming audit log** exported for the current session.

---

## Prompt (copy from here)

You are documenting a **UX programming audit** for design-bakery. Export a single Markdown file into `doc/audit log/ux/` using the rules below.

### File naming

- Use the **current local date and time** in human-readable form in the filename.
- Example pattern: `May-28-2026-10-54-AM-EDT-UX-Audit.md`
- Also set the document `title` and H1 to the same string.

### Document structure

1. **Header metadata** (Created, Last updated, Scope, Branch/session if known)
2. **Table of contents** — bullet list of **clickable Markdown links** (`[Label](#anchor)`) to each **summarized progress category** you derive from the conversation (5–12 categories max; group related requests).
3. **Timeline** — one section per user turn (or per logically merged turn), in chronological order, under the matching category heading. For each entry include **exactly**:

```markdown
### {Category name} — {Weekday}, {Month} {D}, {YYYY} at {h:mm AM/PM} {TZ}

> *{User raw input, verbatim or lightly trimmed — no paraphrase in the quote block}*

**Agent summary:**  
{Line 1: what was understood.}  
{Line 2: what was done or recommended.}

```text
{Short code summary: files touched, key symbols, 3–15 lines max — no full files}
```
```

4. **Closing section** — `## Open UX items` (bullets) and `## Files touched (session)` (compact list).

### Source of truth

- Use the **current chat**, **git diff**, and **agent transcript** if available.
- Prefer **user `<user_query>` text** for the italic quote block.
- If timestamp is missing, infer order from chat and label as `May 28, 2026 — session (order N)` or use message timestamps when present.
- Do **not** invent requests; merge only clearly related consecutive messages.

### Style

- Categories are **outcome-themed** (e.g. “Blog list carousel — wheel scroll”), not tool-themed.
- Code blocks are **summaries** (`BlogListCarousel.tsx` — removed arrows, added bleed layout), not full diffs.
- Keep each agent summary to **two sentences**.

### Deliverables

1. Write the audit `.md` file under `doc/audit log/ux/`.
2. Tell the user the file path and offer to append on the next “export ux audit” request.

---

## Quick trigger phrases

- `export ux audit`
- `append today's ux audit`
- `ux audit log md`

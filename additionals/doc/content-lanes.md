# The two content lanes

| Field | Value |
|-------|-------|
| **Document date** | 2026-10-05 |
| **Created** | 2026-10-05 |
| **Last updated** | 2026-10-05 |

design-bakery publishes in two lanes. The split is about how much proof a piece carries, not how long it is: a two-paragraph note with a pinned source belongs in the research lane, and a long walkthrough of a personal build belongs in the blog lane.

The method is not defined here. It lives in the owner's helper repo, `Pukujan/content-generation-modules` (CGM), and this repo adapts it. Read CGM `docs/WRITING_ROUTING.md` and `docs/writing-routing.json` for voice routing, `docs/CONTENT_RESEARCH.md` for scan-first structure, and `docs/PROVENANCE_AND_CITATION.md` for the claim record and the provenance model. Nothing in this file replaces those.

## Which surface is which lane

| | Blog lane | Research lane |
|---|---|---|
| **Surfaces** | `/blogs`, `/blogs/:numericId`, `/endtoend-engineer/blogs` | `/research/*` |
| **Voice** | Casual, human, scan-first | Deep, verifiable |
| **Claims** | Bounded, one to three inline links near the claim | A claim record with status, supports, and limits |
| **Provenance** | Ends in a linked evidence section | `manifest.json` with `sources{path, sha256}` and per-figure `data.json` |
| **Links** | Descriptive and reader-facing | Commit-pinned permalinks, never a moving `main` |

Posts route to CGM's `human-sounding-writing` module. Human-facing research plans, architecture explanations, and evidence briefs route to `writing-direction`. Load the routed module before drafting; the routing contract is `must_load`.

## The bridge between the lanes

One linked evidence record per post. A post that makes load-bearing claims links to a single evidence record — claim rows plus pinned links — from its evidence section. The post body does not carry per-sentence metadata.

This is deliberate. Inline provenance on every sentence reads as noise and ages badly when a claim is revised. One record per post keeps the claims in one place you can diff.

## Where an evidence record lives

One record per post, beside the content it supports. For a blog post the record sits next to the post's source markdown; for a research piece it is the research `manifest.json`. The record's shape is CGM's claim record: Claim, Status, Source, Supports, Limits, Public citation.

## Provenance model

Follow W3C PROV-O's entity / activity / agent and derivation model as a way of thinking, not as a deployment. CGM's own provenance doc says this does not require an RDF store, and issue #66 puts SHACL, SPARQL, and triple stores out of scope. The provenance a reader sees is a linked record with pinned links.

## Related

- [Agent publishing API devlog](guidelines/agent-devlog-agent-publishing.md) — the API that creates posts in either lane.
- Issue [#66](https://github.com/Pukujan/design-bakery/issues/66) — scope and the out-of-scope list.
- CGM `docs/PROVENANCE_AND_CITATION.md`, `docs/WRITING_ROUTING.md`, `docs/CONTENT_RESEARCH.md`.

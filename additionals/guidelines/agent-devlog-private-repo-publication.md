# Agent devlog — Publishing a private-repo case study (genericization)

| Field | Value |
|-------|-------|
| **Document date** | 2026-10-05 |
| **Created** | 2026-10-05 |
| **Last updated** | 2026-10-05 |

**For Cursor agents.** Read before publishing any research paper, case study, or blog post whose source is a **private** repository.

### Revision history

| Date | Notes |
|------|--------|
| 2026-10-05 | Created after `db-r-2026-011` (CI-hardening before/after) was genericized for public release. |

## Canonical paths

- Papers: `frontend/src/app/modules/research/content/db-r-YYYY-NNN.md`
- Registry: `frontend/src/app/modules/research/data/researchPapers.ts`
- Rendered at `/research/papers/<id>`; listed on `/research`
- Worked example: `db-r-2026-011.md` — a private codebase's quality-gate hardening, published public

## In-repo pointers

- `.cursor/rules/private-repo-publication.mdc` — globs `frontend/src/app/modules/research/**`
- Comment above the `PAPER_011` entry in `researchPapers.ts`

---

## The rule

A private-repo writeup may be published publicly only after it is **genericized**: a reader must not be able to identify the source repository, and must not be able to reconstruct it from the paper's own figures.

Genericization is **not** redaction. The paper still has to make its argument. The test is whether the paper still shows the **shape** of the change without carrying the **coordinates** of the source.

## Strip (never publish)

| Item | Why |
|---|---|
| Repository or product name | Direct identifier. |
| Issue, PR, ticket numbers | Resolve to the private tracker. |
| File, script, and guard file names | A filename search finds the private repo. |
| Machine paths (`/home/<user>/`, `C:\...`, `~/...`) | Identify a person or a machine. |
| **Exact dates** (ISO or otherwise) | Timestamps of a real commit history. |
| **Exact counts** | See the residual-fingerprint trap below. |
| Internal identifiers (baseline file names, flag names, service names) | Searchable tokens. |

## Keep

| Item | Why it is safe |
|---|---|
| Shape of the change (a gate grew from under N to over N) | Describes a class of work, not a place. |
| Defect **classes** (orphan module, hardcoded path, folder drift) | General engineering categories. |
| Qualitative outcomes ("two caught defects on day one") | The evidence without the coordinates. |
| Rounded or banded magnitudes ("a few dozen", "under two weeks") | Preserves scale, drops precision. |

## The residual-fingerprint trap

Each figure alone looks harmless. A **tuple** of exact numbers plus exact dates is identifying even when no single element is: someone who knows the domain can intersect "nine backup files" + "a directory named `D:`" + "112 of 123 runs" + two ISO dates and land on one repository.

So the unit of redaction is the **tuple**, not the token. Whenever you are tempted to keep one exact figure, ask what it combines with.

## Method

1. **Re-derive every figure** from the private source immediately before publishing. Do not carry numbers forward from memory or from an earlier draft.
2. **Pick a rounding policy and apply it uniformly**: exact → banded ("a few dozen"); ISO date → relative ("under two weeks"); specific count → qualitative ("a batch of").
3. **State provenance in the paper.** The `<aside class="rp-meta">` names the evidence as a private repository, says the figures are deliberately rounded, and states that a reader cannot reproduce them. Say the limit out loud rather than implying reproducibility.
4. **Sweep for survivors.** Grep the final markdown and the registry entry for ISO dates, digits, machine paths, and code spans; justify every survivor in the change note.
5. **Check the registry.** The `abstract` and the `bibtex` note in `researchPapers.ts` repeat the paper's figures. Update them in the same change, or the public page contradicts itself.

## Safe / avoid

| Safe | Avoid |
|---|---|
| "under two weeks", "a few dozen", "most runs" | "eleven days", "68 to 63", "112 of 123" |
| "a directory named after a drive letter" | the literal path |
| "hardcoded home-path placeholders" | `/home/<user>/` |
| "a flag that prints a fresh baseline" | the literal flag name |

## Checklist before publishing

- [ ] No repository or product name, no issue numbers, no file/flag/script names.
- [ ] No ISO dates; time described relatively.
- [ ] No exact counts that combine into a fingerprint; bands or qualifiers instead.
- [ ] No machine paths or personal identifiers.
- [ ] `rp-meta` states private source, rounded figures, not reproducible.
- [ ] Every figure re-derived from source in this session.
- [ ] Registry `abstract` + `bibtex` note updated to match.
- [ ] Grep sweep for digits / dates / paths returned only justified survivors.
- [ ] Paper still argues its original point — not gutted into vagueness.

## Test URLs

- Paper: http://localhost:5300/research/papers/db-r-2026-011 (or the port Vite prints at startup)
- Index: http://localhost:5300/research

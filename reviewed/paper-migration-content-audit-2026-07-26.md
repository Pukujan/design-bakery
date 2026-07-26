# Paper migration content audit — HTML to React

**Date:** 2026-07-26. **Method:** independent second pass, not a re-reading of the
migration agent's own report.

## Why this was run

The migration agent reported that the React copies of papers 001-004 had been *condensed
summaries, 31-60% shorter than the HTML*, and that it converted the full HTML instead,
claiming zero words lost. That claim decides whether ~45,000 characters of published paper
text survived, so it was verified rather than accepted.

## Method

Recover the deleted static renders from git (`6b79104^`), strip markup, and compare each
against its React markdown. Two passes, because the first is not sufficient on its own:

1. **Word multiset** — catches gross loss, but a percentage alone is misleading: markup
   scaffolding, navigation chrome and repeated stopwords all count as "missing words"
   without any content having gone.
2. **Fragment presence** — every text fragment of 25+ characters in the original is
   checked for a counterpart in the markdown. This is the pass that actually answers the
   question, and it is the one reported below.

## Result

| original | markdown | word retention | missing fragments |
|---|---|---|---|
| `001.html` | `001.md` | 95.1% | **0** |
| `002.html` | `002.md` | 93.5% | **0** |
| `003.html` | `003.md` | 95.5% | **0** |
| `004.html` | `004.md` | 97.5% | **0** |
| `005.html` | `008.md` | 97.9% | **1** (see below) |

**No paper lost content.** The 93-97% word retention is markup and repeated stopwords, not
prose: the fragment pass finds nothing absent. The originals also carried 5, 7 and 4
empty-or-pending table cells respectively, which were deliberately removed earlier as
empty benchmark tables.

The one fragment flagged in 008 is `D:/claude/scc-v2/verdicts/113.md`, an absolute local
path that the migration agent removed as a leak. **Its absence is a fix, not a loss.**

## A false alarm worth recording

The first run compared `005.html` against `005.md` and reported **20.6% retention**, which
looks like catastrophic loss. It was an artefact of the paper-id collision: `005.html` is
*"Verification independence without opinion aggregation"*, which was renumbered to **008**,
while `005.md` is a different paper entirely (*Neuro-Symbolic Control*). Comparing two
unrelated documents produces exactly that number — only common English words overlap.

Correctly paired, it is 97.9%. The lesson is small but general: a comparison is only
evidence once you have confirmed the two things being compared are the same thing. The
number was alarming and completely meaningless.

## Verdict

The migration agent's claim holds. The React papers are the full documents, not summaries.

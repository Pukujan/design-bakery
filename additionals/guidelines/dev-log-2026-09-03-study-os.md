# Dev log — 2026-09-03 — Study OS marketing

| Field | Value |
|-------|-------|
| **Document date** | 2026-09-03 |
| **Created** | 2026-09-03 |
| **Last updated** | 2026-09-03 23:00 |

## Summary

Rebuilt the Study OS marketing package after reviewing the canonical project docs and real learner evidence. The original framing over-indexed on AI dependence and scaffold fading. The corrected story is about diagnosis: a wrong answer does not tell us whether the learner, the representation, the source material, or the teaching intervention caused the failure.

Study OS is now the primary featured project and is explicitly marked as built in public, with the public GitHub repository linked from the case study, presentation, and project cards.

## Canonical marketing framing

Primary case-study line:

> Sometimes you're not stuck on the problem. You're stuck on the way it was explained.

Core market problem:

> Learning software is good at measuring answers. It is much worse at explaining failure.

Product distinction:

> Most adaptive tutors ask what to teach next. Study OS first asks why the learner got stuck.

Short positioning:

> Find the real point of confusion.

Study OS should not be positioned primarily as an anti-AI product, a scaffold-fading product, or a generic retention tutor. Those are secondary mechanisms and concerns.

## Real Two Sum evidence used in the story

The public marketing is grounded in Study OS PR #51 and its reviewed derivatives of a canonical learner session around LeetCode Two Sum.

### Representation translation episode

Observed pattern:

- the external solution used index-first iteration;
- the learner had to translate index -> collection lookup -> value while also reasoning about the algorithm;
- the learner independently proposed `enumerate(...)` with explicit index and value;
- the learner later articulated that decoding another author's representation was displacing attention from the problem-solving idea.

Marketing interpretation:

> The learner was not simply "bad at Two Sum." The representation itself was consuming learning bandwidth.

The public page introduces `representation translation overhead` only after the concrete story, not as the headline.

### Variable-name interference episode

Observed pattern:

- `seen` already carried a set-related meaning for the learner;
- using it for a dictionary created confusion unrelated to dictionary semantics;
- a descriptive number-to-index rename still did not resolve the friction;
- a neutral concrete representation, `box`, plus a minimal key-value example was followed by a correct lookup response.

Marketing interpretation:

> The learner is not the only thing that can fail. Source code and teaching choices can introduce accidental difficulty.

Do not claim that `box` is universally better or that the intervention established durable mastery.

## Public design direction

Study OS now has its own visual system rather than inheriting the earlier cream/purple SaaS treatment.

Design language:

- dark technical workbench background;
- yellow for primary calls to action and source markers;
- aqua for learner/evidence signals;
- coral for friction and failure;
- code windows, translation paths, branch diagrams, learner-state panels, and source receipts;
- provenance appears as a small source trail after the story rather than dominating the story.

The intended feeling is: watch a real learner get stuck, discover why, then understand why the product should exist.

## External research shown publicly

The case study/evidence page currently uses these claims carefully:

- Ainsworth (2006), DeFT framework, DOI `10.1016/j.learninstruc.2006.03.001`: learning with multiple external representations requires managing the functions and relations between representations.
- 2024 Educational Psychology Review meta-analysis, DOI `10.1007/s10648-024-09958-y`: more representations are not automatically better; effects are heterogeneous and support matters.
- Avidan & Feitelson (2017), ICPC, DOI `10.1109/ICPC.2017.27`: identifier naming can materially affect program comprehension and misleading names can undermine comprehension.
- Margulieux, Morrison & Decker (2020), DOI `10.1186/s40594-020-00222-7`: subgoal-labeled programming examples support making procedural structure explicit when expert compression hides novice-relevant steps.

These papers support the problem space. They do not prove Study OS efficacy.

## Files touched

| File | Notes |
|------|-------|
| `frontend/public/case-studies/study-os/index.html` | Full case-study rewrite and visual redesign around the Two Sum evidence |
| `frontend/public/case-studies/study-os/presentation.html` | Eight-slide sales presentation using the real learner episode as the spine |
| `frontend/public/case-studies/study-os/evidence.html` | Provenance, research support, and bounded claims |
| `frontend/src/app/modules/engineering/EngineeringProjects/projects.json` | Study OS moved to first position and marked built in public with GitHub CTA |
| `frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json` | Study OS moved ahead of Cortex and FOSSIL with public GitHub CTA |
| `additionals/guidelines/dev-log-2026-09-03-study-os.md` | Corrected durable marketing context |

## Public URLs

- Case study: `/case-studies/study-os`
- Presentation: `/case-studies/study-os/presentation`
- Evidence: `/case-studies/study-os/evidence`
- Public source: `https://github.com/Pukujan/Study-os`
- Two Sum source trail: `https://github.com/Pukujan/Study-os/pull/51`

## Claim boundaries

Do not claim:

- Study OS has proven causal learning gains;
- the Two Sum episode proves durable mastery;
- `enumerate` or `box` is universally superior;
- a learner has a fixed visual or sensory learning style;
- a derived diagnosis is ground truth;
- one learner generalizes to a population.

The public story can say that Study OS is being built to distinguish different causes of learning friction and measure what changes after an intervention.

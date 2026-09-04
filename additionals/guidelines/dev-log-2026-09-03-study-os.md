# Dev log — 2026-09-03 — Study OS marketing

| Field | Value |
|-------|-------|
| **Document date** | 2026-09-03 |
| **Created** | 2026-09-03 |
| **Last updated** | 2026-09-04 00:14 |

## Summary

Rebuilt the Study OS marketing package again after brand research across more than 20 current AI-learning products. The previous dark technical-workbench direction was accurate to the research but emotionally wrong for the target learner. The new direction is a warm-futurist AI learning partner: optimistic, student-centered, visibly AI-native, and still grounded in the real Two Sum evidence.

Study OS remains the primary featured project and keeps the public GitHub repository as a first-class CTA.

## Canonical marketing framing

Primary case-study line:

> When it doesn't click, change the explanation.

Learner problem:

> Getting stuck is part of learning. Getting stuck for the wrong reason doesn't have to be.

AI-era market gap:

> AI made explanations infinite. It didn't make diagnosis precise.

Investor thesis:

> The next AI tutor probably won't win by knowing more. It will win by teaching better.

Product direction:

> Your AI tutor should learn from what confused you too.

Closing:

> A confusing explanation shouldn't get the final word.

Do not frame Study OS as anti-AI, as a generic retention product, or as a fixed-learning-style engine. The useful claim is that learners get stuck for different reasons, and the same learner can need different representations at different moments.

## Brand research direction

Reference review included AI tutors, study companions, learning robots, adaptive-learning products, and AI-first education platforms. The strongest single visual benchmark was Praktika because it makes the AI visible as a partner while keeping the experience optimistic and adult enough for serious learners.

The Study OS synthesis is:

- AI presence and character, inspired by modern tutor-avatar products;
- empathetic learner language, closer to products like Ello and StudyX than enterprise learning software;
- a warm future-facing palette instead of cyberpunk or research-lab aesthetics;
- the actual Study OS representation-transition research as the differentiator underneath the friendly surface.

The marketing must never claim a fixed visual/auditory/kinesthetic learning style. Use contextual language instead: what helped this learner with this concept at this point in time.

## Real Two Sum evidence used in the story

The public marketing remains grounded in Study OS PR #51 and its reviewed derivatives of a canonical learner session around LeetCode Two Sum.

### Representation translation episode

Observed pattern:

- the external solution used index-first iteration;
- the learner had to translate index -> collection lookup -> value while also reasoning about the algorithm;
- the learner independently proposed `enumerate(...)` with explicit index and value;
- the learner later articulated that decoding another author's representation was displacing attention from the problem-solving idea.

Marketing interpretation:

> In this moment, a major part of the struggle was decoding somebody else's representation.

Do not simplify this into “the learner understood Two Sum completely.” The episode supports a representation-friction hypothesis, not full concept mastery.

### Variable-name interference episode

Observed pattern:

- `seen` already carried a set-related meaning for the learner;
- using it for a dictionary created confusion unrelated to dictionary semantics;
- a descriptive number-to-index rename still did not resolve the friction;
- a neutral concrete representation, `box`, plus a minimal key-value example was followed by a correct lookup response.

Marketing interpretation:

> The learner is not always the only thing that can fail. The explanation can fail too.

Do not claim that `box` is universally better or that the intervention established durable mastery.

## Public design direction

Study OS now uses a warm-futurist learning-partner identity.

Design language:

- cream and white study-desk surfaces;
- cobalt blue as the primary AI/product color;
- mint for successful connections;
- sunshine yellow for curiosity and prompts;
- coral only for friction;
- deep navy text instead of black;
- an original friendly robot partner embedded directly in the case study and presentation;
- study notes, speech bubbles, code cards, and learner-language prompts rather than dark dashboards;
- provenance receipts remain visible but secondary to the human story.

The intended feeling is: “I am trying, this AI understands that the explanation may be the problem, and we can try another way.”

### Presentation interaction

The presentation should feel obvious to navigate on desktop and mobile:

- large translucent circular arrow controls sit at the left and right edges of the deck;
- arrow keys, Page Up/Page Down, and Space continue to work;
- horizontal touch swipes move between slides;
- vertical scrolling remains native, so a swipe only changes slides when the horizontal gesture clearly dominates;
- the bottom bar is for progress dots and a subtle interaction hint rather than small text Back/Next buttons.

## External research shown publicly

The case study/evidence page uses these claims carefully:

- Ainsworth (2006), DeFT framework, DOI `10.1016/j.learninstruc.2006.03.001`: learning with multiple external representations requires managing the functions and relations between representations.
- 2024 Educational Psychology Review meta-analysis, DOI `10.1007/s10648-024-09958-y`: more representations are not automatically better; effects are heterogeneous and support matters.
- Avidan & Feitelson (2017), ICPC, DOI `10.1109/ICPC.2017.27`: identifier naming can affect program comprehension.
- Margulieux, Morrison & Decker (2020), DOI `10.1186/s40594-020-00222-7`: subgoal-labeled programming examples support making novice-relevant procedural structure explicit.

These papers support the problem space. They do not prove Study OS efficacy.

## Files touched

| File | Notes |
|------|-------|
| `frontend/public/case-studies/study-os/index.html` | Complete learner-first rewrite with warm-futurist AI partner design |
| `frontend/public/case-studies/study-os/presentation.html` | Nine-slide sales and market presentation with edge-arrow navigation and swipe support |
| `frontend/public/case-studies/study-os/evidence.html` | Warm visual refresh while keeping provenance and claim boundaries explicit |
| `frontend/src/app/modules/engineering/EngineeringProjects/projects.json` | Study OS stays first; new AI-learning-partner description and cobalt/yellow palette |
| `frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json` | Same primary Study OS positioning ahead of Cortex and FOSSIL |
| `additionals/guidelines/dev-log-2026-09-03-study-os.md` | Updated durable brand, copy, and presentation interaction guidance |

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
- a learner has a fixed sensory learning style;
- a derived diagnosis is ground truth;
- one learner generalizes to a population.

The public story can say Study OS is being built to observe learning friction, try a different representation, and measure what changes next.

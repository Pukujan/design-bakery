# Study OS marketing build, 2026-09-03

## What shipped

Added the first public Study OS marketing package:

- `frontend/public/case-studies/study-os/index.html`
- `frontend/public/case-studies/study-os/presentation.html`
- `frontend/public/case-studies/study-os/evidence.html`
- `frontend/src/app/modules/case-studies/study-os/StudyOsCaseStudyRedirect.tsx`

The homepage project data now includes both FOSSIL and Study OS. The end-to-end engineering portfolio also includes both projects. Sitemap generation now includes Cortex, FOSSIL, and Study OS public routes.

## Study OS framing

Primary line:

> AI helped you solve it. Did you actually learn it?

Short product line:

> Use the AI. Keep the skill.

The problem is not framed as "AI is bad for learning." AI assistance is useful. The gap is measurement: immediate task completion, a fluent explanation, or a correct AI-assisted answer does not by itself establish independent skill.

Study OS is framed around a smaller loop:

1. let the learner attempt;
2. locate the failing translation step;
3. change the intervention at that step;
4. fade the scaffold;
5. verify independent recall, transfer, and delayed performance.

A key explanatory model is the translation chain:

`problem -> mental model -> state -> invariant -> procedure -> code -> transfer`

The product should not assume the learner misunderstands the entire concept when one transition may be the actual failure.

## Claim discipline

The evidence page deliberately separates established learning-science mechanisms from Study OS product efficacy.

External evidence currently used:

- Schwieren, Barenberg & Dutke (2017), testing effect in psychology classrooms, DOI 10.1177/1475725717695149.
- Pan & Rickard (2018), transfer of test-enhanced learning, DOI 10.1037/bul0000151.
- Renkl, Atkinson & Große (2004), faded worked solution steps, DOI 10.1023/B:TRUC.0000021815.74806.F6.
- Paas & van Merriënboer (2020), cognitive load and guidance fading, DOI 10.1177/0963721420922183.
- Murray, Horner & Göbel (2025), spacing and retrieval practice for mathematics learning, ERIC EJ1478558.

Do not attribute those published effect sizes to Study OS. The product still needs controlled validation.

## Proposed product benchmark

A credible Study OS evaluation should preregister and compare:

- independent success without the original answer or transcript;
- transfer to structurally related problems with changed surface details;
- delayed retention;
- amount of help required on later attempts;
- diagnosis quality for the purported failing step.

The marketing page can say Study OS is designed around these signals. It should not claim measured learning gains until a Study OS experiment actually demonstrates them.

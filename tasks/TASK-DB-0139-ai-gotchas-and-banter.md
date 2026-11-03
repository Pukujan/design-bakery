# TASK-DB-0139: AI gotchas and acknowledgement banter

## Goal
AI Pujan jokes about the famous AI trick questions, answers them correctly and instantly, and acknowledges a visitor's correction with a short good-humoured reply that takes it seriously.

## Done
- `backend/src/copilot/gotchas.ts`: matcher plus instant reply (correct answer first, then one dry line, several wordings via `vary()`, no emoji, `detail` dropped on a call) for: car wash, letter counts (strawberry and any `how many X in WORD`), 9.11 vs 9.9, seahorse emoji, glue on pizza, "how many words in your next answer" (the reply states its own true word count), the surgeon riddle with the twist removed.
- Acknowledgements: "good catch" and similar; a bare "you're wrong" / "that's not right" gets a reply that asks which part is off. Skipped when the visitor is annoyed (shouting, `!!`, rude words), the subject is serious, there is no earlier reply, or the correction carries detail (the model handles those).
- Catchphrase bank (`CATCHPHRASES`, `maybeCatchphrase()`): at most one per four calls, only on a praise acknowledgement. The model path gets two lines in the persona (`route.ts`).
- Wired in `routines.ts` (`routeRequest`, after offers, before routines); `route.ts` lets `gotcha:` and `banter:` replies through even after a question.
- News job: no code change. Fresh blunders and memes already reach the model through kinds `blunder` (two reputable sources or the maker owning up) and `meme`; nothing is added to the instant matcher without a source checked by hand.
- Test: `scripts/test-copilot-gotchas.mjs`, run by `pnpm run test:copilot-router` and `test:copilot-gotchas`.

## Sources
| Gotcha | Correct answer | Why it trips | Sources |
|---|---|---|---|
| car-wash | Drive: the car is what gets washed | Short distance reads as "walk" | https://opper.ai/ai-roundtable/questions/i-need-to-wash-my-car-the-car-wash-is-50-meters-away-should-0fc80ac9 |
| strawberry | 3 R's | Models read tokens, not letters | https://venturebeat.com/technology/the-strawberrry-problem-how-to-overcome-ais-limitations ; https://arxiv.org/html/2412.18626v1 |
| decimals | 9.9 is bigger | 9.11 reads like a version number / compares 11 with 9 | https://thestar.com.my/tech/tech-news/2024/07/18/maths-test-stumps-ai-models-which-number-is-bigger-990-or-911 ; https://towardsdatascience.com/9-11-or-9-9-which-one-is-higher-6efbdbd6a025 |
| seahorse | No such emoji in Unicode | Shared false memory; reported chatbot loop | https://futurism.com/?p=363621 ; https://www.bluewin.ch/en/news/switzerland/seahorse-emoji-the-web-remembers-a-phantom-2813566.html |
| glue-pizza | No glue | A 2024 search summary repeated a forum joke; Google acknowledged | https://www.engadget.com/google-is-putting-more-restrictions-on-ai-overviews-after-it-told-people-to-put-glue-on-pizza-011316780.html ; https://9to5google.com/2024/06/12/google-ai-overview-mistake-glue-pizza/ |
| next-answer-words | The reply counts itself | Models work in tokens, not words | https://community.openai.com/t/chatgpt-cannot-count-words-or-produce-word-count-limited-text/47380 ; https://discuss.huggingface.co/t/recursion-in-llms/129714 |
| surgeon-father | The father (it says so) | Memorised answer to the famous version | https://arxiv.org/html/2510.11812v1 ; https://gist.github.com/simonw/307381aaf6a063d47a79e2bdb4801d5e |

Caveats: the car-wash and seahorse sources are weaker (model-poll pages, news). The seahorse chatbot loop is described as "reportedly". Results vary by model and date, so no joke claims any model fails today.

## Evidence
`pnpm --dir backend run build`, then `test:copilot-gotchas`, `copilot-router`, `copilot-answers`, `copilot-chips`, `copilot-memory` all pass.

## Next
User reviews the list; do not merge without their go-ahead. Rebase on #197/#198 (both touch `answers.ts` and its test).

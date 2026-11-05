# Router benchmark

Which model should decide what a spoken line means (open a page, next, summarise, book, question, chit-chat, off-topic, unclear...), and
how well does each do on lines like the ones real visitors say?

- `real.json`: 109 lines from the real calls and chats (2026-11-03 to 11-05), hand-labelled with the page they were said on.
- `gen.py` -> `cases.json`: those plus 385 paraphrases per intent on varied pages, some with speech-recogniser slips (lowercase, fillers, "President" for Precedent).
- `make_wild.py` -> `wild.json`: 360 lines from public datasets of how people talk to assistants (CLINC150, MASSIVE, MultiWOZ, SGD), mapped to these intents. The datasets themselves are not in the repo; the script says where to get them.
- `prompt.json`: one prompt shared by every model (the intents, the real page list, 20 examples, none of them a test line).
- `run_lfm.py`: LFM3 on the Pro, thinking off, JSON-schema constrained (`python3 run_lfm.py cases.json prompt.json out-lfm3.json`).
- `run_hosted.js`: a hosted provider, run inside the API container so its key stays there (`node run_hosted.js DEEPSEEK|QWEN 3`; `CASES=... OUTSUF=-wild` for another set).
- `score.py`: `python3 score.py cases.json out-a.json out-b.json ...` prints accuracy, speed, per-intent accuracy and the commonest mistakes.

## Result on `cases.json` (494 cases, 2026-11-05)

| model | intent accuracy | real lines | target accuracy | median / p90 |
|---|---|---|---|---|
| LFM3 (local, few-shot, constrained) | 54% | 55% | 89% | 1.4 s / 1.5 s |
| DeepSeek V4.1 Flash | 87% | 76% | 100% | 1.9 s / 2.7 s |
| Qwen (yolo) | 90% | 83% | 99% | 3.5 s / 5.1 s |

LFM3 with this prompt fails mostly on `open_page` (18%: read as a question or "next") and `decline` (12%: read as confirm). Many hosted
misses are `open_page` read as `question` ("tell me about Cortex"), which is partly the labels' fault. A 25-line hand-picked set had
shown LFM3 at 72%; the bigger set is the honest number.

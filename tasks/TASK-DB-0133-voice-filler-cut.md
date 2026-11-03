# TASK-DB-0133 — voice fillers stop when the answer is ready; "latest post" by real date

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0133-voice-filler-cut` (from `main`) |
| **Status** | In review |

## Goal

The owner found two things on a voice call:

1. AI Pujan kept saying "Hmm… let me think" fillers even when the model had already answered.
2. It called "Prompt Engineering: Beyond Basic Prompts" (November 2025) the latest blog post, even though there are posts from June 2026.

## Done

- **Fillers (`holdAudio.ts`):** they now start after 1.5 s instead of 0.7 s, so a quick answer gets none. When the answer arrives, the clip in progress fades out in 0.2 s; before, it played to the end (openers run 5 to 6.5 s). A closer ("Okay… got it") now follows only a filler that was heard in full.
- **Latest post (`knowledge.ts`, `answers.ts`):** blogs are ordered by their parsed display date ("June 18 2026", "November 2025"), with `publishedAt` as the fallback. Before, `latestBlog` sorted the date as text, so "November" beat "June". `loadBlogs` returns newest first, and the brief now says so, so the model sees the same order.

## Checks

- Fake-audio timing run of `startThinking`: an answer ready at 0.8 s is spoken at 0.8 s with no filler. At 2.5 s it is spoken at 2.7 s; before, that was about 10 s. At 8 s it is spoken at 10.6 s, after one opener and a closer.
- Live `/api/public/blogs`: the old sort picks "Prompt Engineering" (November 2025); the new sort picks "Hades SEO Workflow Automation Study Log" (June 18 2026).
- `test:copilot-answers` (new regression check on the stored date formats), `test:copilot-stream`, `test:copilot-router`, `test:copilot-voice`, frontend `tsc` and eslint all pass.
- Not checked: a live voice call.

# TASK-DB-0122 — project questions answered instantly, and no stuck replies

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0122-instant-project-answers` (from `main`) |
| **Status** | In review |

## Goal

The "Ask the copilot about <project>" button sends "Tell me about <project>." to the live model, which was slow and once stopped mid-sentence. The owner expected button questions like this to come from saved answers, not a model.

## How saved answers work today

- The instant answers (`backend/src/copilot/answers.ts`) are code: fixed wording plus facts read at request time from the site's content. That content comes from Octo (the `cms_documents` portfolio) with the repo JSON as fallback. There is no Octo table of canned replies; the wording itself lives in code.

## Done

- New instant answer for project questions: "Tell me about X", "what is X", "explain X", or just the project's name, for every project in the content (title, slug, or first word of the slug, so "oni" works). It answers from that project's record (tagline and the start of its description) with an "Open <project>" chip. Questions over nine words, or about something that is not a project, still go to the model.
- `scripts/test-copilot-answers.mjs` checks all 15 "Tell me about <title>." questions are answered from the cache with a link to the project page, and that a long question still reaches the model.
- A stalled live reply no longer leaves the chat stuck: after 25 s with no event the stream is abandoned and the chat shows the partial text with "The response was interrupted. Please try again."

## Not done

- Moving the reply wording into an Octo table so it is editable without a deploy. That needs a table, an editor and a loader with a code fallback; say if you want it.

## Checks

- Built backend: eight sample questions behave as described; `test:copilot-answers`, eslint and tsc pass.

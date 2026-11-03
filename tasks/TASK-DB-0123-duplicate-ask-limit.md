# TASK-DB-0123 — pressing a button repeatedly sends one request

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0123-duplicate-ask-limit` (from `main`) |
| **Status** | In review |

## Goal

A visitor pressing "Ask the copilot about X" repeatedly could send the same request several times, each costing a model turn and a slot in the rate limit.

## Done

- `copilot.send` ignores a repeat of the question it just answered: while that answer is the latest message and less than 30 s old, the same question (compared without case or punctuation) returns the existing answer instead of sending again. A different question in between, an error reply, or New chat allows it again. Voice turns are exempt.
- While a reply is still arriving a second send was already ignored (`busy`); this closes the gap after it finishes.
- The server's limits are unchanged: 50 per 2 h, 100 per 10 h, 200 per 4 days per visitor.

## Checks

- tsc and eslint pass. Local dev server: six rapid sends of "Tell me about Cortex." gave one user message; three more repeats (different capitalisation and punctuation) still one; after asking something else, asking it again was allowed (three in total).

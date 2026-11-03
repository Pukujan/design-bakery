# TASK-DB-0136 — navigation chips vs expansion chips; the moon takes the visitor there

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0136-nav-vs-expand-chips` (from `main`) |
| **Status** | In review |

## Goal

Clicking a project chip jumped straight to the page. The owner wanted the moon to come in and take the visitor there, and wanted chips that open a page to look and behave differently from chips that expand the topic.

## Done

- **Two kinds (`chips.ts`, same file in `backend/src/copilot/` and the frontend):** `navigate`, `projects`, `cite`, `book`, `link` are navigation; the new `ask` action is expansion. An unclassified kind is expansion only if its text is a question. The server stamps `chip` on every action it sends (`route.ts`), the browser reads it. New tool `suggest_followups` lets the model offer up to three `ask` chips.
- **Look (`CopilotChat.tsx`, `chat-core.css`):** navigation chips have a compass and say where they go ("Open Eval Lab", "Jump to Built with"); expansion chips have a chat bubble, a dashed border and read like a reply. Black text on accent is unchanged.
- **Behaviour:** a navigation chip calls `copilot.guide(path)` (`go(path, {slow, agent})`, the existing journey); a cited section calls `copilot.cite`; an expansion chip sends its text like typing it. A typed "yes" to open a page now also uses `guide`. On a phone the chat sheet closes first.
- **Guest moon (`agentCursor.ts`, `MoonCursor.tsx`):** off a call the moon is a guest. It enters from the screen edge nearest to the link, glides, presses, scrolls as the journey needs, and flies out the nearest edge after `release`. On a call it is the call's own moon (`setOnCall`), so there is never a second one. Reduced motion: no flight, it just appears and goes. Safety: a guest is removed 3 s after it starts leaving and 70 s after it appears, whatever happened.
- Cited-section chips keep the moon for 6 s (was a whole spoken passage, 14 s).

## Checks

- `node scripts/test-copilot-chips.mjs` (`pnpm run test:copilot-chips`): classification, server/browser files identical, chip-to-behaviour mapping read from `CopilotChat.tsx`, entry/exit edges. Frontend `tsc` clean.
- Browser (800 px wide, so the phone layout): clicked "Open Cortex" on the homepage. The moon came in at once, the page changed to `/work/cortex` at about 5.5 s, the moon tapped the title and left at about 13.5 s, gone by 14 s.
- Not checked: expansion chip against a live model (no API running; the offline answers have none), a real phone, reduced motion in a browser.

## Open question

The brief called "Show: What it is / Built with / Go deeper" expansion chips, but they are `cite` actions that scroll to a section, so they are navigation here ("Jump to Built with"). If the owner wants them to be questions instead, change the model's use of `cite_section` to `suggest_followups`.

# TASK-DB-0112 — contact page as a guided flow

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0112-contact-redesign` (from `main`) |
| **Status** | In review |

## Goal

The owner found the contact page weird: a long form that said it was not connected, a heading that repeated the button, Pretext on the title, and no clear path. They asked for an easy self-guided workflow with no Pretext.

## Done

- No Pretext on the page.
- Three steps, one question at a time, with a progress bar, a recap chip and Back: (1) What do you need help with? (AI engineering, Product design, Marketing, Full-stack development, each with a one-line hint) (2) How would you like to talk? Book a free 30-minute call (lime, opens the calendar), Ask the AI right now (opens the chat with a question about the chosen area), Leave a message (3) email and message, then Send.
- "Leave a message" is shown as "Not open yet" while `MESSAGE_ENDPOINT` is null, so nothing pretends to send. Set the endpoint and it turns on.
- Focus moves to each step's question for keyboard and screen-reader users.
- The surface is a hairline border with a faint fill, no dark panel.

## Checks

- tsc and eslint pass. Local dev server: desktop and 375px show step 1; choosing a service shows step 2 with the lime booking tile in dark text.

## Not done

- Step 3 (the message form) is built but cannot be reached until the Gmail endpoint exists, so it was not exercised.

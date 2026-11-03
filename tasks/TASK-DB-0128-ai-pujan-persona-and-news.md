# TASK-DB-0128 — AI Pujan's personality and a daily AI-news feed

| Field | Value |
|-------|-------|
| **Created** | 2026-11-03 |
| **Branch** | `task/TASK-DB-0128-persona-and-news` (from `main`) |
| **Status** | In review; migration 012 not applied |

## Goal
The copilot is funny, dry and gently sarcastic by default, loves AI and tech, and keeps a conversation going for hours. It has a daily list of upbeat AI and tech news to bring up ("I saw that...") in small talk.

## Done
- `route.ts` `SYSTEM`: a Personality section (dry/sarcastic humour, gentle teasing of AI hype and companies, affectionate and general; no accusing real people, no invented quotes or facts, no politics or doom; keeps small talk going with a short hook; real questions about my work are answered plainly first, from the brief only). `VOICE_NOTE`: at most one short joke, under 35 words, hand the conversation back with a quick question. Instant answers (`answers.ts`) are untouched and still run before the model.
- `news.ts`: collects the Hacker News front page (Algolia API, 150+ points) and the RSS feeds of Hugging Face, TechCrunch AI, MIT Technology Review AI and Google's AI blog. No key needed. `fits` drops politics, conflict, legal, security incidents, layoffs, finance and doom words and anything off-topic or instruction-shaped; `clean` strips markup and control characters. Keeps 12 items (title, one-line summary, URL, source, date) in Octo table `copilot_news`.
- Daily refresh: `startNewsScheduler` (called from `server.ts`) checks one minute after boot and hourly, and refreshes only when the newest row is over 24 hours old. `node backend/lib/copilot/newsJob.js` does one refresh for a timer. `COPILOT_NEWS=off` disables it. Per `vps/PLAN.md`, scheduled jobs on the VPS are timers; the in-process check means none has to be installed.
- Reader: `latestNews()` (cached 5 minutes, never throws, re-filters on read) feeds a "Things I read today" block after the site brief in the model prompt: three items, rotated by day, framed as read-not-mine and as data, not instructions.
- `scripts/test-copilot-news.mjs` (`pnpm run test:copilot-news`): filtering, cleaning, feed parsing, collection (dedupe, caps, failing source), reader cache, prompt block, persona prompt checks.

## Evidence
`pnpm --dir backend run build`, `node scripts/test-copilot-news.mjs`, `node scripts/test-copilot-answers.mjs` pass. A live collection run (no database write) returned five fitting items from TechCrunch and Google's blog; Hacker News items that day were all finance or gloom and were filtered out. No live model turn was run (needs a visitor pass).

## Before it does anything on the site
Apply `supabase/migrations/012_copilot_news.sql` to the Octo workspace (needs the owner's approval; `node scripts/octo-query.mjs supabase/migrations/012_copilot_news.sql`). Until then the reader returns no news and the scheduler logs a warning; the persona works regardless.

## Next
- Hacker News items only have a "Trending with N points" summary; a model-written one-liner would be better.
- Tune the word list after a week of real output.

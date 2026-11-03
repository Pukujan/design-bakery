# TASK-DB-0128 — AI Pujan's personality and a daily AI-news feed

| Field | Value |
|-------|-------|
| **Created** | 2026-11-03 |
| **Branch** | `task/TASK-DB-0128-persona-and-news` (from `main`) |
| **Status** | In review; migration 012 not applied |

## Goal
The copilot is funny, dry and gently sarcastic by default, loves AI and tech, and keeps a conversation going for hours. It has a daily list of upbeat AI and tech news to bring up ("I saw that...") in small talk.

## Done
- `route.ts` `SYSTEM`: a Personality section (very sarcastic and sharp, insightful about AI hype; straight answers for real questions and for upset visitors; gentle teasing of AI hype and companies, affectionate and general; no accusing real people, no invented quotes or facts, no politics or doom; keeps small talk going with a short hook; real questions about my work are answered plainly first, from the brief only). `VOICE_NOTE`: at most one short joke, under 35 words, hand the conversation back with a quick question. Instant answers (`answers.ts`) are untouched and still run before the model.
- `news.ts`: an explicit `SOURCES` allowlist (Anthropic, OpenAI, Google DeepMind, Google, Meta AI, Mistral, Hugging Face, arXiv, GitHub for a list of known orgs: first party; TechCrunch, MIT Technology Review, Ars Technica: outlets). Feeds: OpenAI, DeepMind, Google, Hugging Face, Mistral, TechCrunch, MIT TR, Ars; no keys. Hacker News (Algolia, 150+ points) is a trending signal only, kept when the story links to an allowlisted site. Every kept link must pass `sourceOf`, the source name comes from the link's host, `first_party` is stored. Ranking: first-party release (launch/release/introducing/version) first, other first-party posts, then outlets; max 3 per source. `fits` drops politics, conflict, legal, security incidents, layoffs, finance and doom words; `clean` strips markup. 12 items in Octo table `copilot_news`.
- Daily refresh: `startNewsScheduler` (called from `server.ts`) checks one minute after boot and hourly, and refreshes only when the newest row is over 24 hours old. `node backend/lib/copilot/newsJob.js` does one refresh for a timer. `COPILOT_NEWS=off` disables it. Per `vps/PLAN.md`, scheduled jobs on the VPS are timers; the in-process check means none has to be installed.
- Reader: `latestNews()` (cached 5 minutes, never throws, re-filters on read) feeds a "Things I read today" block after the site brief in the model prompt: three items, rotated by day, each line says where it came from ("OpenAI's own announcement" / "reported by X") and is framed as read-not-mine, no verdicts and as data, not instructions.
- `scripts/test-copilot-news.mjs` (`pnpm run test:copilot-news`): filtering, cleaning, feed parsing, collection (dedupe, caps, failing source), reader cache, prompt block, persona prompt checks.

## Evidence
`pnpm --dir backend run build`, `node scripts/test-copilot-news.mjs`, `node scripts/test-copilot-answers.mjs` pass. A live collection run (no database write) returned five fitting items from TechCrunch and Google's blog; Hacker News items that day were all finance or gloom and were filtered out. No live model turn was run (needs a visitor pass).

## Before it does anything on the site
Apply `supabase/migrations/012_copilot_news.sql` to the Octo workspace (needs the owner's approval; `node scripts/octo-query.mjs supabase/migrations/012_copilot_news.sql`). Until then the reader returns no news and the scheduler logs a warning; the persona works regardless.

## Next
- A write-up is not yet swapped for the first-party link of the same story (ranking only prefers first party). Anthropic has no RSS feed; its news arrives only via Hacker News links.
- Tune the word list after a week of real output.

# TASK-DB-0118 — the copilot speaks as AI Pujan, in the first person

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0118-ai-pujan-voice` (from `main`) |
| **Status** | In review |

## Goal

The copilot talked about Pujan in the third person ("Pujan builds...", "More about him", "He also takes consultations"). The owner wants it to pretend to be them, always in the first person, while always disclosing that it is AI Pujan. Asked whether it is real or fake, or the same person, it says that he and I are one.

## Done

- Model prompt (`backend/src/copilot/route.ts`): "You are AI Pujan... always speak as me... never say he/him/his about me... be open that you are AI Pujan... if asked real or fake or the same person, say he and I are one, you are not him live." The consultation tool's description is first person too.
- Instant answers (`backend/src/copilot/answers.ts`) and the built-in fallback (`frontend/src/app/modules/lab/copilotAnswers.ts`): greeting ("Hey, it's AI Pujan..."), how are you, who are you ("I'm AI Pujan. I build..."), contact, blog, research, experience ("Most recently I was..."), book, bye, all first person. Chips: "More about me", "Email me".
- Identity questions ("are you real or fake", "are you two the same person", "you and Pujan", "is this really Pujan") answer: "He and I are one. I'm AI Pujan: his work and his voice, running as an AI. I'm not him live, but everything I say comes from what's published here."
- Checked on the built backend: the eight sample questions above come back in first person with the right intents; `test:copilot-answers` passes.

## Not done

- The orb's old subtitles ("Virtual Pujan is listening") are replaced in TASK-DB-0114, not here.
- The voice agent's own prompt is in the chatbots repo and not changed. The pre-recorded lines and the spoken greeting are already first person.

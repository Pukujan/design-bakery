You are right. This needs a **full case study rewrite**, not another patch.

Your current page already says the project evolved into prompt evals, agent jobs, RAG, and market-grounded comparison, but it still keeps old MVP language, duplicated sections, and a “Next Phase” section that describes things already partially built. The strongest current evidence is that the system now has frontend, backend, shared types, AI features, eval dashboards, market modes, usage limits, and multiple golden/eval flows.  

Also, the latest docs are clear that **Agent mode is not simply another quote provider**. It is now a controlled 30-day LLM chart job workflow while quotes/news still come from Live or Mock. That distinction should be reflected in the case study. 

---

# Figma Make Change Log

## Global positioning change

Replace the current positioning:

```txt
InvestAI: AI-Assisted Paper Trading & Financial Reasoning Research Platform
```

With:

```txt
InvestAI: AI Financial Reasoning Evaluation & Confidence Scoring Platform
```

Reason:

The old title sounds like a dashboard with AI features. The new version is more accurate because the project is now about **AI insight quality**, **prompt evaluation**, **confidence scoring**, **market-grounded comparison**, and **repeatable reasoning tests**.

---

## Remove duplicate full-page content

The current pasted case study repeats the same entire page twice. Remove the duplicate block completely.

Keep one clean case study structure:

```txt
Hero
Motivation
Product Evolution
AI Quality System
Architecture
Validation
Learnings
Roadmap
Final Vision
```

---

## Rename or reframe navigation

Current nav:

```txt
Motivation
MVP
Architecture
Research
Roadmap
Live Demo
Case Study
```

Recommended nav:

```txt
Motivation
Product
AI Quality
Architecture
Validation
Roadmap
Live Demo
Source
```

If you want to keep “MVP,” rename its section heading to:

```txt
From MVP to Evaluation Platform
```

---

## Replace “Latest Engineering Update”

Current section is good but still too generic.

Replace with:

```txt
Product Evolution: From Dashboard to AI Quality System
```

Reason:

“Latest Engineering Update” sounds temporary. “Product Evolution” sounds like a case study narrative.

---

## Add a dedicated AI Quality System section

This is the biggest missing section.

Add a full section for:

```txt
Prompt Evaluation
Confidence Score Dataset Development
RAG-Grounded Experiments
Model-Tier Comparison
Market-Grounded Visual Proof
```

This should become the center of the page.

---

## Fix Agent Mode wording

Avoid:

```txt
Agent mode is a third market provider.
```

Use:

```txt
Agent mode runs controlled LLM chart-generation jobs while preserving Live/Mock as the quote and news source. This keeps AI-generated outputs separate from real market references.
```

Reason:

Your latest system doc says Agent mode is not a third quote provider. Quotes/news still come from Live or Mock, and agent jobs write LLM 30-day OHLC output into cache for chart overlay. 

---

## Replace old “Next Phase” section

Current “Next Phase” still says:

```txt
Moving from a prototype to a scalable platform requires shifting logic to a dedicated backend and introducing RAG.
```

This is outdated because you already built the dedicated backend, shared package, eval dashboards, usage limits, prompt evals, and controlled RAG experiment flow.

Replace “Next Phase” with:

```txt
Roadmap: From Evaluation Infrastructure to Insight Reliability
```

---

## Add cache and data lifecycle as architecture proof

Add a section or card called:

```txt
Data Lifecycle & Cache Architecture
```

Reason:

This is a real engineering differentiator. The system separates:

```txt
Memory cache
Firestore cache
Disk eval history
Portfolio persistence
React state
```

This proves you understand AI product reliability, not just UI design.

Use this framing:

```txt
Temporary market data, AI output cache, eval audit history, and persistent user portfolio data are intentionally separated so experiment logs do not get confused with market data or user records.
```

---

## Add confidence scoring as “in development,” not “complete”

Use:

```txt
Confidence scoring foundation
```

or:

```txt
Confidence score dataset development
```

Avoid:

```txt
Fully automated confidence engine
```

Reason:

The confidence dataset is being developed. The case study should be ambitious but honest.

---

## Clarify golden datasets

Do not say “golden dataset” generically.

Use:

```txt
The system separates three evaluation references: Yahoo EOD bars for prompt/chart evals, chart daily-vs-live comparison for agent runs, and static JSON golden fixtures for regression testing.
```

Your docs specifically distinguish Yahoo live golden, Yahoo dailyVsLive, and static golden JSON. 

---

## Keep Real-World Validation but move it lower

The 5/5 ease of use and 4/5 reliability feedback is useful, but it belongs after the system explanation.

Reframe it as:

```txt
Early Product Validation
```

Not:

```txt
Real-World Validation
```

Reason:

“Real-world validation” can sound too broad. “Early product validation” is more credible.

---

## Fix roadmap wording

Replace:

```txt
Vector DB (RAG)
News, History, Reflections
```

With:

```txt
RAG Expansion
Live news ingestion, historical reasoning notes, user reflections, and future vector storage.
```

Reason:

Current RAG uses demo catalog and mock news, so future vector DB should be roadmap, not current claim. Your docs list RAG index limitations honestly. 

---

## Fix typo

Replace:

```txt
Idolent Jobs
```

With:

```txt
Idempotent Jobs
```

---

# Final Version For Now

## Header / Navigation

```txt
IA
InvestAI

Motivation
Product
AI Quality
Architecture
Validation
Roadmap
Live Demo
Source
```

---

# Hero

```txt
InvestAI

AI Financial Reasoning Evaluation & Confidence Scoring Platform

Product Designer
System Architect
Full-Stack AI Engineer
Prompt Evaluation Engineer

InvestAI is a full-stack AI research platform for testing financial reasoning quality through paper trading, prompt evaluation, RAG-grounded experiments, model-tier comparison, market reference checks, and confidence score dataset development.

The project does not treat AI predictions as truth. It measures whether AI-generated financial insights are grounded, consistent, explainable, and improving over time.
```

CTA buttons:

```txt
View Live Demo
View Source Code
Read Case Study
```

Hero badges:

```txt
Prompt Evaluation
Confidence Scoring
RAG Experiments
Market Grounding
Model Comparison
Agent Jobs
Paper Trading
Full-Stack AI
```

---

# Intro Statement

```txt
InvestAI started as an AI-assisted paper trading MVP.

It has evolved into a financial reasoning evaluation platform where prompts, model tiers, retrieved context, market references, and confidence signals can be tested before AI insights are trusted.

The core product question changed from:

“What stock does the AI recommend?”

to:

“Can the system prove whether the AI insight is grounded, reliable, and improving?”
```

---

# Motivation

```txt
Research Motivation & Problem Framing

Retail investors often rely on opaque buy/sell signals, social media sentiment, influencer commentary, and static courses that are disconnected from real market behavior.

Most tools focus on prediction. Fewer tools help users evaluate the quality of their reasoning.

InvestAI reframes the problem:

The goal is not to predict the market.
The goal is to test how people and AI systems think about financial decisions.
```

Problem bullets:

```txt
There is currently no simple way to:

Test investment theories safely without real-money risk
Measure financial reasoning quality over time
Compare human and AI reasoning consistency
Separate lucky outcomes from disciplined thinking
Evaluate whether an AI insight is grounded or just confident
Track whether prompt changes actually improve AI output quality
```

My role:

```txt
My Role

Identified the gap between financial education, paper trading, and AI explanation quality
Framed the product as a reasoning and credibility measurement system, not a trading signal app
Designed the product experience, system architecture, AI workflows, and evaluation logic
Built the frontend, backend, shared types, market data flows, agent jobs, and eval dashboards
Defined constraints to avoid real-money risk, regulatory exposure, and misleading predictive claims
```

Core hypothesis:

```txt
Core Research Hypothesis

Financial reasoning and credibility can be evaluated more reliably through repeatable paper trading experiments, contextual AI explanations, behavioral consistency, and market-grounded evals than through isolated predictions or short-term gains.
```

Three principle cards:

```txt
Reasoning Quality
Can the user or AI explain the decision with context, risk, and evidence?

Risk Awareness
Does the system reward disciplined thinking instead of lucky guesses?

Consistency Over Time
Can reasoning quality be tracked across repeated experiments?
```

---

# Product Evolution

```txt
From MVP to Evaluation Platform

The first version of InvestAI was a frontend-heavy MVP focused on paper trading, AI sentiment analysis, portfolio views, and financial news.

The latest version moves the product into full-stack AI quality engineering.

InvestAI now includes a dedicated backend, modular frontend, shared TypeScript types, live/mock/agent data modes, background agent jobs, prompt evaluation dashboards, usage limits, persistent eval history, and market-grounded visual comparison.
```

Current capabilities:

```txt
Current Capabilities

Paper trading focused on learning and behavioral discipline
AI-assisted financial insight generation
Market sentiment and news context
Portfolio tracking and watchlist flows
Live/mock/agent data modes
Background agent chart jobs
Prompt eval experiments across multiple LLM tiers
Yahoo EOD comparison for prompt and chart evals
Optional RAG context for grounded experiments
Run history, deviation charts, and improvement tracking
Token/cost estimate evaluation
Structured AI output validation
Cost-aware usage limits and cached AI outputs
Confidence score dataset development
```

Status card:

```txt
Current Status

Working full-stack MVP

InvestAI is now functional as both a user-facing financial reasoning product and an engineering research system for evaluating AI output quality.
```

CTA card:

```txt
Full-Stack AI Platform

Prompt evals, agent jobs, RAG experiments, confidence score datasets, and market-grounded comparison.

Interactive Demo Available
```

---

# AI Quality System

```txt
AI Quality System

The newest version of InvestAI focuses on one question:

Can AI-generated financial reasoning be evaluated visually, repeatedly, and against market reference data?

To answer that, I built an evaluation layer that compares agent outputs against Yahoo EOD reference data, tracks prompt experiment history, records RAG context, compares model tiers, and gives operators visual proof when a prompt or model configuration improves.
```

---

## Prompt Evaluation

```txt
Prompt Evaluation Dashboard

InvestAI now includes a prompt evaluation workflow for testing whether AI outputs are actually improving.

Instead of manually judging whether a prompt sounds better, the system runs structured experiments across multiple LLM tiers and compares their outputs against Yahoo EOD reference data.

Each prompt eval can track:

Prompt version
Model tier
Yahoo EOD reference values
Quote deviation
Daily EOD deviation
RAG chunks retrieved
Token usage
Cost estimate
Improvement versus previous run
Operator-visible reasoning trail
```

Prompt loop:

```txt
Prompt version
→ Model-tier experiment
→ Optional RAG retrieval
→ Yahoo EOD comparison
→ Deviation and confidence scoring
→ Run history
→ Operator review
→ Improved future AI insight quality
```

Important note:

```txt
Prompt eval does not automatically rewrite all insight prompts yet. It validates improvements first, then the operator can promote better prompt patterns into production agent jobs and future AI insight workflows.
```

---

## Confidence Score Dataset Development

```txt
Confidence Score Dataset Development

A major next-stage focus is building confidence score datasets that help the system evaluate when an AI insight is strong, weak, risky, under-grounded, or too uncertain to trust.

The goal is not only to generate financial commentary. The goal is to score the quality of that commentary before presenting it as a trusted insight.

The confidence scoring foundation uses signals such as:

Deviation from market reference data
Model output consistency
Prompt-version performance
RAG context coverage
Token/cost efficiency
Structured AI confidence fields
Historical eval results
Operator-reviewed outcomes
Prediction input quality
```

Summary:

```txt
This creates the foundation for more accurate future AI insights because the system can learn which prompts, model tiers, and retrieved contexts produce better-aligned outputs.
```

---

## RAG-Grounded Experiments

```txt
RAG-Grounded Experiments

InvestAI uses retrieval-augmented generation as an experiment layer, not as an unquestioned authority.

When RAG is enabled, the system retrieves relevant market or news context, injects it into the prompt, records the retrieved chunks, and lets the operator compare whether RAG improved or worsened the output.

This turns RAG from a hidden black box into a measurable variable.
```

RAG cards:

```txt
Retrieve
Find relevant company, market, or news context.

Augment
Inject retrieved context into the model prompt.

Measure
Compare output against Yahoo EOD reference data.

Review
Show retrieved chunks, run logs, and deviation charts to the operator.
```

---

## Model-Tier Comparison

```txt
Model-Tier Comparison

Prompt eval experiments compare multiple OpenRouter model tiers in the same run.

This helps answer practical AI product questions:

Which model produced the lowest deviation?
Which model performed best for the cost?
Did a cheaper model perform well enough?
Did RAG help all tiers or only one?
Did the prompt improve compared to the previous version?
```

---

## Visual Proof

```txt
Visual Proof

InvestAI uses charts and run logs to make AI quality visible.

The eval dashboard can show:

Yahoo reference bars beside agent outputs
30-day EOD lines across multiple model tiers
Daily deviation charts
Run logs with prompt version and tier summaries
RAG retrieval evidence
Improvement badges compared to previous experiments
```

Proof question list:

```txt
Instead of asking, “Did the model sound convincing?”, InvestAI asks:

How far was the output from market reference data?
Did RAG reduce deviation?
Which model tier performed best for the cost?
Did the prompt improve compared to the previous run?
Can the operator inspect the reasoning trail?
Should this insight be trusted, reviewed, or downgraded?
```

---

# Engineering Highlights

```txt
Engineering Highlights

The latest development cycle focused on turning InvestAI from a prototype into a controlled AI evaluation system.
```

Feature cards:

```txt
Modular Monolith Refactor

Restructured the app into npm workspaces with separate frontend, backend, and shared TypeScript packages. This moved the project from prototype structure into a scalable full-stack system with clearer module boundaries, backend controllers, service layers, shared types, and documented architecture.
```

```txt
Live / Mock / Agent Data Modes

Separated market data sources so the platform can distinguish real market references, demo fixtures, and AI-generated experimental outputs. This prevents LLM-generated data from being treated as authoritative market data.
```

```txt
Agent Chart Jobs

Built background agent jobs that generate 30-day chart data through OpenRouter model tiers. Agent mode focuses on controlled chart experiments, cached runs, and measurable alignment against reference data instead of replacing market APIs.
```

```txt
Prompt Eval Dashboard

Created a prompt evaluation workflow that runs multiple LLM tiers in one experiment, compares outputs against Yahoo EOD reference data, and displays results through quote comparison bars, 30-day line charts, deviation charts, run logs, and improvement badges.
```

```txt
RAG-Grounded Evaluation

Added optional retrieval-augmented generation for prompt tests. The system retrieves context, injects it into the prompt, and records which chunks influenced the run so reasoning improvements can be traced.
```

```txt
Usage Limits & Demo Safety

Added separate usage limiters for agent runs and prompt tests. This protects API cost, supports a public demo environment, and keeps expensive AI operations controlled without blocking normal browsing.
```

```txt
Eval Audit Trail

Stored prompt experiments, RAG retrieval logs, estimate evals, and chart evals across browser, disk, and Firestore-backed flows so AI quality work can be reviewed over time.
```

```txt
Structured AI Validation

Added validation rules for AI insight outputs so recommendations, risks, trends, portfolio advice, accuracy fields, and confidence values must follow an expected structure before being treated as usable UI data.
```

---

# Technical Architecture

```txt
Technical Architecture

InvestAI uses a modular full-stack architecture designed around AI evaluation, market-data separation, and prompt quality measurement.
```

Architecture cards:

```txt
Frontend

React + Vite interface with feature-based modules, reusable data providers, market dashboards, paper trading views, eval dashboards, chart comparison views, and floating job-progress UI.
```

```txt
Backend

Node.js / Express API handling market-data modes, provider integration, AI orchestration, background jobs, prompt experiments, RAG retrieval, usage limits, auth status, caching, eval persistence, and structured validation.
```

```txt
Shared TypeScript Package

Common TypeScript types are shared across frontend and backend so agent jobs, eval records, market data, prompt-test results, chart evals, and confidence signals stay consistent across the system.
```

```txt
AI Layer

OpenRouter-powered model tiers are used for controlled agent experiments, prompt tests, chart jobs, and reasoning workflows. AI outputs are evaluated against reference data instead of being treated as unquestioned truth.
```

```txt
Evaluation Layer

Prompt evals compare multiple model tiers against Yahoo EOD reference data, persist run history, and visualize quote deviation, daily deviation, RAG context, token usage, and improvement over previous experiments.
```

```txt
Confidence Layer

Confidence score datasets are being developed to help future AI insights communicate reliability, uncertainty, grounding quality, and deviation risk.
```

---

## Data Lifecycle & Cache Architecture

```txt
Data Lifecycle & Cache Architecture

A major engineering decision was separating temporary market cache, AI output cache, eval audit history, portfolio persistence, and frontend display state.

This prevents experiment logs, market data, AI insights, and user holdings from being mixed together.
```

Cache cards:

```txt
Memory Cache

Short-lived server-side cache for market quotes, news, and charts. Used for fast repeated reads inside a single Node process.
```

```txt
Firestore Cache

Cross-restart cache for AI insights, predictions, market bulk data, and agent bulk data when Firebase is configured.
```

```txt
Disk Eval History

Persistent server-side JSON storage for estimate, chart, and prompt eval logs. This keeps AI quality history separate from quote caches.
```

```txt
Portfolio Persistence

User holdings are treated as persistent data, not TTL cache.
```

```txt
React State

Frontend providers hold UI display data for the current browser tab, but HTTP response caching is intentionally not handled in the frontend.
```

Architecture principle:

```txt
The system separates source data, generated AI outputs, eval history, and user records so each layer can be trusted, refreshed, inspected, or discarded independently.
```

---

# Ground Truth & Eval References

```txt
Ground Truth & Eval References

InvestAI uses multiple evaluation references instead of one vague “golden dataset.”

Yahoo EOD Reference

Used for prompt eval and chart eval comparison. Each point represents the session close for a trading day.

Prompt Eval Golden

Stored per experiment so each prompt run can be compared against the same reference values.

Chart Daily-vs-Live Comparison

Used after agent chart jobs to compare the agent-generated 30-day EOD shape against Yahoo reference bars.

Static Golden JSON

Used for regression testing quote and news agent output structure. These fixtures support CI-style checks and are separate from live Yahoo eval references.
```

Principle:

```txt
The system treats market reference data, regression fixtures, and AI-generated outputs as separate evidence types.
```

---

# Early Product Validation

```txt
Early Product Validation

5.0 / 5.0 Ease of Use
4.0 / 5.0 Reliability

Feedback from 10+ expert reviewers highlighted:

Strong educational value
Clear and intuitive interface
Useful framing around learning instead of gambling
Need for deeper data grounding and reliability checks
```

Interpretation:

```txt
This feedback shaped the next architecture phase. Instead of only improving the UI, I focused on market grounding, eval dashboards, prompt history, RAG evidence, and confidence scoring foundations.
```

---

# Limitations & Learnings

```txt
Limitations & Learnings
```

```txt
01. Market data is constrained

Financial market APIs have strict rate limits, pricing differences, delayed data, and provider-specific behavior. Reliable data access is a product architecture problem, not just an API choice.
```

```txt
02. LLM-generated market data is experimental

AI-generated market data should never be treated as authoritative. It is useful for controlled experiments, chart comparison, and prompt testing, not trading decisions.
```

```txt
03. Prompt quality needs measurement

A prompt that sounds better is not necessarily better. Visual evals, deviation metrics, and ground-truth comparison are necessary to know whether a prompt actually improved.
```

```txt
04. RAG must be inspectable

RAG helps only when retrieval is logged, inspected, and measured against output quality. Hidden retrieval does not automatically create trustworthy reasoning.
```

```txt
05. Cost control is part of AI product design

Usage limits, caching, background jobs, model-tier selection, and token estimate evals are necessary even in a demo system.
```

```txt
06. Data lifecycle matters

Temporary market data, AI insight cache, eval audit logs, and portfolio records need different storage rules. Treating all data the same creates reliability and trust problems.
```

```txt
07. Confidence should be earned

AI insights should not appear trustworthy because the model sounds confident. Confidence should come from source quality, prompt performance, deviation checks, and reviewable evidence.
```

---

# Roadmap

```txt
Roadmap: From Evaluation Infrastructure to Insight Reliability

The next phase is about connecting the evaluation layer more directly to the user-facing AI insight experience.
```

Near-term:

```txt
Near-Term

Expand confidence score datasets
Connect confidence signals to AI insight cards
Improve prompt eval comparison views
Add stronger RAG retrieval quality metrics
Store operator-reviewed prompt outcomes
Improve structured AI insight validation
Clarify source labels across Live, Mock, and Agent modes
```

Mid-term:

```txt
Mid-Term

Create reusable prompt-quality benchmarks
Compare model tiers across market conditions
Score AI insights by grounding, consistency, and deviation
Add personalized learning feedback for paper-trading users
Improve portfolio-level reasoning and risk-awareness evaluation
Expand RAG sources beyond demo catalog and mock news
```

Long-term:

```txt
Long-Term

Build an AI financial reasoning quality engine where users and AI models are evaluated by consistency, risk awareness, evidence quality, and decision discipline instead of short-term market luck.
```

Roadmap cards:

```txt
Confidence Score Engine

Turn eval results, RAG coverage, model consistency, and deviation metrics into user-facing confidence indicators.
```

```txt
RAG Expansion

Move beyond demo catalog and mock news toward richer financial context, historical reasoning notes, and future vector storage.
```

```txt
Insight Reliability Loop

Use prompt eval history to improve the quality of future AI insights while keeping operator review in the loop.
```

```txt
Multi-Market Expansion

Compare reasoning across different markets to reduce overreliance on US-only examples.
```

```txt
Learning Feedback

Help users improve decision discipline by evaluating their reasoning process, not just portfolio results.
```

---

# Final Vision

```txt
Final Vision

InvestAI is designed to become an education and credibility engine for financial reasoning.

The ultimate goal is to shift the focus from:

“Did I make money?”

to:

“Did I think correctly?”

The system rewards reasoning consistency, risk awareness, evidence quality, and disciplined decision-making.

Users test investment theories using paper trading, market data, financial news, and AI explanations while the system evaluates the reasoning process behind each decision.
```

Vision cards:

```txt
Credibility Score

Earned through reasoning behavior, not luck.
```

```txt
Learning Feedback

AI as assessor and coach, not authority.
```

```txt
Market-Grounded AI

Insights measured against reference data and retrieved context.
```

```txt
Human Review

Operators can inspect charts, logs, RAG evidence, and confidence signals before trusting outputs.
```

---

# Footer / Closing

```txt
InvestAI Case Study

InvestAI is a research-driven system designed to evaluate how people and AI systems think about investing.

AI is used as a tool for explanation, comparison, and learning, not as an unquestioned authority.

View Source
Live Demo

© 2026 InvestAI Case Study. All rights reserved.
```

---

# Short Homepage Card Version

Use this outside the case study page.

```txt
InvestAI

A full-stack AI financial reasoning platform for paper trading, prompt evaluation, confidence score dataset development, RAG-grounded experiments, model-tier comparison, and market-grounded AI insight testing.

Recently rebuilt with a modular backend, live/mock/agent data modes, background agent jobs, Yahoo EOD comparison charts, eval dashboards, usage limits, and persistent prompt experiment history.
```

Tags:

```txt
Full-Stack AI
Prompt Evaluation
Confidence Scoring
RAG
Market Data
Agent Jobs
Eval Dashboards
Financial Reasoning
```

---

# One-Sentence Portfolio Summary

```txt
Built InvestAI, a full-stack AI financial reasoning platform that uses paper trading as the user experience and prompt evaluation, RAG evidence, model-tier comparison, confidence scoring, and market-grounded eval dashboards as the AI quality backbone.
```

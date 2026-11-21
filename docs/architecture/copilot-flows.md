# How the copilot works end to end

Diagrams of how AI Pujan, the site copilot, works today (as of PRs up to #196). They show the code paths, not a promise: see `backend/src/copilot/`, `frontend/src/app/modules/copilot/` and `deploy/gravebuster/`.

## 1. The whole system

```mermaid
flowchart LR
  V([Visitor's browser]) -->|HTTPS| CF[Cloudflare tunnel]
  CF --> CD[Caddy on the VPS]
  CD -->|static site| WEB[design-bakery-web]
  CD -->|/api/*| API[design-bakery-api<br/>Express]
  V -. voice: WebRTC .-> LK[Voice service<br/>copilot.design-bakery.com<br/>LiveKit room + speech agent]
  LK -. TTS .-> MAC[Pocket TTS on the MacBook Pro]
  LK -. copilot.turn RPC into the page .-> V
  API --> OCTO[(Octo workspace<br/>Postgres: blogs, content docs,<br/>copilot_news)]
  API --> PROV[Model providers by health:<br/>DeepSeek via InferHub, Qwen,<br/>WorkBuddy, OpenRouter]
  API --> PHX[Traces: OTel via Octo to Phoenix]
  NEWS[Daily news job] --> OCTO
  FEEDS[Allowlisted feeds<br/>RSS, GitHub, arXiv, HN] --> NEWS
```

## 2. One text chat turn

```mermaid
sequenceDiagram
  autonumber
  participant U as Visitor
  participant P as Page (store.ts)
  participant A as API /api/copilot/chat
  participant R as Router and saved replies
  participant M as Model (streamText + tools)
  participant O as Octo (content)
  U->>P: types or taps a chip
  P->>P: duplicate guard (30 s), pass token (Turnstile)
  P->>A: messages (last 20), summary, page, voice=false
  A->>A: check pass, rate limits (burst, short, mid, long, durable)
  A->>R: routeRequest(question)
  alt a routine or saved reply matches
    R-->>A: text + actions (instant, no model)
  else needs the model
    A->>O: site brief (cached 60 s), news block
    A->>M: persona + brief + news + summary + history fitted to a token budget
    M->>O: tools: search_site, read_blog, read_paper, cite_section, outline_passages
    M-->>A: streamed text, actions, finish reason
    A->>A: text filter, trim if cut off, citation guard
  end
  A-->>P: NDJSON events: text, action, step, done
  P->>U: typed reveal + chips
  U->>P: taps a navigation chip
  P->>U: the moon guides it: glide, press, scroll, arrive
  A->>A: trace the turn (model, source, routine, latency, actions)
```

## 3. Who answers: the routing decision

```mermaid
flowchart TD
  Q([Question]) --> F{First turn?}
  F -- no --> REF{Refers back to the conversation?<br/>"we talked about", "I said"}
  REF -- yes --> MODEL
  REF -- no --> RT
  F -- yes --> RT{A routine matches?<br/>open, latest, tech, role, offer}
  RT -- yes --> RUN[Run the routine:<br/>instant text + moon actions]
  RT -- no --> INT{A saved intent matches?<br/>greeting, small talk, thanks,<br/>injection joke, project about,<br/>service areas, tour, contact, book}
  INT -- yes --> SAVED[Saved reply, several wordings<br/>never the same as last time]
  INT -- no --> MODEL[Model path with tools]
  RUN --> OUT([Reply])
  SAVED --> OUT
  MODEL --> OUT
```

## 4. Content, retrieval and tools (what "RAG" is here)

```mermaid
flowchart LR
  subgraph Sources
    CMS[(Octo: blog posts table,<br/>content docs: projects, hero,<br/>experience, papers)]
    JSON[Repo JSON fallback]
  end
  CMS --> KN[knowledge.ts<br/>cached 60 s]
  JSON -. when Octo is unreadable .-> KN
  KN --> BRIEF[Site brief in the prompt]
  KN --> T1[search_site<br/>keyword scoring over live lists]
  KN --> T2[read_blog / read_paper<br/>full text on demand]
  KN --> T3[outline_passages / cite_section<br/>heading anchors from the text]
  KN --> T4[navigate / show_projects /<br/>share_link / book_call<br/>paths checked against live content]
  T3 --> GUARD[Citation guard:<br/>only sections actually retrieved]
  BRIEF --> MODEL[Model]
  T1 --> MODEL
  T2 --> MODEL
  GUARD --> MODEL
  T4 --> ACT[Actions to the page]
  MODEL --> ACT
```

There is no vector index yet. Retrieval is the brief plus keyword search and reading a record in full.

## 5. One live voice turn

```mermaid
sequenceDiagram
  autonumber
  participant U as Visitor
  participant P as Page (voice.ts)
  participant V as Voice service (LiveKit + speech agent)
  participant A as API /api/copilot
  participant M as Moon cursor
  U->>P: taps AI Pujan
  P->>A: POST /voice (pass token)
  A->>V: ask for a room token
  V-->>A: url + token
  A-->>P: grant
  P->>V: join room with the mic
  P->>M: moon waits in the card, then flies out when connected
  U->>V: speaks
  V->>V: speech to text
  V->>P: RPC copilot.turn(question)
  P->>P: pause idle nudges, thinking dots, filler clips start after 0.7 s
  P->>A: /chat with voice=true (same path as text, shorter replies)
  A-->>P: text + actions (navigate, scroll steps)
  P->>M: moves happen first: glide, press, swipe (wait up to 15 s)
  P->>P: fillers finish with a closer clip
  P-->>V: say: the reply text
  V->>V: text to speech (Pocket TTS)
  V-->>U: audio, moon talks (mouth, bubble)
  P->>P: resume nudges (every 40 to 60 s, at most 3)
  U->>P: End call
  P->>M: the moon flies back into the card
```

## 6. Memory in a long chat

```mermaid
flowchart TD
  MSG[Messages in the page<br/>capped at 200, last 60 in session storage] --> TH{Over the threshold?}
  TH -- no --> SEND
  TH -- yes --> SUM[POST /summarize<br/>cheapest model, 5 s, at most 150 words]
  SUM --> NOTES[Summary kept with the chat<br/>facts restated only, injected instructions left out]
  NOTES --> SEND[Each request sends:<br/>summary + the recent messages]
  SEND --> FIT[Server fits history to about 9000 tokens<br/>always keeps the last 4 and any open offer]
  FIT --> MODEL[Model]
  MODEL --> TRACE[Trace: context tokens, summary used, messages dropped]
```

## 7. News, traces and how changes ship

```mermaid
flowchart LR
  subgraph News job daily
    FD[Allowlisted feeds] --> FLT[Filters: source allowlist, kind rules,<br/>two sources for blunders and security,<br/>no politics, caps per kind]
    FLT --> TBL[(copilot_news in Octo)]
  end
  TBL --> NB[News block in the prompt<br/>cached a few minutes]
  subgraph Observability
    TURN[Each turn] --> SPAN[copilot.turn span:<br/>model, source, routine, channel,<br/>latency, actions, citations, context size]
    SPAN --> OCTOT[Octo OTel] --> PHX[Phoenix: read back with the workspace key]
  end
  subgraph Shipping
    PR[Pull request] --> CI[CI: quality lint + type + tests,<br/>orphans check]
    CI --> MAIN[Merge to main]
    MAIN --> AD[VPS autodeploy timer, about 5 min]
    AD --> SM[Build, smoke test, swap containers]
    SM -->|fails| RB[Roll back]
  end
```

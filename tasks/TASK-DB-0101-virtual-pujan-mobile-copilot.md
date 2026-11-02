# TASK-DB-0101 — Virtual Pujan Mobile Copilot

<!-- continuity:task {"acceptance":["Owner-approved virtual-Pujan visual direction is implemented","The virtual Pujan introduces itself and converses naturally in first person using published site content","Voice call connection and listening/speaking states have immediate visual feedback with an audio-reactive planet","Navigation waits for visitor confirmation and uses a static rocket action","Mobile chat order, auto-scroll, keyboard behavior and minimized route state work as requested","Homepage project cards open internal project description pages"],"depends_on":["DB-0100","external:https://github.com/Pukujan/design-bakery/issues/143"],"goal":"Design and deliver a lively, first-person virtual Pujan voice and mobile chat experience","id":"DB-0101","issue_url":"https://github.com/Pukujan/design-bakery/issues/147","next_action":"Implement the owner-authorized virtual Pujan direction with aesthetics and UX as top priority","owner":"codex","priority":"normal","protocol_version":"0.1.0-draft","schema":"project-continuity.task.v1","status":"active","why":"Visitors should feel guided by a virtual Design Baker presence and keep context while exploring the portfolio"} -->

- Status: active — implementation authorized
- Owner: codex
- Priority: normal
- Parent: [DB-0100 / #145](https://github.com/Pukujan/design-bakery/issues/145)
- Depends on: [DB-0100 / #145](https://github.com/Pukujan/design-bakery/issues/145), [#143](https://github.com/Pukujan/design-bakery/issues/143)
- Primary writer: Codex; branch: `codex/virtual-pujan-mobile-chat`

## Goal

Design and deliver a lively, first-person virtual Pujan voice and mobile chat experience.

## Why

Visitors should feel guided by a virtual Design Baker presence and keep context while exploring the portfolio.

## Human outcome

A visitor can chat or call from the homepage or dock, hear and see a natural virtual Pujan presence forming and speaking, approve navigation, and continue browsing on mobile without losing the conversation.

## Scope

- Three generated visual directions informed the design. The owner subsequently authorized the complete plan and prioritized aesthetics and UX.
- The existing published-site-only answer boundary remains in force.
- The owner authorized implementation after visual review, prioritizing aesthetics and UX.

## Acceptance criteria

### Persona and conversation
- [ ] Present the site voice as Pujan / Design Baker's virtual presence, speaking naturally in first person and guiding visitors; make clear it is virtual, not Pujan live.
- [ ] Introduce the virtual Pujan when chat opens from either the homepage hero or floating chat button.
- [ ] Stream model responses visibly as they arrive; keep answers and summaries concise and use only website-published content.
- [ ] While a call connects, show immediate visual progress and rotate short, cached, typewriter-style warm-up lines. Examples: “Connecting now—want to ask about my experience?”, “Would you like to book a free consultation?”, “Did you know I offer managed AI copilots for individual websites?”, and “Want to talk through a service?” Keep the status honestly at “Connecting” until the voice agent joins.
- [ ] On connection, give a natural spoken and visibly streamed greeting, then transition through Listening and Speaking states. Keep the call hands-free and conversational.
- [ ] No tooltips; explain states and actions in the interface itself.

### Voice and visual direction
- [ ] Offer calling from both the homepage hero and chat panel.
- [ ] Show a star/planet gathering from the black hole and forming into the virtual Pujan while the call connects.
- [ ] Make planet rings react to the visitor's microphone while listening and agent audio while speaking.
- [ ] Keep a draggable compact call presence near the lower edge; after the visitor moves it aside, gently return it to its resting edge without obscuring content.

### Navigation and project discovery
- [ ] Ask before opening a page and continue the conversation until the visitor confirms.
- [ ] Use a small static rocket icon for navigation actions, with no rocket animation.
- [ ] Make homepage project cards open the internal project description at `/work/<slug>`; keep live-platform links separate on the description page.
- [ ] Route Contact/free-consultation intent to the Contact page, with confirmation before changing pages.
- [ ] On desktop tours, open/preserve chat and the draft when approved navigation occurs.

### Article readability
- [ ] Keep individual blog/research text legible over the galaxy with a dark reading gradient and brighter abstract/byline. Local CSS and phone-width visual check completed; production delivery pending.

### Mobile chat
- [ ] In the empty state, show suggestions above a composer anchored at the bottom of the panel.
- [ ] Scroll to the latest message when the panel opens and as replies stream.
- [ ] Keep the panel and current conversation visible above the mobile keyboard; include a visible keyboard-dismiss control.
- [ ] After approved page navigation, close the keyboard and minimize chat to a persistent strip showing a short latest-reply preview and composer; tapping restores the full conversation.

## Evidence and sources

- Owner request, screenshots and three generated mockups in the Codex conversation dated 2026-11-02.
- GitHub parent: [#145](https://github.com/Pukujan/design-bakery/issues/145). Child leaf: [#147](https://github.com/Pukujan/design-bakery/issues/147). Deployment dependency: [#143](https://github.com/Pukujan/design-bakery/issues/143).

## Next action

Implement the owner-authorized direction using the generated concepts and existing branding.

## Checkpoint log

### 2026-11-02 — request tracking and design handoff

**Completed:** Created GitHub child issue #147 under parent #145 and added this task projection. The child records the requested virtual-Pujan persona, call formation and audio states, consent-first navigation, project-card destination, and mobile chat/keyboard behavior.

**Evidence:** GitHub reports #147 as open and linked as a child of #145. Three mobile directions are visible in this conversation. The only repository edits are task/checkpoint documentation; product code has not been changed.

**Decisions:** Implementation waits for the owner's visual selection. Keep public-content-only grounding and label the presence as virtual.

**Blocked/uncertain:** The owner has not selected a visual direction yet.

**Next:** After selection, implement DB-0101 on `codex/virtual-pujan-mobile-chat`.

### 2026-11-02 — implemented interface and release verification

**Completed:** Implemented first-person virtual chat, progressive text, consent-first routing, mobile keyboard/minimized chat, portal call UI with audio-reactive waves, bounded adaptive star buildup, internal project links and quiet article reading surfaces. Contact has service/message/email flow, static consultation CTA and chat booking.

**Evidence:** Frontend typecheck, lint, backend build, production frontend build and targeted copilot/SEO/content checks passed locally. A mocked mobile conversation stayed on-page until yes, then navigated and minimized with composer retained. Phone-width research contrast was visually inspected.

**Decisions:** Owner approved adaptive quality after reviewing the performance report. Contact form must stay in-page; visitor email-app fallback was removed. Gmail delivery intentionally remains disabled pending server integration. No private Octo content is exposed.

**Blocked/uncertain:** Gmail OAuth delivery configuration and adapter remain pending owner setup. Physical older-phone and real browser microphone checks are not claimed. CI, merge and production receipt pending.

**Next:** Pass required CI, merge through GitHub auto-merge and verify Komodo production deployment.

# Study blog creator prompt (v1)

Reusable prompt for drafting a **learning-in-public** engineering blog post in Teresa's style. Copy the template below into your AI chat, fill in the placeholders, and run.

**Version:** v1  
**Folder:** `doc/useful-prompts/`  
**Placeholders:** `[PASTE TOPIC HERE]`, `[PASTE BULLETS / NOTES HERE]`

---

## How to use

1. Copy everything inside the **Prompt template** section (from `I want you to write…` through the last line).
2. Replace `[PASTE TOPIC HERE]` with your topic (one sentence or short phrase).
3. Replace `[PASTE BULLETS / NOTES HERE]` with rough notes, links, code snippets, or lessons you want covered.
4. Paste into Cursor, ChatGPT, or another model. Review and edit the draft before publishing.

---

## Prompt template

```markdown
I want you to write a well-structured Markdown study blog in my style.

Use this style:
- Direct, personal, and discovery-focused
- Clear "what I was trying to do / what went wrong / what I learned" flow
- Not too conclusive or preachy
- Make it feel like I am learning in public
- Use simple language
- Make it skimmable
- Use headings, short paragraphs, tables, and code blocks
- Avoid unnecessary theory unless it helps the lesson
- No em dashes

Formatting rules:
- Start with a clear title
- Add a short intro
- Add a Table of Contents
- Use sections with clear headings
- Include practical examples
- Include a "before vs after" table when useful
- Include "possible challenges / possible solutions" if it is technical
- Include a short takeaway near the end
- Keep the ending open-ended, like I am still exploring the idea

Mermaid chart rules:
- Use Mermaid charts where they help explain the idea visually
- Prefer vertical top-to-bottom charts
- Do not make giant unreadable charts
- Break complex ideas into 2 or 3 smaller charts instead of one huge chart
- Use readable labels
- Make charts useful, not decorative

My preferred story flow:
1. "Oh no" problem: what I was trying to do and what failed or felt messy
2. "Aha" discovery: the simple idea or solution I noticed
3. Before and after: show the difference clearly
4. Try again with a second example
5. Pattern noticed: explain why it feels repeatable
6. How you can do it too: give a simple copy-paste version
7. Optional technical deeper dive
8. Open-ended takeaway

Write the blog about this topic:

[PASTE TOPIC HERE]

Main points to include:

[PASTE BULLETS / NOTES HERE]

Important:
- Do not add unrelated advice
- Do not expand into a different topic
- Keep the blog focused on the lesson I am trying to document
- Make it feel practical and useful for people who want to try it themselves
```

---

## Story flow (quick reference)

| Step | Section | Purpose |
|------|---------|---------|
| 1 | Oh no | Set up the problem and what felt messy |
| 2 | Aha | Name the simple insight |
| 3 | Before vs after | Make the change concrete |
| 4 | Second example | Show it works again |
| 5 | Pattern noticed | Why this might repeat |
| 6 | How you can do it too | Copy-paste or minimal steps |
| 7 | Deeper dive (optional) | Technical detail only if it helps |
| 8 | Open-ended takeaway | Still exploring, not preaching |

## Style reminders

- **Voice:** first person, curious, not expert-on-a-pedestal  
- **Structure:** TOC, headings, short paragraphs, tables, code blocks  
- **Mermaid:** small, vertical, readable; split big diagrams  
- **Avoid:** em dashes, unrelated tangents, preachy conclusions  

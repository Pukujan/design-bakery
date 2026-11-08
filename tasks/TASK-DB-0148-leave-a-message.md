# TASK-DB-0148: "Leave a message" on the contact page works

**Goal.** The contact page's third way to talk showed "Not open yet": its form had no server route (a `MESSAGE_ENDPOINT` placeholder). The mail path built for the chat (TASK-DB-0137) now serves it.

**Done.**
- API `POST /api/copilot/message` (`route.ts`): name, email, message, optional area; needs the chat's visitor pass (so the same human check); 5 an hour, 2 a minute per visitor and per address; sends through `contactMail.ts` (its 20-a-day cap holds). `/config` says `messages: true` when mail is set up.
- `store.ts`: `sendSiteMessage` (renews an expired pass once) and `siteMessagesOpen`.
- `ConsultPage.tsx`: the tile opens when the API says messages are set up; a name field (the mail script needs one); the area goes in the message as `[Marketing] …`.
- `deploy/contact-mail/README.md`: both ways in, the form's limits, and that `backend/.env` overrides the launch env locally.

**Evidence.** Frontend `tsc` and backend build clean. Local web + API: Marketing → Leave a message → filled → Send gave "Message sent"; a curl to `/message` gave `{"ok":true}`. Both went through the real Apps Script, as `backend/.env` overrode the fake URL: two test emails reached the owner's inbox.

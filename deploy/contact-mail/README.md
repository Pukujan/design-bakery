# Contact mail

A visitor can ask AI Pujan, in the chat, to send Pujan a message. The copilot's `send_message` tool (`backend/src/copilot/contactMail.ts`) posts it to a Google Apps Script web app in Pujan's own Google account (`Code.gs`), which emails it to that account with the visitor's address as Reply-To.

- **Permission:** the script only sends mail as the account (`MailApp`). It cannot read the inbox.
- **Secret:** the API holds the web app's URL and a token; the script refuses a post without the token. A leak lets someone email Pujan, nothing more. Revoke by changing the `TOKEN` property or archiving the deployment.
- **Limits:** Google allows 100 emails a day on a personal account. The API also sends at most 20 a day and one per chat reply, and only after the visitor confirmed the read-back.
- **Chat only:** voice calls don't offer it (an email address spelled by voice goes wrong too easily).
- **Not stored:** the email in Gmail is the record; nothing is written to Octo.

## Env (API)

| Name | What |
|------|------|
| `CONTACT_MAIL_URL` | The web app URL, ending in `/exec` |
| `CONTACT_MAIL_TOKEN` | A random secret, the same as the script's `TOKEN` property |

Unset, the copilot shows an "Email me" `mailto:` link instead.

## Setup (once, in your browser)

1. Open [script.google.com](https://script.google.com), signed in as pujan3645@gmail.com, and make a new project named "design-bakery contact mail".
2. Replace `Code.gs` with this folder's `Code.gs`.
3. Project Settings → Script properties → add `TOKEN` with the value of `CONTACT_MAIL_TOKEN`.
4. Deploy → New deployment → Web app. Execute as: **Me**. Who has access: **Anyone**. Deploy, and approve the "Send email as you" permission (Google warns the app is unverified because it's yours: Advanced → Go to project).
5. Copy the web app URL into `CONTACT_MAIL_URL` in `backend/.env` and on the VPS in `~/apps/design-bakery/deploy/vps/.env.api`, then redeploy the API.

To change the script later: Deploy → Manage deployments → edit → New version. The URL stays the same.

## Check

```bash
curl -sL "$CONTACT_MAIL_URL" -H 'content-type: application/json' -d "{\"token\":\"$CONTACT_MAIL_TOKEN\",\"name\":\"Test\",\"email\":\"test@example.com\",\"message\":\"Hello from the setup check\"}"
```

Leave out `-X POST`: Google answers with a redirect, and curl must follow it with a GET (`-d` already makes the first request a POST). It answers `{"ok":true}` and the email arrives. A wrong token answers `{"ok":false,"error":"unauthorized"}`.

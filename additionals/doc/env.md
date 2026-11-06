# Environment variables

Monorepo layout:

| Package | Folder | Env file |
|---------|--------|----------|
| **Frontend** | `frontend/` | `frontend/.env` |
| **Backend** | `backend/` | `backend/.env` |

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

- **Frontend** — `VITE_*` only (Firebase web config, feature flags, `VITE_BLOG_API_URL`, optional **`VITE_SUPABASE_URL`** + **`VITE_SUPABASE_ANON_KEY`** for fast public blog reads)
- **Backend** — secrets (`OPENROUTER_API_KEY`, Octo workspace key, optional legacy Supabase Storage)

**Blog images:** Octo file API via `OCTO_WORKSPACE_ID` + `OCTO_API_KEY`. A new upload is published to `https://files.design-bakery.com/<fileId>`. `ASSET_PUBLIC_BASE_URL` is only the legacy `/api/public/assets/:fileId` proxy. `SUPABASE_*` remains only so already-published Supabase object URLs can still be deleted.

**Public blog reads (browser):** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `frontend/.env` / the frontend build env — use the **anon public** key from the dashboard, **not** `SUPABASE_SERVICE_ROLE_KEY`. See [Get the anon key](#get-the-supabase-anon-key) below.

**Legacy:** Firebase Storage still works if `IMAGE_STORAGE=firebase` and Firebase Admin creds are set.

Firebase callable source lives in `backend/services/` (optional deploy; the Express API container on the VPS is the prod path).

## Local dev

```bash
pnpm run dev          # frontend + optional Functions emulator
pnpm run dev:stack    # frontend + Express API (:8787)
pnpm run dev:web      # frontend only
pnpm run dev:api      # backend only
```

## Production

| Host | Root directory | Env |
|------|----------------|-----|
| **Frontend build** | `frontend` | `frontend/.env.example` |
| **API container (VPS)** | `backend` | `backend/.env.example` → `deploy/vps/.env.api` |

See [docs/self-hosting.md](../../docs/self-hosting.md).

### Copilot models

The chat and voice copilot try hosted models in order (`backend/src/copilot/providers.ts`); a model is used only when its key is set in `deploy/vps/.env.api`. `SMART_ANTHROPIC_KEY` (an Anthropic API key) puts Claude Haiku (`claude-haiku-5-5`, change with `SMART_ANTHROPIC_MODEL`) first: about 1 s for a short answer, against about 2 to 3.5 s for DeepSeek. It is paid, and `COPILOT_DAILY_TOKENS` caps the day. Then come `SMART_DEEPSEEK_KEY`, `SMART_QWEN_KEY`, `SMART_WORKBUDDY_KEY` and `SMART_OPENROUTER_KEY`, and LFM3 on the Pro (`INFERHUB_API_KEY`) last. Unset the Anthropic key to go back to DeepSeek first.

### Copilot bot check (Turnstile)

`TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in `deploy/vps/.env.api` turn on Cloudflare Turnstile for the chat (`backend/src/copilot/guard.ts`): every chat call needs a signed pass, given only after the check. Addresses in `COPILOT_RATE_EXEMPT_IPS` (the owner's) skip it. The widget runs in interaction-only mode, so most visitors never see it. When it does ask, it appears in the chat itself, just above the box the visitor typed in, with a line saying why (`frontend/src/app/modules/copilot/TurnstileSlot.tsx`). It falls back to the page corner only when no chat is on screen.

To see it locally, run the API with Cloudflare's public test keys, `TURNSTILE_SITE_KEY=3x00000000000000000000FF` (always asks for a click) and `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA` (always passes), and with `COPILOT_RATE_EXEMPT_IPS` unset.

## Get the Supabase anon key

Use the same Supabase project as `backend/.env` (`SUPABASE_URL`).

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Project Settings** (gear) → **API**.
3. Copy **Project URL** → `VITE_SUPABASE_URL` (same host as `SUPABASE_URL` in backend).
4. Under **Project API keys**, copy **`anon` `public`** (sometimes labeled “anon key” or “Publishable”).
5. Paste into `frontend/.env` as `VITE_SUPABASE_ANON_KEY=...` and in the frontend build env for production.

Do **not** copy **`service_role`** into the frontend — that key bypasses RLS and must stay in `backend/.env` / the API's `.env.api` on the VPS only.

After editing `frontend/.env`, restart `pnpm run dev` or `pnpm run dev:stack`.

## Split combined env

```bash
pnpm run env:split
```

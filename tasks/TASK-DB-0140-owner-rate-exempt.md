# TASK-DB-0140: owner exemption from the copilot's request limits

**Goal.** Let the owner and their network test the live copilot without being throttled (burst was 4 per 20 s, which a normal
testing pace trips and shows "Sorry, the response was interrupted").

**Done.**
- `fairUse.ts`: `createExemptMatcher(list = COPILOT_RATE_EXEMPT_IPS)`, built once at start in `route.ts`. Comma-separated IPv4/IPv6
  addresses or CIDR ranges (via `node:net` `BlockList`; IPv4-mapped IPv6 forms of a listed IPv4 match). Malformed entries (bad
  address, bad or out-of-range prefix, extra `/`) are skipped whole, never widened. Unset or empty means nobody is exempt.
- `route.ts`: an exempt address skips the in-memory burst/short/mid/long limits (per IP and per session) and the durable limit on
  `/chat`, and the per-IP/session limits on `/voice` and `/summarize`. Everything else is unchanged: the pass (Turnstile) check
  runs first, and the **daily token budget still applies** to exempt requests, so a loop cannot burn money.
- `tracing.ts`: exempt turns carry `copilot.exempt: true` on the `copilot.turn` span. Nothing about the address is logged or traced.
- `backend/.env.example` documents `COPILOT_RATE_EXEMPT_IPS` (documentation addresses only). No real address is in code, tests or docs.
- Test: `pnpm test:copilot-exempt` (matching for IPv4, IPv6, CIDR, malformed; limiter bypass vs a non-exempt address; budget closes
  for all), added to CI.

**Spoof-safety.** The matcher checks `clientIp()` (guard.ts): `cf-connecting-ip`, else the first `x-forwarded-for` entry, else the
socket address. Both headers are client-controlled unless a trusted proxy sets them, so the exemption is only safe while the API is
reachable through Cloudflare (which overwrites `cf-connecting-ip`) and Caddy alone.
What `deploy/gravebuster` shows: the `api` service publishes `127.0.0.1:${API_HOST_PORT:-8789}:8787` only (loopback, never the
LAN/WAN), and Caddy reaches it as `api:8787` over the compose network; Caddy itself is `:80` behind the Cloudflare Tunnel with
`auto_https off`, and `web` is also published on loopback only. So the api container accepts no outside connections other than via
Caddy, and Caddy only via the tunnel. Remaining exposure: a process on the gravebuster host itself (loopback) or on the compose/edge
networks could send a forged `cf-connecting-ip`; that is accepted for a box where only the owner's services run. Keep it so: never
publish the api port on a public interface or add another ingress that bypasses Cloudflare. Not verified live (the server was not touched).

**Not done, by design.** The variable is not set on the server. After the owner's approval, set `COPILOT_RATE_EXEMPT_IPS` in the
api's Komodo/deploy environment (`deploy/gravebuster/.env.api` on the host), with the owner's public IPv4 and IPv6 (a /64 for a
home IPv6 prefix, as privacy addresses rotate), then redeploy through the normal GitHub → Komodo path. Check in Phoenix that
`copilot.exempt` is true on the owner's turns.

**Next.** Rebase after #197/#198 if `route.ts` conflicts (small edits at the limiter calls, the durable-limit call and `turn.exempt`).

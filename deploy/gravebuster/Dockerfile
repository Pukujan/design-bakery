# syntax=docker/dockerfile:1
#
# design-bakery on gravebuster (TASK-DB-0055).
#
# Stage 1 reproduces the Vercel build exactly (`installCommand` / `buildCommand` /
# `outputDirectory` from vercel.json), stage 2 serves `frontend/dist` with Caddy using
# deploy/gravebuster/Caddyfile, which reproduces every redirect/rewrite in vercel.json.
#
# Build from the repo root:
#   docker build -f deploy/gravebuster/Dockerfile -t design-bakery-web:local .

ARG NODE_IMAGE=node:24-bookworm-slim
ARG CADDY_IMAGE=caddy:2-alpine

# ---------------------------------------------------------------- build (pnpm/vite)
FROM ${NODE_IMAGE} AS build

ENV CI=1 \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

# pnpm version comes from package.json "packageManager" (pnpm@10.32.1); Node 24 is
# pinned by .node-version.
RUN corepack enable

WORKDIR /repo

# Workspace manifests first so the (slow) dependency layer survives source edits.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
COPY backend/services/package.json ./backend/services/
COPY packages/cover-studio-kit/package.json ./packages/cover-studio-kit/

# Same as vercel.json "installCommand". --frozen-lockfile keeps builds reproducible;
# the lockfile is the only source of truth for dependency versions.
RUN pnpm install --frozen-lockfile

# Optional build-time config, mirroring the VITE_* variables the Vercel build gets
# (frontend/.env.example). All are public values inlined into the bundle — never put
# backend secrets here. Empty values are treated as "unset" by the app, so an
# unconfigured deploy still builds: the blog then falls back to the committed
# frontend/src/app/modules/blog/data/blog-data.json snapshot.
# Supply them via deploy/gravebuster/.env (git-ignored) — see docs/self-hosting.md.
ARG VITE_SITE_URL=
ARG VITE_BLOG_API_URL=
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=
ARG VITE_CONTENT_BACKEND=
ARG VITE_ENABLE_BLOG_PUBLISH_KIT=
ENV VITE_SITE_URL=${VITE_SITE_URL} \
    VITE_BLOG_API_URL=${VITE_BLOG_API_URL} \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_CONTENT_BACKEND=${VITE_CONTENT_BACKEND} \
    VITE_ENABLE_BLOG_PUBLISH_KIT=${VITE_ENABLE_BLOG_PUBLISH_KIT}

COPY . .

# Same as vercel.json "buildCommand". frontend prebuild regenerates public/sitemap.xml
# (falls back to the committed blog-data.json when no API/Supabase env is present).
RUN pnpm --dir frontend run build

# ---------------------------------------------------------------- runtime (caddy)
FROM ${CADDY_IMAGE} AS runtime

COPY deploy/gravebuster/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/frontend/dist /srv

# Plain HTTP inside the container; TLS terminates at the Cloudflare Tunnel edge.
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

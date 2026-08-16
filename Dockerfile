# syntax=docker/dockerfile:1

# =============================================================================
# STL Shelf production image
#
# Multi-stage build for the TanStack Start app running on Bun.
#   - builder: installs all deps (incl. dev) and runs `bun run build`
#   - runner:  ships the built app + node_modules and runs `bun start`
#             (`bun start` applies DB migrations, then binds the server)
#
# Designed to be built by Coolify (Dockerfile or Docker Compose build pack).
# The server listens on $PORT (default 3000).
# =============================================================================

# ----------------------------------------------------------------------------
# Stage 1 — builder
# ----------------------------------------------------------------------------
FROM oven/bun:1.3.5 AS builder

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Client-side (VITE_*) env vars are inlined into the bundle by Vite at build
# time, so they must be present here — setting them only at container runtime
# is too late. The Turnstile site key is public; default to Cloudflare's
# "always passes" test key (pairs with the test secret key defaulted in the
# compose file) so captcha — and therefore sign-up/sign-in — works out of the
# box. Override via build args (Coolify passes it from TURNSTILE_SITE_KEY).
ARG VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

# Copy the rest of the source and build.
COPY . .
RUN bun run build

# ----------------------------------------------------------------------------
# Stage 2 — runner
# ----------------------------------------------------------------------------
FROM oven/bun:1.3.5-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Runtime artifacts. The production server (server.ts) imports ./dist, and
# `bun run db:migrate` (part of `bun start`) reads scripts/, src/ (the
# @/lib/db/migrations path alias) and the drizzle/ journal + SQL files.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

# `bun start` = `bun run db:migrate && bun run server.ts`.
# A failed migration aborts startup (exit 1) so a bad deploy never serves.
CMD ["bun", "run", "start"]

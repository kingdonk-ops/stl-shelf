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

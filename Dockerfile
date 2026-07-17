# Archery club FRONTEND image (SvelteKit + adapter-node).
# Built by CI for linux/arm64 (the Pi) and pushed to GHCR; the Pi only pulls.
#
# adapter-node produces a self-contained Node server in /app/build, run with
# `node build`. The public API base URL (PUBLIC_API_BASE_URL) is read at RUNTIME
# via $env/dynamic/public (src/lib/api.ts) — nothing is baked at build time; the
# compose service sets it as an env var (same-origin /api). The reverse proxy
# serves the app at / and proxies /api/* to the backend (same origin).

# ---- build stage ----
FROM node:24-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime stage ----
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# adapter-node listens on PORT (default 3000). The reverse proxy targets frontend:3000.
ENV PORT=3000
EXPOSE 3000

# Only the built server + the production node_modules it needs.
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

CMD ["node", "build"]

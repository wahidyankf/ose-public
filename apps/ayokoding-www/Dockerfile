# Build context: workspace root (../../ from this file)
# Invoked via: docker compose -f infra/dev/ayokoding-www/docker-compose.yml

FROM node:24-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/ayokoding-www/package.json ./apps/ayokoding-www/
COPY libs/web-ui/package.json ./libs/web-ui/
COPY libs/web-ui-token/package.json ./libs/web-ui-token/
RUN npm ci --ignore-scripts

FROM node:24-alpine AS builder
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/ayokoding-www/node_modules ./apps/ayokoding-www/node_modules
COPY apps/ayokoding-www/ ./apps/ayokoding-www/
# Provide shared libs as resolvable node_modules packages
COPY libs/web-ui/src/ ./node_modules/@open-sharia-enterprise/web-ui/src/
COPY libs/web-ui/package.json ./node_modules/@open-sharia-enterprise/web-ui/
COPY libs/web-ui-token/src/ ./node_modules/@open-sharia-enterprise/web-ui-token/src/
COPY libs/web-ui-token/package.json ./node_modules/@open-sharia-enterprise/web-ui-token/
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /workspace/apps/ayokoding-www
RUN npm run build

FROM node:24-alpine AS runner

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/ose-public"
LABEL org.opencontainers.image.description="AyoKoding educational content platform built with Next.js"

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV AYOKODING_WWW_PORT=3101

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (includes node_modules and server.js)
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ayokoding-www/.next/standalone ./
# Copy static assets
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ayokoding-www/.next/static ./apps/ayokoding-www/.next/static
# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ayokoding-www/public ./apps/ayokoding-www/public
# Copy content files (for runtime fs.readFile — not included in .next/standalone)
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ayokoding-www/content ./apps/ayokoding-www/content
# course-paths plan (Phase 3): the e2e fixture manifest set this docker-compose flow points
# AYOKODING_WEB_MANIFESTS_DIR at (infra/dev/ayokoding-www/docker-compose.yml) — copied straight from
# the build context (not the `builder` stage) since it is never part of the Next.js build itself.
COPY --chown=nextjs:nodejs apps/ayokoding-www-fe-e2e/fixtures/manifests ./apps/ayokoding-www-fe-e2e/fixtures/manifests

COPY --chown=nextjs:nodejs scripts/next-with-port.mjs scripts/next-with-port.mjs
COPY --chown=nextjs:nodejs libs/ts-env-loader/src/port-resolver.ts libs/ts-env-loader/src/port-resolver.ts
USER nextjs
EXPOSE 3101

# server.js is at apps/ayokoding-www/server.js in standalone output
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["sh", "-c", "wget --no-verbose --tries=1 --spider http://localhost:${AYOKODING_WWW_PORT}/ || exit 1"]

CMD ["node", "scripts/next-with-port.mjs", "--env", "AYOKODING_WWW_PORT", "--default", "3101", "--server", "apps/ayokoding-www/server.js"]

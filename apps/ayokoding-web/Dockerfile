# Build context: workspace root (../../ from this file)
# Invoked via: docker compose -f infra/dev/ayokoding-web/docker-compose.yml

FROM node:24-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/ayokoding-web/package.json ./apps/ayokoding-web/
COPY libs/ts-ui/package.json ./libs/ts-ui/
COPY libs/ts-ui-tokens/package.json ./libs/ts-ui-tokens/
RUN npm ci --ignore-scripts

FROM node:24-alpine AS builder
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/ayokoding-web/node_modules ./apps/ayokoding-web/node_modules
COPY apps/ayokoding-web/ ./apps/ayokoding-web/
# Provide shared libs as resolvable node_modules packages
COPY libs/ts-ui/src/ ./node_modules/@open-sharia-enterprise/ts-ui/src/
COPY libs/ts-ui/package.json ./node_modules/@open-sharia-enterprise/ts-ui/
COPY libs/ts-ui-tokens/src/ ./node_modules/@open-sharia-enterprise/ts-ui-tokens/src/
COPY libs/ts-ui-tokens/package.json ./node_modules/@open-sharia-enterprise/ts-ui-tokens/
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/ayokoding-web && npm run build

FROM node:24-alpine AS runner

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/open-sharia-enterprise"
LABEL org.opencontainers.image.description="AyoKoding educational content platform built with Next.js"

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3101

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (includes node_modules and server.js)
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ayokoding-web/.next/standalone ./
# Copy static assets
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ayokoding-web/.next/static ./apps/ayokoding-web/.next/static
# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ayokoding-web/public ./apps/ayokoding-web/public
# Copy content files (for runtime fs.readFile — not included in .next/standalone)
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ayokoding-web/content ./apps/ayokoding-web/content

USER nextjs
EXPOSE 3101

# server.js is at apps/ayokoding-web/server.js in standalone output
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3101/ || exit 1

CMD ["node", "apps/ayokoding-web/server.js"]

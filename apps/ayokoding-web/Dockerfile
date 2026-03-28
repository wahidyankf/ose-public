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
COPY libs/ts-ui/src/ ./libs/ts-ui/src/
COPY libs/ts-ui/package.json ./libs/ts-ui/
COPY libs/ts-ui-tokens/src/ ./libs/ts-ui-tokens/src/
COPY libs/ts-ui-tokens/package.json ./libs/ts-ui-tokens/
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/ayokoding-web && npm run build

FROM node:24-alpine AS runner
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
CMD ["node", "apps/ayokoding-web/server.js"]

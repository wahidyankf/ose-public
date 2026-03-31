FROM node:24-alpine AS deps
WORKDIR /workspace
COPY ../../package.json ../../package-lock.json ./
COPY apps/oseplatform-web/package.json apps/oseplatform-web/
COPY libs/ts-ui/package.json libs/ts-ui/
COPY libs/ts-ui-tokens/package.json libs/ts-ui-tokens/
RUN npm ci --ignore-scripts

FROM node:24-alpine AS builder
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY apps/oseplatform-web/ apps/oseplatform-web/
COPY libs/ts-ui/ libs/ts-ui/
COPY libs/ts-ui-tokens/ libs/ts-ui-tokens/
COPY libs/ts-ui/src/ ./node_modules/@open-sharia-enterprise/ts-ui/src/
COPY libs/ts-ui/package.json ./node_modules/@open-sharia-enterprise/ts-ui/
COPY libs/ts-ui-tokens/src/ ./node_modules/@open-sharia-enterprise/ts-ui-tokens/src/
COPY libs/ts-ui-tokens/package.json ./node_modules/@open-sharia-enterprise/ts-ui-tokens/
WORKDIR /workspace/apps/oseplatform-web
RUN npx tsx src/scripts/generate-search-data.ts
RUN npm run build

FROM node:24-alpine AS runner

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/open-sharia-enterprise"
LABEL org.opencontainers.image.description="OSE Platform content website built with Next.js"

WORKDIR /workspace
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3100
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/oseplatform-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/oseplatform-web/.next/static apps/oseplatform-web/.next/static
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/oseplatform-web/public apps/oseplatform-web/public
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/oseplatform-web/content apps/oseplatform-web/content
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/oseplatform-web/generated apps/oseplatform-web/generated
USER nextjs
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3100/ || exit 1

CMD ["node", "apps/oseplatform-web/server.js"]

FROM node:24-alpine AS deps
WORKDIR /workspace
COPY ../../package.json ../../package-lock.json ./
COPY apps/ose-www/package.json apps/ose-www/
COPY libs/ts-env-loader/package.json libs/ts-env-loader/
COPY libs/web-ui/package.json libs/web-ui/
COPY libs/web-ui-token/package.json libs/web-ui-token/
RUN npm ci --ignore-scripts

FROM node:24-alpine AS builder
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY apps/ose-www/ apps/ose-www/
COPY libs/ts-env-loader/ libs/ts-env-loader/
COPY libs/web-ui/ libs/web-ui/
COPY libs/web-ui-token/ libs/web-ui-token/
COPY libs/ts-env-loader/src/ ./node_modules/@open-sharia-enterprise/ts-env-loader/src/
COPY libs/ts-env-loader/package.json ./node_modules/@open-sharia-enterprise/ts-env-loader/
COPY libs/web-ui/src/ ./node_modules/@open-sharia-enterprise/web-ui/src/
COPY libs/web-ui/package.json ./node_modules/@open-sharia-enterprise/web-ui/
COPY libs/web-ui-token/src/ ./node_modules/@open-sharia-enterprise/web-ui-token/src/
COPY libs/web-ui-token/package.json ./node_modules/@open-sharia-enterprise/web-ui-token/
WORKDIR /workspace/apps/ose-www
RUN npx tsx src/scripts/generate-search-data.ts
RUN npm run build

FROM node:24-alpine AS runner

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/ose-public"
LABEL org.opencontainers.image.description="OSE Platform content website built with Next.js"

WORKDIR /workspace
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV OSE_WWW_PORT=3100
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ose-www/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ose-www/.next/static apps/ose-www/.next/static
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ose-www/public apps/ose-www/public
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ose-www/content apps/ose-www/content
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/ose-www/generated apps/ose-www/generated
COPY --chown=nextjs:nodejs scripts/next-with-port.mjs scripts/next-with-port.mjs
COPY --chown=nextjs:nodejs libs/ts-env-loader/src/port-resolver.ts libs/ts-env-loader/src/port-resolver.ts
USER nextjs
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${OSE_WWW_PORT}/ || exit 1

CMD ["node", "scripts/next-with-port.mjs", "--env", "OSE_WWW_PORT", "--default", "3100", "--server", "apps/ose-www/server.js"]

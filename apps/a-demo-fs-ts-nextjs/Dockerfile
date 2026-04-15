FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/a-demo-fs-ts-nextjs/package.json ./apps/a-demo-fs-ts-nextjs/
RUN npm ci --ignore-scripts

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/a-demo-fs-ts-nextjs/node_modules ./apps/a-demo-fs-ts-nextjs/node_modules
COPY package.json ./
COPY apps/a-demo-fs-ts-nextjs/src/ ./apps/a-demo-fs-ts-nextjs/src/
COPY apps/a-demo-fs-ts-nextjs/public/ ./apps/a-demo-fs-ts-nextjs/public/
COPY apps/a-demo-fs-ts-nextjs/package.json apps/a-demo-fs-ts-nextjs/tsconfig.json apps/a-demo-fs-ts-nextjs/next.config.ts apps/a-demo-fs-ts-nextjs/postcss.config.mjs ./apps/a-demo-fs-ts-nextjs/
# Provide shared tokens as a resolvable node_modules package
COPY libs/ts-ui-tokens/src/ ./node_modules/@open-sharia-enterprise/ts-ui-tokens/src/
COPY libs/ts-ui-tokens/package.json ./node_modules/@open-sharia-enterprise/ts-ui-tokens/
COPY specs/apps/a-demo/contracts/generated/ ./specs/apps/a-demo/contracts/generated/
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/apps/a-demo-fs-ts-nextjs
RUN npx @hey-api/openapi-ts -i ../../specs/apps/a-demo/contracts/generated/openapi-bundled.yaml -o src/generated-contracts -s
RUN npx next build

FROM node:24-alpine AS runner

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/ose-public"
LABEL org.opencontainers.image.description="Demo fullstack application built with TypeScript and Next.js"

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/a-demo-fs-ts-nextjs/public ./apps/a-demo-fs-ts-nextjs/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/a-demo-fs-ts-nextjs/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/a-demo-fs-ts-nextjs/.next/static ./apps/a-demo-fs-ts-nextjs/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => r.statusCode === 200 ? process.exit(0) : process.exit(1)).on('error', () => process.exit(1))"

CMD ["node", "apps/a-demo-fs-ts-nextjs/server.js"]

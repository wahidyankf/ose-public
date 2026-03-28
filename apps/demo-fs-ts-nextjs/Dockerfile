FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/demo-fs-ts-nextjs/package.json ./apps/demo-fs-ts-nextjs/
COPY libs/ts-ui-tokens/package.json ./libs/ts-ui-tokens/
RUN npm ci --ignore-scripts

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/demo-fs-ts-nextjs/node_modules ./apps/demo-fs-ts-nextjs/node_modules
COPY package.json ./
COPY apps/demo-fs-ts-nextjs/src/ ./apps/demo-fs-ts-nextjs/src/
COPY apps/demo-fs-ts-nextjs/public/ ./apps/demo-fs-ts-nextjs/public/
COPY apps/demo-fs-ts-nextjs/package.json apps/demo-fs-ts-nextjs/tsconfig.json apps/demo-fs-ts-nextjs/next.config.ts apps/demo-fs-ts-nextjs/vitest.config.ts apps/demo-fs-ts-nextjs/postcss.config.mjs ./apps/demo-fs-ts-nextjs/
COPY libs/ts-ui-tokens/src/ ./libs/ts-ui-tokens/src/
COPY libs/ts-ui-tokens/package.json ./libs/ts-ui-tokens/
COPY specs/apps/demo/contracts/generated/ ./specs/apps/demo/contracts/generated/
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/apps/demo-fs-ts-nextjs
RUN npx @hey-api/openapi-ts -i ../../specs/apps/demo/contracts/generated/openapi-bundled.yaml -o src/generated-contracts -s
RUN npx next build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/demo-fs-ts-nextjs/public ./apps/demo-fs-ts-nextjs/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/demo-fs-ts-nextjs/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/demo-fs-ts-nextjs/.next/static ./apps/demo-fs-ts-nextjs/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/demo-fs-ts-nextjs/server.js"]

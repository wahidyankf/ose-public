# Build context: workspace root (../../.. from infra/dev/a-demo-fe-ts-nextjs/)
FROM node:24-alpine AS deps
WORKDIR /app
# Install only the app's own dependencies (not workspace mode)
COPY apps/a-demo-fe-ts-nextjs/package.json ./
RUN npm install

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/a-demo-fe-ts-nextjs/src/ ./src/
COPY apps/a-demo-fe-ts-nextjs/package.json apps/a-demo-fe-ts-nextjs/tsconfig.json apps/a-demo-fe-ts-nextjs/next.config.ts apps/a-demo-fe-ts-nextjs/postcss.config.mjs ./
# Copy shared tokens as a resolvable node_modules package
COPY libs/ts-ui-tokens/src/ ./node_modules/@open-sharia-enterprise/ts-ui-tokens/src/
COPY libs/ts-ui-tokens/package.json ./node_modules/@open-sharia-enterprise/ts-ui-tokens/
COPY specs/apps/a-demo/contracts/generated/ ./specs/apps/a-demo/contracts/generated/
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx @hey-api/openapi-ts -i specs/apps/a-demo/contracts/generated/openapi-bundled.yaml -o src/generated-contracts -s
ARG BACKEND_URL=http://demo-be:8201
ENV BACKEND_URL=${BACKEND_URL}
RUN npx next build

FROM node:24-alpine

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/ose-public"
LABEL org.opencontainers.image.description="Demo frontend built with TypeScript and Next.js"

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3301
ENV PORT=3301 HOSTNAME="0.0.0.0" NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3301/ || exit 1

CMD ["node", "server.js"]

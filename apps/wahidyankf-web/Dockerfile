# Build context: workspace root (../../.. from infra/dev/wahidyankf/)
FROM node:24-alpine AS build
WORKDIR /app

COPY apps/wahidyankf-web/package.json ./
RUN npm install --ignore-scripts

COPY apps/wahidyankf-web/src/ ./src/
COPY apps/wahidyankf-web/public/ ./public/
COPY apps/wahidyankf-web/package.json apps/wahidyankf-web/tsconfig.json apps/wahidyankf-web/next.config.ts apps/wahidyankf-web/postcss.config.mjs ./

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM node:24-alpine

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/ose-public"
LABEL org.opencontainers.image.description="Wahidyan Kresna Fridayoka personal portfolio site built with Next.js"

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3201
ENV PORT=3201 HOSTNAME="0.0.0.0" NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3201/ || exit 1

CMD ["node", "server.js"]

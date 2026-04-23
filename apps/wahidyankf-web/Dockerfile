# Build context: workspace root (../../.. from infra/dev/wahidyankf/)
FROM node:24-alpine AS build
WORKDIR /app

# Copy app package.json and strip workspace dependency before install
COPY apps/wahidyankf-web/package.json ./
RUN node -e " \
  const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  delete pkg.dependencies['@open-sharia-enterprise/ts-ui']; \
  require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
" && npm install --ignore-scripts

# Install ts-ui transitive dependencies not already in wahidyankf-web
RUN npm install --save radix-ui@^1.0.0 --ignore-scripts

# Copy workspace libs as resolvable node_modules packages
COPY libs/ts-ui/src/ ./node_modules/@open-sharia-enterprise/ts-ui/src/
COPY libs/ts-ui/package.json ./node_modules/@open-sharia-enterprise/ts-ui/
COPY libs/ts-ui-tokens/src/ ./node_modules/@open-sharia-enterprise/ts-ui-tokens/src/
COPY libs/ts-ui-tokens/package.json ./node_modules/@open-sharia-enterprise/ts-ui-tokens/

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

# Build context: workspace root (../../.. from infra/dev/organiclever-www/)
FROM node:24-alpine AS build
WORKDIR /app

# Copy app package.json and strip workspace dependencies before install
COPY apps/organiclever-www/package.json ./
RUN node -e " \
  const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  delete pkg.dependencies['@open-sharia-enterprise/web-ui']; \
  delete pkg.dependencies['@open-sharia-enterprise/web-ui-token']; \
  require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
" && npm install --ignore-scripts

# Install web-ui transitive dependencies (web-ui is transpiled + Tailwind-scanned via @source)
RUN npm install --save \
  radix-ui@^1.0.0 \
  class-variance-authority@^0.7.0 \
  clsx@^2.1.1 \
  lucide-react@0.577.0 \
  tailwind-merge@^2.5.3 \
  --ignore-scripts

# Copy workspace libs as resolvable node_modules packages
COPY libs/web-ui/src/ ./node_modules/@open-sharia-enterprise/web-ui/src/
COPY libs/web-ui/package.json ./node_modules/@open-sharia-enterprise/web-ui/
COPY libs/web-ui-token/src/ ./node_modules/@open-sharia-enterprise/web-ui-token/src/
COPY libs/web-ui-token/package.json ./node_modules/@open-sharia-enterprise/web-ui-token/

COPY apps/organiclever-www/src/ ./src/
COPY apps/organiclever-www/package.json apps/organiclever-www/tsconfig.json apps/organiclever-www/next.config.ts apps/organiclever-www/postcss.config.mjs ./

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM node:24-alpine

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/ose-public"
LABEL org.opencontainers.image.description="OrganicLever marketing website built with Next.js"

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/.next ./.next
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./package.json
COPY --chown=app:app scripts/next-with-port.mjs scripts/next-with-port.mjs
COPY --chown=app:app libs/ts-env-loader/src/port-resolver.ts libs/ts-env-loader/src/port-resolver.ts
USER app
EXPOSE 3200
ENV ORGANICLEVER_WWW_PORT=3200 HOSTNAME="0.0.0.0" NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["sh", "-c", "wget --no-verbose --tries=1 --spider http://localhost:${ORGANICLEVER_WWW_PORT}/ || exit 1"]

CMD ["node", "scripts/next-with-port.mjs", "start", "--env", "ORGANICLEVER_WWW_PORT", "--default", "3200", "-H", "0.0.0.0"]

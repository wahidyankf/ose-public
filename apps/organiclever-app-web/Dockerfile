# Build context: workspace root (../../.. from infra/dev/organiclever/)
FROM node:24-alpine AS build
WORKDIR /app

# Copy app package.json and strip workspace dependency before install
COPY apps/organiclever-app-web/package.json ./
RUN node -e " \
  const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  delete pkg.dependencies['@open-sharia-enterprise/web-ui']; \
  require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
" && npm install --ignore-scripts --legacy-peer-deps

# Install web-ui transitive dependencies
RUN npm install --save class-variance-authority@^0.7.0 clsx@^2.1.1 lucide-react@^0.447.0 radix-ui@^1.0.0 tailwind-merge@^2.5.3 --ignore-scripts --legacy-peer-deps

# Copy workspace libs as resolvable node_modules packages
COPY libs/web-ui/src/ ./node_modules/@open-sharia-enterprise/web-ui/src/
COPY libs/web-ui/package.json ./node_modules/@open-sharia-enterprise/web-ui/
COPY libs/web-ui-token/src/ ./node_modules/@open-sharia-enterprise/web-ui-token/src/
COPY libs/web-ui-token/package.json ./node_modules/@open-sharia-enterprise/web-ui-token/

# Copy app source
COPY apps/organiclever-app-web/src/ ./src/
COPY apps/organiclever-app-web/scripts/ ./scripts/
COPY apps/organiclever-app-web/package.json apps/organiclever-app-web/tsconfig.json apps/organiclever-app-web/next.config.ts apps/organiclever-app-web/postcss.config.mjs ./

# Generate migration index (gitignored, must be created at build time)
RUN node scripts/gen-migrations.mjs

# Generate contract types
COPY specs/apps/organiclever/be/contracts/generated/ ./specs/apps/organiclever/be/contracts/generated/
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx @hey-api/openapi-ts -i specs/apps/organiclever/be/contracts/generated/openapi-bundled.yaml -o src/generated-contracts -s

ARG ORGANICLEVER_BE_URL=http://organiclever-be:8202
ENV ORGANICLEVER_BE_URL=${ORGANICLEVER_BE_URL}
RUN npx next build

FROM node:24-alpine

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/ose-public"
LABEL org.opencontainers.image.description="OrganicLever landing and promotional website built with Next.js"

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --chown=app:app scripts/next-with-port.mjs scripts/next-with-port.mjs
COPY --chown=app:app libs/ts-env-loader/src/port-resolver.ts libs/ts-env-loader/src/port-resolver.ts
USER app
EXPOSE 3202
ENV ORGANICLEVER_APP_WEB_PORT=3202 HOSTNAME="0.0.0.0" NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["sh", "-c", "wget --no-verbose --tries=1 --spider http://localhost:${ORGANICLEVER_APP_WEB_PORT}/ || exit 1"]

CMD ["node", "scripts/next-with-port.mjs", "--env", "ORGANICLEVER_APP_WEB_PORT", "--default", "3202", "--server", "server.js"]

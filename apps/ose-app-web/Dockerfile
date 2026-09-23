# Build context: workspace root (../../.. from apps/ose-app-web/)
FROM node:24-alpine AS build
WORKDIR /app

# Copy app package.json and strip workspace dependency before install
COPY apps/ose-app-web/package.json ./
RUN node -e " \
  const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  delete pkg.dependencies['@open-sharia-enterprise/web-ui']; \
  delete pkg.dependencies['@open-sharia-enterprise/web-ui-token']; \
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
COPY apps/ose-app-web/src/ ./src/
COPY apps/ose-app-web/package.json apps/ose-app-web/tsconfig.json apps/ose-app-web/next.config.ts apps/ose-app-web/postcss.config.mjs ./

# Generate contract types (when spec exists)
# COPY specs/apps/ose/be/contracts/generated/ ./specs/apps/ose/be/contracts/generated/
# RUN npx @hey-api/openapi-ts -i specs/apps/ose/be/contracts/generated/openapi-bundled.yaml -o src/generated-contracts -s

ENV NEXT_TELEMETRY_DISABLED=1
ARG OSE_BE_URL=http://ose-be:8302
ENV OSE_BE_URL=${OSE_BE_URL}
RUN npx next build

FROM node:24-alpine

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/ose-public"
LABEL org.opencontainers.image.description="OSE Application frontend built with Next.js"

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --chown=app:app scripts/next-with-port.mjs scripts/next-with-port.mjs
COPY --chown=app:app libs/ts-env-loader/src/port-resolver.ts libs/ts-env-loader/src/port-resolver.ts
USER app
EXPOSE 3300
ENV OSE_APP_WEB_PORT=3300 HOSTNAME="0.0.0.0" NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["sh", "-c", "wget --no-verbose --tries=1 --spider http://localhost:${OSE_APP_WEB_PORT}/ || exit 1"]

CMD ["node", "scripts/next-with-port.mjs", "--env", "OSE_APP_WEB_PORT", "--default", "3300", "--server", "server.js"]

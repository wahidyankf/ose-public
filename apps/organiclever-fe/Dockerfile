# Build context: workspace root (../../.. from infra/dev/organiclever/)
FROM node:24-alpine AS build
WORKDIR /app

# Copy app package.json and strip workspace dependency before install
COPY apps/organiclever-fe/package.json ./
RUN node -e " \
  const pkg = JSON.parse(require('fs').readFileSync('package.json','utf8')); \
  delete pkg.dependencies['@open-sharia-enterprise/ts-ui']; \
  require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
" && npm install --ignore-scripts

# Install ts-ui transitive dependencies
RUN npm install --save class-variance-authority@^0.7.0 clsx@^2.1.1 lucide-react@^0.447.0 radix-ui@^1.0.0 tailwind-merge@^2.5.3 --ignore-scripts

# Copy workspace libs as resolvable node_modules packages
COPY libs/ts-ui/src/ ./node_modules/@open-sharia-enterprise/ts-ui/src/
COPY libs/ts-ui/package.json ./node_modules/@open-sharia-enterprise/ts-ui/
COPY libs/ts-ui-tokens/src/ ./node_modules/@open-sharia-enterprise/ts-ui-tokens/src/
COPY libs/ts-ui-tokens/package.json ./node_modules/@open-sharia-enterprise/ts-ui-tokens/

# Copy app source
COPY apps/organiclever-fe/src/ ./src/
COPY apps/organiclever-fe/package.json apps/organiclever-fe/tsconfig.json apps/organiclever-fe/next.config.ts apps/organiclever-fe/postcss.config.mjs ./

# Generate contract types
COPY specs/apps/organiclever/contracts/generated/ ./specs/apps/organiclever/contracts/generated/
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx @hey-api/openapi-ts -i specs/apps/organiclever/contracts/generated/openapi-bundled.yaml -o src/generated-contracts -s

ARG ORGANICLEVER_BE_URL=http://organiclever-be:8202
ENV ORGANICLEVER_BE_URL=${ORGANICLEVER_BE_URL}
RUN npx next build

FROM node:24-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3200
ENV PORT=3200 HOSTNAME="0.0.0.0" NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
CMD ["node", "server.js"]

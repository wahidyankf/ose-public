# Stage 1: Install dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/organiclever-web/package.json ./apps/organiclever-web/
COPY apps/organiclever-web-e2e/package.json ./apps/organiclever-web-e2e/
COPY apps/organiclever-be-e2e/package.json ./apps/organiclever-be-e2e/
COPY libs/ts-ui/package.json ./libs/ts-ui/
COPY libs/ts-ui-tokens/package.json ./libs/ts-ui-tokens/
RUN npm ci

# Stage 2: Build
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/ ./
COPY apps/organiclever-web/ ./apps/organiclever-web/
COPY libs/ts-ui/src/ ./libs/ts-ui/src/
COPY libs/ts-ui/package.json ./libs/ts-ui/
COPY libs/ts-ui-tokens/src/ ./libs/ts-ui-tokens/src/
COPY libs/ts-ui-tokens/package.json ./libs/ts-ui-tokens/
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/organiclever-web && npx next build

# Stage 3: Runtime
FROM node:24-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/apps/organiclever-web/.next/standalone ./
COPY --from=build --chown=app:app /app/apps/organiclever-web/.next/static ./apps/organiclever-web/.next/static
USER app
EXPOSE 3200
ENV PORT=3200 HOSTNAME="0.0.0.0" NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
CMD ["node", "apps/organiclever-web/server.js"]

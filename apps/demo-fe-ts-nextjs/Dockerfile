FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/demo-fe-ts-nextjs/package.json ./apps/demo-fe-ts-nextjs/
COPY libs/ts-ui-tokens/package.json ./libs/ts-ui-tokens/
RUN npm ci --ignore-scripts

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/demo-fe-ts-nextjs/node_modules ./apps/demo-fe-ts-nextjs/node_modules
COPY package.json ./
COPY apps/demo-fe-ts-nextjs/src/ ./apps/demo-fe-ts-nextjs/src/
COPY apps/demo-fe-ts-nextjs/package.json apps/demo-fe-ts-nextjs/tsconfig.json apps/demo-fe-ts-nextjs/next.config.ts apps/demo-fe-ts-nextjs/postcss.config.mjs ./apps/demo-fe-ts-nextjs/
COPY libs/ts-ui-tokens/src/ ./libs/ts-ui-tokens/src/
COPY libs/ts-ui-tokens/package.json ./libs/ts-ui-tokens/
COPY specs/apps/demo/contracts/generated/ ./specs/apps/demo/contracts/generated/
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/apps/demo-fe-ts-nextjs
RUN npx @hey-api/openapi-ts -i ../../specs/apps/demo/contracts/generated/openapi-bundled.yaml -o src/generated-contracts -s
ARG BACKEND_URL=http://demo-be:8201
ENV BACKEND_URL=${BACKEND_URL}
RUN npx next build

FROM node:24-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/apps/demo-fe-ts-nextjs/.next/standalone ./
COPY --from=build --chown=app:app /app/apps/demo-fe-ts-nextjs/.next/static ./apps/demo-fe-ts-nextjs/.next/static
USER app
EXPOSE 3301
ENV PORT=3301 HOSTNAME="0.0.0.0" NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
CMD ["node", "apps/demo-fe-ts-nextjs/server.js"]

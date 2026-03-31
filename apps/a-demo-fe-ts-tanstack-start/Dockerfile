FROM node:24-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npx vite build

FROM node:24-alpine

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/open-sharia-enterprise"
LABEL org.opencontainers.image.description="Demo frontend built with TypeScript and TanStack Start"

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/server.mjs ./server.mjs
COPY --from=build --chown=app:app /app/package.json ./package.json
USER app
ENV PORT=3301
ENV BACKEND_URL=http://demo-be:8201
EXPOSE 3301
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3301/ || exit 1

CMD ["node", "server.mjs"]

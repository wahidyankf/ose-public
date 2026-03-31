FROM golang:1.25-alpine AS build
RUN apk add --no-cache build-base git
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server ./cmd/server/

FROM alpine:3.22

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/open-sharia-enterprise"
LABEL org.opencontainers.image.description="Demo backend REST API built with Go and Gin"

RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /build/server ./server

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 8201
ENV PORT=8201

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8201/health || exit 1

CMD ["./server"]

---
title: "Docker Containerization"
date: 2026-02-04T00:00:00+07:00
draft: false
description: "Multi-stage builds, minimal images, and container optimization for Go"
weight: 1000088
tags: ["golang", "docker", "containers", "deployment", "optimization"]
---

## Why Docker Containerization Matters

Docker containerization is essential for Go deployments because it provides consistent environments, isolates dependencies, enables horizontal scaling, and simplifies deployment pipelines. Go's static binaries combined with multi-stage builds enable container images as small as 5-15MB, drastically reducing attack surface and deployment time.

**Core benefits**:

- **Consistency**: Same environment in dev, staging, production
- **Isolation**: No dependency conflicts between applications
- **Portability**: Run anywhere Docker runs (local, cloud, on-prem)
- **Scalability**: Easily replicate containers horizontally

**Problem**: Without containers, deployment requires manual dependency management, environment-specific configurations, and platform-specific binaries causing "works on my machine" issues.

**Solution**: Use multi-stage Docker builds starting with standard patterns before optimizing for minimal image sizes.

## Standard Approach: Single-Stage Build

Basic Docker build that works but produces large images.

**Simple Dockerfile**:

```dockerfile
# File: Dockerfile
FROM golang:1.23
# => Full Golang image (800MB)
# => Includes Go compiler, tools, and dependencies

WORKDIR /app
# => Sets working directory to /app
# => All subsequent commands run from /app

COPY go.mod go.sum ./
# => Copies dependency files first
# => Enables layer caching (dependencies rarely change)

RUN go mod download
# => Downloads dependencies
# => Cached unless go.mod/go.sum change
# => Speeds up subsequent builds

COPY . .
# => Copies source code
# => Changes frequently (triggers rebuild from this layer)

RUN go build -o myapp
# => Compiles application
# => Binary: /app/myapp

EXPOSE 8080
# => Documents that container listens on port 8080
# => Informational only (doesn't actually open port)

CMD ["./myapp"]
# => Runs compiled binary
# => Default command when container starts
```

**Building and running**:

```bash
docker build -t myapp:latest .
# => Builds image tagged myapp:latest
# => Uses current directory as build context

docker images myapp
# => Shows image size
# => Output: myapp latest ... 850MB
# => Huge image (includes entire Go toolchain)

docker run -p 8080:8080 myapp:latest
# => Runs container
# => -p maps host port 8080 to container port 8080
# => Access: http://localhost:8080
```

**Problems with single-stage builds**:

- **Large image size**: 800MB+ (includes Go compiler not needed at runtime)
- **Security risk**: Unnecessary tools in production image
- **Slow deployment**: Large images take longer to push/pull
- **Attack surface**: More software = more vulnerabilities

## Production Pattern: Multi-Stage Build

Multi-stage builds separate build environment from runtime environment.

**Multi-stage Dockerfile**:

```dockerfile
# File: Dockerfile

# Stage 1: Build
FROM golang:1.23-alpine AS builder
# => alpine variant (50MB vs 800MB)
# => AS builder names this stage for reference
# => Only used during build, not in final image

WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download
# => Downloads dependencies in separate layer
# => Cached if go.mod/go.sum unchanged

# Copy source code
COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o myapp
# => CGO_ENABLED=0: static binary (no libc dependency)
# => GOOS=linux: target Linux (even if building on macOS/Windows)
# => -ldflags="-s -w": strip debug symbols (smaller binary)
# => Output: /app/myapp (~5-10MB)

# Stage 2: Runtime
FROM alpine:latest
# => Minimal base image (5MB)
# => No Go toolchain, only libc and shell

RUN apk --no-cache add ca-certificates
# => Installs SSL certificates
# => Required for HTTPS requests to external APIs
# => --no-cache: don't cache package index (smaller image)

WORKDIR /root/

# Copy binary from builder stage
COPY --from=builder /app/myapp .
# => --from=builder: copies from named stage
# => Only binary copied, not source or dependencies
# => Final image: ~10-15MB

EXPOSE 8080

CMD ["./myapp"]
# => Runs binary
# => alpine includes shell, so ./myapp works
```

**Building multi-stage**:

```bash
docker build -t myapp:multi .
# => Builds using multi-stage Dockerfile
# => Intermediate builder stage discarded

docker images myapp
# => Output: myapp multi ... 15MB
# => 98% smaller than single-stage (850MB → 15MB)

docker run -p 8080:8080 myapp:multi
# => Runs container with minimal image
# => Identical behavior, drastically smaller
```

**Size comparison**:

```bash
docker images | grep myapp
# myapp  single-stage  850MB
# myapp  multi-stage    15MB
# myapp  scratch         8MB  (see next section)
```

**Layer caching optimization**:

```dockerfile
# ❌ Bad: Copies everything before go mod download
COPY . .
RUN go mod download

# ✅ Good: Copies dependencies first
COPY go.mod go.sum ./
RUN go mod download
COPY . .

# Benefit: go mod download layer cached unless dependencies change
# Source code changes don't invalidate dependency cache
```

**Trade-offs**:

| Approach              | Image Size | Build Time | When to Use                       |
| --------------------- | ---------- | ---------- | --------------------------------- |
| Single-stage          | 800MB      | Fast       | Local development, debugging      |
| Multi-stage (alpine)  | 15MB       | Medium     | Production default                |
| Multi-stage (scratch) | 8MB        | Fast       | Production (static binaries only) |

## Minimal Images: scratch and distroless

The absolute minimal container images for Go binaries.

**scratch base** (smallest possible):

```dockerfile
# File: Dockerfile.scratch

# Stage 1: Build
FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o myapp

# Stage 2: Runtime with scratch
FROM scratch
# => scratch is empty base image
# => No shell, no package manager, no libraries
# => Only kernel and your binary
# => Smallest possible image

# Copy SSL certificates
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
# => Copies SSL certs from builder stage
# => Required for HTTPS (scratch has no certs)

# Copy binary
COPY --from=builder /app/myapp /myapp
# => Binary at root (no shell, so full path required)

EXPOSE 8080

CMD ["/myapp"]
# => Must use exec form (no shell in scratch)
# => Cannot use shell form: CMD ./myapp
```

**Building with scratch**:

```bash
docker build -f Dockerfile.scratch -t myapp:scratch .

docker images myapp
# => Output: myapp scratch ... 8MB
# => Binary + SSL certs only (no OS)

docker run -p 8080:8080 myapp:scratch
# => Runs with minimal image
```

**Debugging scratch images** (impossible without shell):

```bash
# ❌ Cannot exec into scratch container
docker exec -it <container-id> sh
# => Error: executable file not found in $PATH
# => No shell in scratch image

# ✅ Alternative: Use alpine for debugging, scratch for production
```

**distroless base** (minimal with libc):

```dockerfile
# File: Dockerfile.distroless

FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o myapp

# Stage 2: distroless
FROM gcr.io/distroless/static-debian12
# => Google's distroless images
# => Contains libc, SSL certs, timezone data
# => No shell, package manager, or unnecessary tools
# => More than scratch, less than alpine

COPY --from=builder /app/myapp /myapp
# => Copies binary

EXPOSE 8080

CMD ["/myapp"]
```

**distroless benefits**:

- Includes SSL certificates (no manual copy needed)
- Includes timezone data (time.LoadLocation works)
- Slightly larger than scratch (~10-12MB) but more complete
- Still no shell (debugging difficult)

**When to use each**:

| Base Image | Size | Contents                  | When to Use                   |
| ---------- | ---- | ------------------------- | ----------------------------- |
| alpine     | 15MB | Shell, pkg mgr, SSL certs | Development, debugging        |
| distroless | 12MB | libc, SSL certs, timezone | Production (static binaries)  |
| scratch    | 8MB  | Only your binary          | Production (absolute minimal) |

## Advanced Optimization Techniques

**Non-root user** (security best practice):

```dockerfile
FROM alpine:latest

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# => Creates system group and user
# => -S: system user (no password, no home)
# => appuser cannot escalate privileges

WORKDIR /home/appuser

COPY --from=builder /app/myapp .
RUN chown appuser:appgroup myapp
# => Changes binary ownership to appuser
# => Ensures appuser can execute

USER appuser
# => Switches to non-root user
# => All subsequent commands run as appuser
# => Container runs as appuser (not root)

CMD ["./myapp"]
```

**Health checks** (container orchestration):

```dockerfile
FROM alpine:latest

COPY --from=builder /app/myapp .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1
# => --interval: check every 30 seconds
# => --timeout: fail if check takes >3 seconds
# => --start-period: give app 5 seconds to start
# => --retries: mark unhealthy after 3 failures
# => wget --spider: checks endpoint without downloading

EXPOSE 8080
CMD ["./myapp"]
```

**Example health check** (app code):

```go
// File: main.go
package main

import (
    "net/http"
)

func healthHandler(w http.ResponseWriter, r *http.Request) {
    // => Health check endpoint
    // => Returns 200 OK if app healthy

    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
    // => Simple response
    // => In production: check database, dependencies
}

func main() {
    http.HandleFunc("/health", healthHandler)
    // => Registers health endpoint
    // => Used by Docker HEALTHCHECK

    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello, World!"))
    })

    http.ListenAndServe(":8080", nil)
}
```

**Build arguments** (configurable builds):

```dockerfile
FROM golang:1.23-alpine AS builder

# Build argument with default
ARG VERSION=dev
# => ARG available only during build (not runtime)
# => VERSION=dev if not specified

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .

# Inject version into binary
RUN CGO_ENABLED=0 go build -ldflags="-s -w -X main.Version=${VERSION}" -o myapp
# => -X main.Version=${VERSION} sets Go variable
# => main.Version available in app

FROM alpine:latest
COPY --from=builder /app/myapp .
CMD ["./myapp"]
```

**Building with arguments**:

```bash
docker build --build-arg VERSION=v1.2.3 -t myapp:v1.2.3 .
# => Sets VERSION build arg
# => Binary contains version v1.2.3

./myapp --version
# => Output: v1.2.3
```

**Multi-architecture builds**:

```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .
# => Builds for x86-64 and ARM64
# => Pushes both architectures to registry
# => Docker automatically pulls correct architecture

# Example: Run on Raspberry Pi (ARM64)
docker pull myapp:latest
# => Pulls ARM64 variant automatically
# => Same tag, different architecture
```

## Example: Complete Production Dockerfile

```dockerfile
# Production-ready Dockerfile for Go applications

# Build stage
FROM golang:1.23-alpine AS builder

# Install build dependencies (if needed)
RUN apk add --no-cache git

WORKDIR /app

# Dependency caching
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source
COPY . .

# Build with optimizations
ARG VERSION=dev
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w -X main.Version=${VERSION}" \
    -o myapp \
    ./cmd/myapp
# => Builds static binary
# => Strips debug symbols
# => Injects version

# Runtime stage
FROM alpine:3.19

# Security: create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata
# => ca-certificates: SSL support
# => tzdata: timezone support

WORKDIR /home/appuser

# Copy binary from builder
COPY --from=builder /app/myapp .
RUN chown appuser:appgroup myapp

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run as non-root
USER appuser

EXPOSE 8080

CMD ["./myapp"]

# Metadata
LABEL maintainer="your-email@example.com" \
      version="${VERSION}" \
      description="My Go Application"
```

**Building production image**:

```bash
docker build \
  --build-arg VERSION=$(git describe --tags) \
  -t myapp:$(git describe --tags) \
  -t myapp:latest \
  .
# => Tags with git version and latest
# => Injects version into binary
```

## Docker Compose for Local Development

```yaml
# File: docker-compose.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
      - LOG_LEVEL=debug
    depends_on:
      - db
    volumes:
      - ./:/app
      # => Mounts source code for live reload in dev

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Running with Docker Compose**:

```bash
docker-compose up
# => Starts app and database
# => Automatic networking between containers

docker-compose down
# => Stops and removes containers
# => Preserves pgdata volume
```

## Best Practices

**DO**:

- Use multi-stage builds (separate build and runtime)
- Use alpine or distroless for production
- Run as non-root user
- Add health checks
- Use .dockerignore to exclude unnecessary files
- Cache dependencies (COPY go.mod before COPY .)
- Strip binaries (-ldflags="-s -w")

**DON'T**:

- Use full golang image in production
- Run as root user
- Include source code in runtime image
- Expose unnecessary ports
- Skip health checks
- Ignore layer caching

**.dockerignore example**:

```
# File: .dockerignore
.git
.gitignore
README.md
*.md
.env
.env.local
node_modules
vendor
.vscode
.idea
```

## Summary

Docker containerization for Go:

- **Multi-stage builds**: Separate build (golang:1.23-alpine) from runtime (alpine/distroless/scratch)
- **Minimal images**: 8-15MB (vs 800MB single-stage)
- **Security**: Non-root user, health checks, minimal attack surface
- **Optimization**: CGO_ENABLED=0, -ldflags="-s -w", layer caching

**Image size progression**:

```
golang:1.23       800MB (development)
  ↓
golang:1.23-alpine 50MB (builder stage)
  ↓
alpine:latest      15MB (production default)
  ↓
distroless         12MB (production minimal)
  ↓
scratch             8MB (production absolute minimal)
```

**Production Dockerfile template**:

```bash
# Multi-stage, alpine runtime, non-root, health check
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o myapp

FROM alpine:latest
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN apk --no-cache add ca-certificates
WORKDIR /home/appuser
COPY --from=builder /app/myapp .
RUN chown appuser:appgroup myapp
HEALTHCHECK CMD wget --spider http://localhost:8080/health || exit 1
USER appuser
CMD ["./myapp"]
```

**Progressive adoption**:

1. Start with single-stage Dockerfile (development)
2. Add multi-stage build (alpine runtime)
3. Optimize with distroless or scratch
4. Add non-root user and health checks
5. Implement CI/CD with automated builds

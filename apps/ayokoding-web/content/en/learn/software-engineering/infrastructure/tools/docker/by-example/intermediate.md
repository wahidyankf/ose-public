---
title: "Intermediate"
date: 2025-12-29T23:43:13+07:00
draft: false
weight: 10000002
description: "Examples 28-54: Multi-stage builds, Docker Compose orchestration, health checks, resource limits (40-75% coverage)"
tags: ["docker", "tutorial", "by-example", "intermediate", "multi-stage", "health-checks"]
---

### Examples 28-54: Production Patterns

This chapter covers production Docker patterns through 27 examples, achieving 40-75% coverage. You'll learn multi-stage builds, Docker Compose service orchestration, health checks, resource limits, and logging strategies.

---

### Example 28: Multi-Stage Build Basics

Multi-stage builds use multiple FROM instructions to create optimized production images. Build dependencies stay in build stages while only runtime artifacts reach the final image.

```mermaid
%% Multi-stage build flow
graph TD
 A["Builder Stage<br/>node:18-alpine"] --> B["Install all dependencies<br/>npm ci"]
 B --> C["Copy source code"]
 C --> D["Build production bundle<br/>npm run build"]
 D --> E["Production Stage<br/>node:18-alpine"]
 E --> F["Install prod dependencies<br/>npm ci --only=production"]
 F --> G["Copy built artifacts<br/>COPY --from=builder"]
 G --> H["Final Image<br/>120MB #40;73% smaller#41;"]

 style A fill:#0173B2,color:#fff
 style D fill:#DE8F05,color:#fff
 style E fill:#0173B2,color:#fff
 style H fill:#029E73,color:#fff
```

```dockerfile
# File: Dockerfile

# Build stage (includes build tools)
FROM node:18-alpine AS builder
# => Stage name: "builder"
# => Includes npm, node-gyp, build tools

WORKDIR /app

# Copy and install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm ci
# => Installs all dependencies for building

# Copy source code
COPY .

# Build production bundle
RUN npm run build
# => Creates optimized production build in /app/dist/
# => Includes transpilation, minification, bundling

# Production stage (minimal runtime)
FROM node:18-alpine
# => Fresh FROM instruction starts new stage
# => Previous stage (builder) layers are discarded

WORKDIR /app

# Copy only production package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production
# => Excludes devDependencies (webpack, babel, etc.)
# => Smaller node_modules

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist
# => COPY --from=<stage-name> copies files from previous stage
# => Only production bundle, not source code

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
 adduser -S nodejs -u 1001 && \
 chown -R nodejs:nodejs /app
# => Creates non-privileged user
# => Changes ownership of /app

USER nodejs
# => Runs container as nodejs user (not root)

EXPOSE 3000
CMD ["node", "dist/main.js"]
# => Starts production server
```

```bash
# Build multi-stage image
docker build -t my-app:multi-stage .
# => [builder 1/5] FROM node:18-alpine (build stage — all dev tools)
# => [builder 4/5] RUN npm ci (installs devDependencies for building)
# => [builder 5/5] RUN npm run build (creates /app/dist/)
# => [stage-1 4/4] COPY --from=builder /app/dist ./dist (only artifacts)
# => Successfully tagged my-app:multi-stage

# Compare with single-stage image size
docker images my-app
# => my-app single-stage 450MB (source + devDependencies + build tools)
# => my-app multi-stage  120MB (runtime + production bundle only)
# => 73% size reduction

# Verify production image contents
docker run --rm my-app:multi-stage ls -lh /app
# => drwxr-xr-x nodejs nodejs 4.0K dist (production bundle only)
# => drwxr-xr-x nodejs nodejs  12K node_modules (production deps only)

# Source code NOT in production image (security)
docker run --rm my-app:multi-stage ls /app/src
# => ls: /app/src: No such file or directory (source stays in builder stage)

# Check user (runs as nodejs, not root)
docker run --rm my-app:multi-stage whoami
# => nodejs
```

**Key Takeaway**: Multi-stage builds dramatically reduce image size by excluding build tools and source code from final images. Use `COPY --from=<stage>` to transfer only necessary artifacts between stages. Always run production containers as non-root users.

**Why It Matters**: Multi-stage builds solve the critical trade-off between developer convenience (full toolchains for building) and production efficiency (minimal runtime footprints). A single Dockerfile can reduce image sizes from 450MB to 120MB (73% reduction) through staged compilation — removing build tools, source code, and development libraries from the final image. Running as non-root prevents privilege escalation attacks that could compromise the entire host system if a container is breached.

---

### Example 29: Multi-Stage with Build Arguments

Build arguments in multi-stage builds enable flexible image customization for different environments while maintaining a single Dockerfile.

```dockerfile
# File: Dockerfile

# Build stage
FROM golang:1.21-alpine AS builder

# Build arguments for version information
ARG VERSION=dev
ARG BUILD_DATE
ARG GIT_COMMIT=unknown

WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download
# => Downloads Go dependencies

# Copy source code
COPY .

# Build binary with version information
RUN CGO_ENABLED=0 GOOS=linux go build \
 -ldflags="-X main.Version=${VERSION} \
 -X main.BuildDate=${BUILD_DATE} \
 -X main.GitCommit=${GIT_COMMIT} \
 -w -s" \
 -o /app/server ./cmd/server
# => Compiles Go binary with embedded version metadata
# => -ldflags=-w -s strips debug symbols (smaller binary)
# => CGO_ENABLED=0 creates fully static binary

# Production stage
FROM alpine:3.19
# => Minimal base image (~5MB)
# => golang:1.21 image not needed at runtime

# Security: Install CA certificates for HTTPS
RUN apk --no-cache add ca-certificates
# => Required for HTTPS requests
# => --no-cache prevents storing package index

# Create non-root user
RUN addgroup -g 1001 app && \
 adduser -D -u 1001 -G app app

WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/server .
# => Only the compiled binary, no Go toolchain

# Change ownership
RUN chown -R app:app /app

USER app

EXPOSE 8080

# Pass build args as labels
ARG VERSION
ARG BUILD_DATE
ARG GIT_COMMIT
LABEL version="${VERSION}" \
 build_date="${BUILD_DATE}" \
 git_commit="${GIT_COMMIT}"
# => Metadata queryable via docker inspect

CMD ["./server"]
```

```bash
# Build with version information
docker build \
 --build-arg VERSION=1.2.3 \
 --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
 --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) \
 -t my-go-app:1.2.3 \
 .
# => Embeds version metadata in binary and image labels

# Verify version embedded in binary
docker run --rm my-go-app:1.2.3 ./server --version
# => my-go-app version 1.2.3
# => Built: 2025-12-29T10:50:00Z
# => Commit: abc1234

# Check image labels
docker inspect my-go-app:1.2.3 --format='{{json .Config.Labels}}' | jq
# => {
# => "version": "1.2.3",
# => "build_date": "2025-12-29T10:50:00Z",
# => "git_commit": "abc1234"
# => }

# Compare image sizes
docker images | grep my-go-app
# => my-go-app 1.2.3 15MB (alpine + binary)
# => If built from golang base: ~350MB
# => 96% size reduction!

# Verify binary is static (no dynamic linking)
docker run --rm my-go-app:1.2.3 ldd /app/server
# => not a dynamic executable
# => Fully static binary (portable across Linux distros)
```

**Key Takeaway**: Multi-stage builds excel with compiled languages (Go, Rust, C++). Build in a large image with compilers, copy the binary to a minimal runtime image. Embed version metadata using build arguments for traceability in production.

**Why It Matters**: Compiled language images benefit most dramatically from multi-stage builds, shrinking from 350MB (with compiler toolchain) to 15MB (static binary only), achieving 96% size reduction. Version metadata embedded during build provides critical traceability for debugging production incidents, enabling teams to correlate deployed containers with specific source code commits. This pattern is fundamental for immutable infrastructure where artifact versioning ensures reproducible deployments.

---

### Example 30: Multi-Stage with Multiple Runtimes

Complex applications may need multiple languages or tools during build. Multi-stage builds can combine different base images for each build step.

**Multi-Runtime Build Pipeline:**

```mermaid
%% Polyglot multi-stage build
graph TD
 A["Frontend Builder<br/>node:18-alpine"] --> D["Production Stage<br/>nginx:alpine"]
 B["Backend Builder<br/>golang:1.21-alpine"] --> D
 C["Docs Builder<br/>python:3.11-slim"] --> D
 A --> A1["npm run build<br/>React/Vue/Angular"]
 B --> B1["go build<br/>API server binary"]
 C --> C1["mkdocs build<br/>Static docs site"]
 A1 --> D1["/usr/share/nginx/html/"]
 B1 --> D2["/usr/local/bin/server"]
 C1 --> D3["/usr/share/nginx/html/docs/"]

 style A fill:#0173B2,color:#fff
 style B fill:#0173B2,color:#fff
 style C fill:#0173B2,color:#fff
 style D fill:#029E73,color:#fff
```

```dockerfile
# File: Dockerfile

# Stage 1: Build frontend (Node.js)
FROM node:18-alpine AS frontend-builder
# => Node.js 18 Alpine build environment for frontend

WORKDIR /app/frontend
# => Set frontend working directory

COPY frontend/package*.json ./
# => Copy package files for dependency caching
RUN npm ci
# => Install frontend dependencies

COPY frontend/ ./
# => Copy all frontend source files
RUN npm run build
# => Creates static assets in /app/frontend/dist

# Stage 2: Build backend (Go)
FROM golang:1.21-alpine AS backend-builder
# => Go 1.21 Alpine build environment

WORKDIR /app/backend
# => Set backend working directory

COPY backend/go.mod backend/go.sum ./
# => Copy module files for dependency caching
RUN go mod download
# => Download all Go module dependencies

COPY backend/ ./
# => Copy all backend source files
RUN CGO_ENABLED=0 go build -o /app/backend/server ./cmd/server
# => Compiles Go backend server
# => CGO_ENABLED=0: creates static binary

# Stage 3: Generate API documentation (Python)
FROM python:3.11-slim AS docs-builder
# => Python 3.11 slim environment for documentation

WORKDIR /app
# => Set working directory

RUN pip install --no-cache-dir mkdocs mkdocs-material
# => Install documentation generator
# => --no-cache-dir: smaller image

COPY docs/ ./docs/
# => Copy documentation source files
RUN mkdocs build -d /app/docs-output
# => Generates static documentation site

# Stage 4: Production runtime (Nginx + backend)
FROM nginx:alpine
# => Final minimal production image

# Copy frontend static assets
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html/
# => Frontend served by Nginx

# Copy API documentation
COPY --from=docs-builder /app/docs-output /usr/share/nginx/html/docs/
# => Documentation at /docs path

# Copy Go backend binary
COPY --from=backend-builder /app/backend/server /usr/local/bin/
# => Backend binary in PATH

# Nginx configuration for SPA + API
COPY nginx.conf /etc/nginx/conf.d/default.conf
# => Routes /api/* to backend, /* to frontend

# Startup script to run both Nginx and backend
COPY start.sh /usr/local/bin/
# => Copy startup script
RUN chmod +x /usr/local/bin/start.sh
# => Make startup script executable

EXPOSE 80
# => Document HTTP port

CMD ["/usr/local/bin/start.sh"]
# => Run startup script (manages both nginx and backend)
```

```bash
# File: start.sh
#!/bin/sh

# Start backend in background
/usr/local/bin/server &
# => Start Go backend in background
BACKEND_PID=$!
# => Go backend starts on port 8080

# Start Nginx in foreground
nginx -g 'daemon off;' &
# => Start Nginx in background
NGINX_PID=$!
# => Nginx starts on port 80, routes to backend

# Wait for either process to exit
wait -n
# => Returns when first process exits (crash detection)

# Kill both processes
kill $BACKEND_PID $NGINX_PID
# => Ensures clean shutdown of both services
```

```nginx
# File: nginx.conf
server {
# => Nginx virtual server block
 listen 80;
 # => Nginx listens on port 80
 # => HTTP only (add SSL for production)

 # Frontend SPA
 location / {
# => Route all unmatched requests to frontend
 root /usr/share/nginx/html;
 # => Frontend static files served from here
 try_files $uri $uri/ /index.html;
 # => Falls back to index.html (SPA routing)
 # => React/Vue/Angular router handles URL
 }

 # API proxy to backend
 location /api/ {
# => Route /api/* to Go backend
 proxy_pass http://localhost:8080/;
 # => Forwards /api/* requests to Go backend on port 8080
 proxy_http_version 1.1;
# => Use HTTP/1.1 for keep-alive connections
 proxy_set_header Host $host;
# => Pass original Host header
 proxy_set_header X-Real-IP $remote_addr;
 # => Preserves original client IP for logging
 # => Backend can log real client IPs
 }
# => End of /api/ location block

 # API documentation
 location /docs/ {
# => Route /docs/* to MkDocs static site
 alias /usr/share/nginx/html/docs/;
 # => MkDocs static site at /docs path
 try_files $uri $uri/ /docs/index.html;
 # => Falls back to docs index for SPA-style routing
 }
# => End of /docs/ location block
}
# => End of server block
```

```bash
# Build multi-runtime image
docker build -t fullstack-app .
# => [frontend-builder] Builds React/Vue/Angular app
# => [backend-builder] Compiles Go API server
# => [docs-builder] Generates MkDocs site
# => [final] Combines all artifacts in Nginx image

# Check final image size
docker images fullstack-app
# => REPOSITORY TAG SIZE
# => fullstack-app latest 45MB
# => Nginx base: 23MB, frontend assets: 15MB, backend binary: 7MB

# Run full-stack container
docker run -d -p 8080:80 --name fullstack fullstack-app
# => Frontend at http://localhost:8080/
# => API at http://localhost:8080/api/
# => Docs at http://localhost:8080/docs/

# Test all components
curl http://localhost:8080/
# => <!DOCTYPE html>..(frontend SPA)

curl http://localhost:8080/api/health
# => {"status":"ok","version":"1.0.0"} (backend API)

curl http://localhost:8080/docs/
# => <!DOCTYPE html>..(MkDocs documentation)

# Verify no build tools in final image
docker run --rm fullstack-app which node
# => (no output - Node.js not in final image)

docker run --rm fullstack-app which go
# => (no output - Go not in final image)

docker run --rm fullstack-app which python
# => (no output - Python not in final image)
```

**Key Takeaway**: Multi-stage builds can combine multiple languages/runtimes for complex build pipelines. Each stage uses the optimal base image for its task, then only artifacts are copied to the final stage. This approach keeps production images small and secure.

**Why It Matters**: Modern applications often require multiple build toolchains (Node.js for frontend, Go for backend, Python for documentation), and multi-stage builds eliminate the need to cram all tools into a single bloated image. This pattern enables polyglot applications to build efficiently while maintaining small production images. The resulting images contain zero build tools, reducing security vulnerabilities from unused dependencies lurking in container filesystems.

---

### Example 31: Build-Time Secrets

Build-time secrets (API keys, credentials) needed during build should never be committed to images. Docker BuildKit supports secret mounts that don't persist in image layers.

**Secret Mount Lifecycle:**

```mermaid
graph TD
 A["Host Secret File<br/>.npmrc"] --> B["--mount=type=secret"]
 B --> C["Mounted in RUN"]
 C --> D["Secret Available<br/>/run/secrets/npmrc"]
 D --> E["npm ci executes"]
 E --> F["RUN completes"]
 F --> G["Secret Removed<br/>NOT in image layer"]

 style A fill:#0173B2,color:#fff
 style D fill:#DE8F05,color:#fff
 style G fill:#029E73,color:#fff
```

```dockerfile
# File: Dockerfile

# syntax=docker/dockerfile:1.4
# => Enable BuildKit features (required for --mount=type=secret)

FROM node:18-alpine AS builder
# => Node.js 18 Alpine build stage

WORKDIR /app
# => Set working directory

# Install dependencies from private registry using secret
COPY package*.json ./
# => Copy package files for dependency caching

# Mount secret during npm install (doesn't persist in layer)
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
# => Mount .npmrc secret file temporarily
 npm ci
# => Mounts secret file at /root/.npmrc during RUN only
# => Secret is NOT stored in image layer
# => Secret file is removed after RUN completes

COPY .
# => Copy all source files

# Build with API key from secret
RUN --mount=type=secret,id=build_api_key \
# => Mount build API key secret
 export BUILD_API_KEY=$(cat /run/secrets/build_api_key) && \
# => Read secret value into environment variable
 npm run build
# => Reads secret from /run/secrets/<id>
# => Secret available only during this RUN command

# Production stage (no secrets)
FROM node:18-alpine
# => Final production image (clean, no secrets)

WORKDIR /app
# => Set working directory

COPY package*.json ./
# => Copy package files
RUN npm ci --only=production
# => Install only production dependencies

COPY --from=builder /app/dist ./dist
# => Only built artifacts, no secrets

EXPOSE 3000
# => Document application port
CMD ["node", "dist/main.js"]
# => Start production server
```

```bash
# Create secret files (DO NOT commit to git)
echo "//registry.npmjs.org/:_authToken=npm_secret_token" > .npmrc
# => Creates npm auth token file for private registry access
echo "build-api-key-12345" > build_api_key.txt
# => Creates API key file used during build

# Add secrets to .gitignore
cat >> .gitignore << 'EOF'
# => Append to .gitignore to protect secret files
.npmrc
# => Exclude .npmrc from git
build_api_key.txt
# => Exclude API key file from git
EOF
# => Prevents accidental commit of secret files

# Build with secrets (BuildKit required)
DOCKER_BUILDKIT=1 docker build \
# => Enable BuildKit for secret mounting
 --secret id=npmrc,src=.npmrc \
# => Pass .npmrc as a build secret
 --secret id=build_api_key,src=build_api_key.txt \
# => Pass API key file as a build secret
 -t secure-app .
# => Mounts secrets during build without persisting in layers

# Verify secrets are NOT in image layers
docker history secure-app --no-trunc | grep -i "secret\|npmrc\|api_key"
# => (no matches - secrets not visible in history)

# Alternative: Use environment secrets
DOCKER_BUILDKIT=1 docker build \
# => Enable BuildKit for env var secret
 --secret id=build_api_key,env=BUILD_API_KEY \
# => Use environment variable as secret source
 -t secure-app .
# => Reads secret from BUILD_API_KEY environment variable on host

# Environment variable secret (cleaner for CI/CD)
BUILD_API_KEY=secret-value DOCKER_BUILDKIT=1 docker build \
# => Set env var inline for this command only
 --secret id=build_api_key,env=BUILD_API_KEY \
# => Reference env var as secret
 -t secure-app .
# => Inline env var assignment scoped to single command

# Inspect final image for leaked secrets (security check)
docker save secure-app | tar -xOf - | grep -a "secret_token"
# => (no matches - secret not in any layer)

# Bad example (INSECURE - secrets in layers)
cat > Dockerfile.insecure << 'EOF'
# => Create insecure Dockerfile for comparison (DO NOT USE)
FROM node:18-alpine
# => Base image
WORKDIR /app
# => Working directory
COPY .npmrc /root/.npmrc # BAD! Secret persists in layer
# => WRONG: secret baked into image layer permanently
RUN npm ci
# => npm install with secret in layer
RUN rm /root/.npmrc # Still in previous layer!
# => Removing file doesn't remove from previous layer
EOF
# => Insecure Dockerfile written (illustrative only)

docker build -f Dockerfile.insecure -t insecure-app .
# => Builds insecure image to demonstrate the problem
docker history insecure-app --no-trunc | grep -i "npmrc"
# => Shows "COPY .npmrc" in layer history
# => Secret is exposed in image layer (security risk!)
```

**Key Takeaway**: Always use `--mount=type=secret` with BuildKit for build-time secrets. Never COPY secrets directly or use ENV for sensitive values. Secrets mounted with `--mount=type=secret` are NOT persisted in image layers, preventing accidental leakage.

**Why It Matters**: Secret leakage through image layers is a critical security vulnerability that has exposed countless API keys, database passwords, and credentials in public registries. BuildKit's secret mounts provide the ONLY secure way to use credentials during builds without leaving forensic traces in image history. Even deleted secrets remain in previous layers, recoverable by anyone with image access—a breach that could expose production infrastructure to attackers.

---

### Example 32: Docker Compose Build Optimization

Optimize Docker Compose builds with caching strategies, parallel builds, and BuildKit features for faster iteration cycles.

**BuildKit Caching Strategy:**

```mermaid
%% Build caching flow
graph TD
 A["Local Build"] --> B{Cache Hit?}
 B -->|Yes| C["Reuse Cached Layers<br/>2 seconds"]
 B -->|No| D["Pull Cache from Registry"]
 D --> E["Build with Remote Cache"]
 E --> F["Push New Layers to Registry"]
 F --> G["Final Image<br/>15 seconds vs 2m30s"]
 C --> G

 style A fill:#0173B2,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#DE8F05,color:#fff
 style G fill:#029E73,color:#fff
```

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version 3.8

services:
 frontend:
 # => Frontend service definition
 build:
 # => Build configuration for frontend
 context: ./frontend
 # => Build context: all files in ./frontend directory
 dockerfile: Dockerfile
 # => Uses default Dockerfile in context directory
 cache_from:
 # => List of images to use as cache sources
 - myregistry/frontend:latest
 # => Latest tag used as primary cache layer
 - myregistry/frontend:${GIT_BRANCH:-main}
 # => Uses remote images as cache sources
 # => Speeds up builds by reusing layers
 args:
 # => Build arguments passed to Dockerfile
 NODE_ENV: ${NODE_ENV:-production}
 # => Defaults to production if not set
 target: ${BUILD_TARGET:-production}
 # => Allows switching between dev/prod stages
 image: myregistry/frontend:${GIT_COMMIT:-latest}
 # => Tags with git commit for traceability

 backend:
 # => Go backend service definition
 build:
 context: ./backend
 # => Build context for Go backend
 cache_from:
 - myregistry/backend:latest
 # => Reuses cached Go modules and build layers
 args:
 GO_VERSION: 1.21
 # => Passes Go version as build argument
 image: myregistry/backend:${GIT_COMMIT:-latest}
 # => Same versioning pattern as frontend

 database:
 # => PostgreSQL database service
 image: postgres:15-alpine
 # => No build needed - uses pre-built image
```

```bash
# Enable BuildKit for better caching
export DOCKER_BUILDKIT=1
# => Enables BuildKit build engine
export COMPOSE_DOCKER_CLI_BUILD=1
# => Tells Compose to use Docker CLI with BuildKit

# Build all services in parallel
docker compose build --parallel
# => Builds frontend and backend simultaneously
# => Utilizes multi-core CPUs efficiently

# Build with specific target (development)
BUILD_TARGET=development docker compose build frontend
# => Builds development stage with hot reloading support

# Pull cache images before building (CI/CD optimization)
docker compose pull frontend backend
docker compose build --pull frontend backend
# => Pulls latest images to use as cache
# => --pull ensures base images are up-to-date

# Build without cache (force rebuild)
docker compose build --no-cache
# => Rebuilds all layers from scratch
# => Useful when dependencies are corrupted

# Build with progress output
docker compose build --progress=plain frontend
# => Shows detailed build output
# => Useful for debugging build failures

# Build and push to registry (CI/CD)
GIT_COMMIT=$(git rev-parse --short HEAD) \
GIT_BRANCH=$(git branch --show-current) \
docker compose build --push
# => Builds and pushes images to registry
# => Uses GIT_COMMIT and GIT_BRANCH variables for tagging

# Build-time performance: Use .dockerignore
cat > .dockerignore << 'EOF'
node_modules
# => Excludes large dependency directory
.git
# => Excludes version control metadata
.env*
# => Excludes all environment variable files
*.md
# => Excludes markdown documentation files
docs/
# => Excludes documentation directory
tests/
# => Excludes test files not needed in image
.vscode/
# => Excludes editor configuration
.idea/
# => Excludes JetBrains IDE files
EOF
# => Excludes files from build context
# => Reduces context size sent to Docker daemon
# => Significantly speeds up builds

# Measure build time
time docker compose build frontend
# => `time` command reports elapsed wall time
# => real 0m15.234s (with cache)
# => real 2m30.123s (without cache)

# Use BuildKit cache mounts for dependencies
cat >> frontend/Dockerfile << 'EOF'
RUN --mount=type=cache,target=/root/.npm \
 npm ci
EOF
# => Caches npm packages across builds
# => Dramatically speeds up dependency installation
```

**Key Takeaway**: Enable BuildKit and use `cache_from` to leverage remote image layers as cache. Build services in parallel with `--parallel` flag. Always use `.dockerignore` to exclude unnecessary files from build context. For maximum speed, use BuildKit cache mounts for package managers.

**Why It Matters**: Build performance directly impacts developer productivity and deployment velocity—slow builds create bottlenecks that delay feature releases and bug fixes. BuildKit's advanced caching reduces typical CI/CD build times from 5-10 minutes to under 30 seconds by reusing previously built layers from registries. Parallel builds on multi-core systems multiply throughput, while cache mounts for npm/pip/cargo persist package downloads across builds, eliminating redundant network transfers that waste time and bandwidth.

---

### Example 33: Health Checks in Docker Compose

Health checks determine when services are ready to receive traffic. They enable proper startup coordination and automatic recovery.

**Health Check State Machine:**

```mermaid
graph TD
 A["Container Start"] --> B["Starting<br/>start_period grace"]
 B --> C{Health Check}
 C -->|Pass| D["Healthy<br/>Service Ready"]
 C -->|Fail| E{Retries Left?}
 E -->|Yes| F["Wait interval"]
 F --> C
 E -->|No| G["Unhealthy<br/>Restart Container"]
 G --> A

 style A fill:#0173B2,color:#fff
 style D fill:#029E73,color:#fff
 style G fill:#CC78BC,color:#fff
```

```yaml
# File: docker-compose.yml

version: "3.8"
# => Docker Compose file version

services:
 database:
 image: postgres:15-alpine
 # => PostgreSQL 15 on Alpine Linux base
 environment:
 POSTGRES_PASSWORD: secret
 # => Database superuser password
 healthcheck:
 test: ["CMD-SHELL", "pg_isready -U postgres"]
 # => Executes pg_isready command to check PostgreSQL status
 # => Returns 0 if accepting connections, non-zero if not ready
 interval: 10s
 # => Run health check every 10 seconds
 timeout: 5s
 # => Mark check as failed if it takes longer than 5 seconds
 retries: 5
 # => Mark service unhealthy after 5 consecutive check failures
 start_period: 30s
 # => Grace period allowing database initialization before health checks count
 # => Failed checks during this period don't count toward retries

 redis:
 image: redis:7-alpine
 # => Redis 7 key-value cache on Alpine
 healthcheck:
 test: ["CMD", "redis-cli", "ping"]
 # => Executes redis-cli ping command
 # => Returns PONG if Redis is responsive
 interval: 5s
 # => Check every 5 seconds (faster than database)
 timeout: 3s
 # => Redis should respond quickly
 retries: 3
 # => Mark unhealthy after 3 failures
 start_period: 10s
 # => Redis starts faster than PostgreSQL

 api:
 build: ./api
 # => Builds API service from ./api directory
 depends_on:
 database:
 condition: service_healthy
 # => API waits for database health check to pass
 # => Prevents connection errors during startup
 redis:
 condition: service_healthy
 # => API waits for Redis to be ready
 healthcheck:
 test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
 # => HTTP GET request to application health endpoint
 # => -f flag makes curl fail on HTTP errors (4xx, 5xx)
 interval: 15s
 # => Check every 15 seconds
 timeout: 10s
 # => Allow up to 10 seconds for health endpoint response
 retries: 3
 # => Mark unhealthy after 3 consecutive failures
 start_period: 40s
 # => API needs time to connect to database and initialize
 environment:
 DATABASE_URL: postgresql://postgres:secret@database:5432/mydb
 # => Database connection string using service name "database"
 REDIS_URL: redis://redis:6379
 # => Redis connection using service name "redis"

 web:
 image: nginx:alpine
 # => Nginx web server on Alpine
 depends_on:
 api:
 condition: service_healthy
 # => Nginx starts only after API is healthy
 healthcheck:
 test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
 # => wget downloads health endpoint without saving (--spider)
 # => --quiet suppresses output, --tries=1 attempts once
 interval: 10s
 # => Check every 10 seconds
 timeout: 5s
 # => Nginx should respond quickly
 retries: 3
 # => Unhealthy after 3 failures
 start_period: 20s
 # => Nginx startup time
 ports:
 - "8080:80"
 # => Expose Nginx on host port 8080
```

```javascript
// File: api/health.js (API health endpoint implementation)
const express = require("express");
const { Pool } = require("pg");
const Redis = require("ioredis");

const app = express();
const db = new Pool({ connectionString: process.env.DATABASE_URL });
const redis = new Redis(process.env.REDIS_URL);

app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await db.query("SELECT 1");

    // Check Redis connection
    await redis.ping();

    // All dependencies healthy
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      dependencies: {
        database: "up",
        redis: "up",
      },
    });
  } catch (error) {
    // Dependency failure - unhealthy
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.listen(3000);
```

```bash
# Start services (observe startup coordination)
docker compose up -d
# => database and redis start first (no dependencies)
# => Health checks run during start_period
# => After 30s, database marked healthy
# => After 10s, redis marked healthy
# => api starts after both dependencies healthy
# => After 40s, api marked healthy
# => web starts after api healthy

# Monitor health status in real-time
watch -n 1 'docker compose ps'
# => NAME STATUS HEALTH
# => database Up 35 seconds healthy (5/5)
# => redis Up 35 seconds healthy (7/7)
# => api Up 10 seconds starting (health: starting)
# => web Created (waiting for api)

# Check health check logs
docker inspect myproject-database-1 --format='{{json .State.Health}}' | jq
# => {
# => "Status": "healthy",
# => "FailingStreak": 0,
# => "Log": [
# => {
# => "Start": "2025-12-29T11:00:00Z",
# => "End": "2025-12-29T11:00:00Z",
# => "ExitCode": 0,
# => "Output": "accepting connections\n"
# => }
# => ]
# => }

# Test health endpoint manually
curl http://localhost:8080/health
# => {
# => "status": "healthy",
# => "timestamp": "2025-12-29T11:00:00Z",
# => "dependencies": {
# => "database": "up",
# => "redis": "up"
# => }
# => }

# Simulate database failure
docker compose pause database
# => Database pauses (stops accepting connections)

# Wait for health checks to detect failure
sleep 30

docker compose ps
# => NAME STATUS HEALTH
# => database Up (Paused) unhealthy
# => api Up unhealthy (database check fails)
# => web Up healthy (Nginx still serves)

# Resume database
docker compose unpause database

# Health checks recover automatically
sleep 30
docker compose ps
# => All services return to healthy state
```

**Key Takeaway**: Health checks enable true readiness-based startup orchestration. Use `depends_on` with `condition: service_healthy` to ensure dependencies are fully ready before starting dependent services. Implement comprehensive health endpoints that check all critical dependencies.

**Why It Matters**: Health checks transform naive startup ordering (start database, then immediately start app) into intelligent orchestration that prevents cascading failures. Applications attempting database connections before databases finish initialization cause deployment failures that require manual intervention, creating operational toil. Comprehensive health checks that verify all dependencies enable automated zero-downtime deployments where traffic routes only to fully-ready containers, a requirement for modern continuous deployment pipelines.

---

### Example 34: Service Dependencies with Restart

Combine health checks, restart policies, and dependencies for resilient multi-service applications that automatically recover from failures.

**Service Dependency and Restart Flow:**

```mermaid
graph TD
 A["Database Starts"] --> B{Health Check}
 B -->|Pass| C["Database Healthy"]
 C --> D["Queue Starts"]
 D --> E{Queue Health Check}
 E -->|Pass| F["Queue Healthy"]
 F --> G["Worker Starts"]
 G --> H["All Services Running"]

 B -->|Fail| I["Restart Database<br/>restart: always"]
 I --> A
 E -->|Fail| J["Restart Queue<br/>restart: unless-stopped"]
 J --> D

 style C fill:#029E73,color:#fff
 style F fill:#029E73,color:#fff
 style H fill:#0173B2,color:#fff
 style I fill:#CC78BC,color:#fff
 style J fill:#CC78BC,color:#fff
```

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 # => Multi-service application stack
 database:
 # => PostgreSQL database service
 image: postgres:15-alpine
 # => Uses Alpine-based PostgreSQL 15 image
 restart: always
 # => Restarts on any failure or Docker restart
 environment:
 # => Environment variables for PostgreSQL
 POSTGRES_PASSWORD: secret  # => PostgreSQL superuser password
 healthcheck:
 # => Health check configuration
 test: ["CMD-SHELL", "pg_isready"]  # => Checks if PostgreSQL accepts connections
 interval: 10s    # => Check every 10 seconds
 timeout: 5s      # => Fail if check takes longer than 5s
 retries: 5       # => Unhealthy after 5 consecutive failures
 start_period: 30s  # => Grace period before counting failures
 volumes:
 # => Volume mounts for data persistence
 - db-data:/var/lib/postgresql/data
 # => Maps named volume to PostgreSQL data directory
 # => Data persists across restarts

 message-queue:
 # => RabbitMQ message broker service
 image: rabbitmq:3-management-alpine  # => RabbitMQ with management web UI
 restart: unless-stopped
 # => Restarts on failure but not if manually stopped
 healthcheck:
 # => Health check for message queue
 test: ["CMD", "rabbitmq-diagnostics", "ping"]  # => Verifies RabbitMQ responds
 interval: 15s    # => Check every 15s (slower start than postgres)
 timeout: 10s     # => RabbitMQ may be slow to respond
 retries: 3
 # => Unhealthy after 3 consecutive failures
 start_period: 40s
 # => RabbitMQ takes 40s before health checks count  # => RabbitMQ takes longer to initialize

 worker:
 build: ./worker  # => Builds from ./worker/Dockerfile
 restart: on-failure:3
 # => Restarts up to 3 times on failure
 # => Gives up after 3 consecutive failures (avoids infinite restart loops)
 depends_on:
 # => Wait for dependencies to be healthy before starting
 database:
 condition: service_healthy  # => Worker waits for DB health check pass
 message-queue:
 condition: service_healthy  # => Worker waits for RabbitMQ health check pass
 environment:
 # => Worker connection configuration
 DATABASE_URL: postgresql://postgres:secret@database:5432/jobs  # => "database" is Docker DNS name
 RABBITMQ_URL: amqp://guest:guest@message-queue:5672  # => "message-queue" is Docker DNS name
 healthcheck:
 # => Worker process health check
 test: ["CMD", "pgrep", "-f", "worker"]
 # => Checks if worker process is running (by name)
 interval: 20s    # => Check every 20 seconds
 timeout: 5s
 # => Fail if check takes longer than 5s
 retries: 2
 # => Unhealthy after 2 consecutive failures
 start_period: 60s
 # => Worker initialization grace period  # => Worker needs time to connect and initialize

 api:
 # => REST API service
 build: ./api
 # => Builds API from ./api/Dockerfile
 # => Runs on port 3000
 restart: unless-stopped  # => Restarts unless explicitly stopped
 depends_on:
 # => API requires healthy database and queue
 database:
 condition: service_healthy  # => API waits for healthy database
 message-queue:
 condition: service_healthy  # => API waits for healthy RabbitMQ
 healthcheck:
 # => HTTP health check for API
 test: ["CMD", "curl", "-f", "http://localhost:3000/health"]  # => HTTP health endpoint
 interval: 15s
 # => Check every 15 seconds
 timeout: 5s
 # => Fail if check takes longer than 5s
 retries: 3
 # => Unhealthy after 3 consecutive failures
 start_period: 30s  # => API needs 30s to initialize after dependencies ready
 ports:
 # => Port mapping for external access
 - "3000:3000"  # => API accessible at http://localhost:3000
 # => Maps container port 3000 to host port 3000

volumes:
 # => Named volumes defined at top level
 db-data:  # => Named volume — survives docker-compose down
 # => Managed by Docker, persists across container restarts
```

```bash
# Start all services
docker compose up -d
# => Startup order: database → message-queue → worker, api (health-check gated)
# => Services with condition: service_healthy wait for health checks to pass

# Simulate database crash
docker compose exec database pkill postgres
# => Database main process killed
# => Docker detects exit code != 0 and triggers restart policy

# Observe automatic recovery
docker compose ps -a
# => database: Restarting (restart policy: always)
# => worker: Up (waiting for database to be healthy)
# => api: Up (health check will fail until database recovers)
# => Worker and api remain Up but degrade gracefully until db recovers

# Wait for database to recover
sleep 40

docker compose ps
# => database: Up, healthy (auto-restarted)
# => worker: Up, healthy (reconnected after database recovery)
# => api: Up, healthy (health check passes after database recovery)

# Simulate repeated worker failures
docker compose exec worker sh -c 'exit 1'
# => Worker exits with error code 1
# => restart: on-failure:3 counts this as failure 1 of 3

# First restart attempt
sleep 5
docker compose ps worker
# => STATUS: Restarting (1/3 attempts)
# => Docker waits briefly before restart (exponential backoff)

# Simulate second failure
docker compose exec worker sh -c 'exit 1'
sleep 5
docker compose ps worker
# => STATUS: Restarting (2/3 attempts)
# => Backoff interval increases between attempts

# Simulate third failure
docker compose exec worker sh -c 'exit 1'
sleep 5
docker compose ps worker
# => STATUS: Exited (1) (max restarts reached)
# => Worker stops trying after 3 failures
# => Prevents infinite restart loop from crashing the host

# Manually restart worker after fixing issue
docker compose up -d worker
# => Restart count resets
# => Worker starts fresh
# => Use this after deploying a fix to the worker code

# Test API resilience during message queue restart
docker compose restart message-queue
# => Message queue restarts

docker compose ps
# => message-queue: Up (restarting)
# => api: Up (health check may fail temporarily)
# => worker: Up (will reconnect when queue is healthy)

# Wait for queue to become healthy
sleep 40

# All services recover automatically
docker compose ps
# => All services: Up, healthy
```

**Key Takeaway**: Combine `restart` policies with `depends_on` health checks for automatic failure recovery. Use `restart: always` for critical infrastructure, `unless-stopped` for application services, and `on-failure:N` for batch jobs. Services automatically reconnect to dependencies after they recover.

**Why It Matters**: Resilient systems must recover automatically from transient failures like network partitions, process crashes, or resource exhaustion without requiring manual intervention. The combination of health checks and restart policies creates self-healing infrastructure where database crashes don't cascade to permanent application failures. This pattern reduces mean-time-to-recovery (MTTR) from hours (manual intervention) to seconds (automatic restart), critical for maintaining high availability SLAs.

---

### Example 35: Resource Limits - CPU

CPU limits prevent containers from monopolizing host CPU resources. They ensure fair resource sharing and predictable performance.

**CPU Resource Allocation:**

```mermaid
graph TD
 A["Host CPU: 8 cores"] --> B["video-encoder<br/>Limit: 2.0 cores<br/>Reserved: 0.5 cores"]
 A --> C["api<br/>Limit: 1.0 core<br/>Reserved: 0.25 cores"]
 A --> D["database<br/>Limit: 4.0 cores<br/>Reserved: 1.0 core"]
 A --> E["Remaining: 1.0 core<br/>Available for bursting"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C fill:#029E73,color:#fff
 style D fill:#029E73,color:#fff
```

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 # => Service definitions for CPU limit demo
 # CPU-intensive task (limited)
 video-encoder:
 # => Video encoding service
 image: my-encoder
 # => Uses custom encoder image
 deploy:
 # => Deployment configuration
 resources:
 # => Resource limits and reservations
 limits:
 # => Hard upper limit for CPU usage
 cpus: "2.0"
 # => Maximum 2 CPU cores
 # => Can burst to 2 cores max
 reservations:
 # => Guaranteed minimum resources
 cpus: "0.5"
 # => Guaranteed 0.5 CPU cores minimum
 # => Scheduler ensures this baseline
 command: encode --input video.mp4 --output compressed.mp4
 # => Encoding command with input/output paths
 # => --input and --output specify file paths

 # Web API (moderate CPU)
 api:
 # => REST API service
 image: my-api  # => Pre-built API image
 deploy:
 # => Deployment resource configuration
 resources:
 # => Resource constraints for API
 limits:
 cpus: "1.0"
 # => Maximum 1 CPU core — bursts capped here
 reservations:
 cpus: "0.25"
 # => Guaranteed 0.25 CPU cores minimum
 ports:
 # => Port mappings
 - "3000:3000"  # => API accessible at localhost:3000

 # Background worker (low priority — runs when API is idle)
 worker:
 # => Background processing service
 image: my-worker
 # => Uses custom worker image
 deploy:
 # => Worker deployment configuration
 resources:
 # => Resource constraints for worker
 limits:
 cpus: "0.5"
 # => Maximum 0.5 CPU cores (50% of 1 core)
 reservations:
 cpus: "0.1"
 # => Guaranteed 0.1 CPU cores minimum
 # CPU shares for relative priority under contention
 cpu_shares: 512  # => Default is 1024
 # => Worker gets half CPU time of default containers when all compete
```

```bash
# Run containers with CPU limits (requires Docker Swarm mode or docker run)
docker run -d --name encoder \
# => Create encoder container in detached mode
 --cpus="2.0" \
# => Hard limit: maximum 2 CPU cores
 --cpu-shares=1024 \
# => CPU priority weight (default=1024)
 my-encoder
# => Limited to 2 CPU cores maximum
# => --cpu-shares sets relative CPU priority

# Check CPU usage in real-time
docker stats encoder
# => CONTAINER CPU % MEM USAGE / LIMIT
# => encoder 200.00% 1.5GiB / 8GiB
# => CPU % capped at 200% (2 cores)

# Run CPU stress test inside container
docker exec encoder sh -c 'for i in $(seq 1 8); do
 sh -c "while true; do :; done" &
done'
# => Spawns 8 infinite loops (tries to use all CPUs)

docker stats encoder
# => encoder 200.00% (capped at 2 cores even with 8 busy loops)

# Without limits (comparison)
docker run -d --name encoder-unlimited my-encoder
docker exec encoder-unlimited sh -c 'for i in $(seq 1 8); do
 sh -c "while true; do :; done" &
done'

docker stats encoder-unlimited
# => encoder-unlimited 800.00% (uses all 8 cores)

# CPU shares test: Relative priority
docker run -d --name high-priority --cpu-shares=2048 alpine sh -c 'while true; do :; done'
# => Runs with high CPU priority (2048 shares = 2x default)
docker run -d --name low-priority --cpu-shares=512 alpine sh -c 'while true; do :; done'
# => Runs with low CPU priority (512 shares = half default)'
# => high-priority gets 4x more CPU time than low-priority when both compete

docker stats high-priority low-priority
# => high-priority 400.00% (4 cores)
# => low-priority 100.00% (1 core)
# => Ratio matches cpu-shares ratio (2048:512 = 4:1)

# Inspect CPU settings
docker inspect encoder --format='{{.HostConfig.NanoCpus}}'
# => 2000000000 (2.0 CPUs in nanoseconds)

docker inspect encoder --format='{{.HostConfig.CpuShares}}'
# => 1024 (default CPU shares)

# Clean up
docker rm -f encoder encoder-unlimited high-priority low-priority
# => Removes all test containers forcefully
```

**Key Takeaway**: Use `--cpus` to set hard CPU limits preventing resource monopolization. Use `--cpu-shares` for relative CPU priority when containers compete. Reservations guarantee minimum CPU allocation in Swarm mode. Monitor with `docker stats` to verify limits are effective.

**Why It Matters**: Without CPU limits, a single misbehaving container can monopolize all CPU cores, creating "noisy neighbor" problems that starve other containers and degrade entire-system performance. CPU limits enable predictable multi-tenant deployments where Shares-based priority ensures critical services get proportionally more CPU during contention, implementing quality-of-service guarantees essential for SLA compliance.

---

### Example 36: Resource Limits - Memory

Memory limits prevent OOM (Out Of Memory) issues and ensure stable multi-container deployments.

**Memory Limit Behavior:**

```mermaid
graph TD
 A["Container Memory Usage"] --> B{Below Limit?}
 B -->|Yes| C["Continue Running"]
 B -->|No| D["Memory Limit Reached"]
 D --> E{OOM Killer}
 E -->|Kill Container| F["Container Terminated<br/>Exit Code 137"]
 E -->|Swap Available| G["Use Swap<br/>Performance Degraded"]

 style C fill:#029E73,color:#fff
 style D fill:#DE8F05,color:#fff
 style F fill:#CC78BC,color:#fff
```

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 # => Service definitions with memory constraints
 database:
 # => PostgreSQL database service
 image: postgres:15-alpine
 # => Alpine-based PostgreSQL 15
 deploy:
 # => Deployment resource configuration
 resources:
 # => Resource limits and reservations
 limits:
 # => Hard memory limit
 memory: 2G
 # => Hard limit: 2 gigabytes
 # => Container killed if exceeds (OOM kill)
 reservations:
 # => Guaranteed memory reservation
 memory: 1G
 # => Guaranteed minimum: 1 gigabyte
 environment:
 # => PostgreSQL environment variables
 POSTGRES_PASSWORD: secret
 # => Database superuser password

 redis:
 # => Redis in-memory cache service
 image: redis:7-alpine
 # => Alpine-based Redis 7
 deploy:
 # => Redis deployment configuration
 resources:
 # => Redis resource constraints
 limits:
 memory: 512M
 # => 512 megabytes max
 command: redis-server --maxmemory 400mb --maxmemory-policy allkeys-lru
 # => Redis internal limit (400MB) below Docker limit (512MB)
 # => LRU eviction when Redis reaches 400MB

 api:
 # => REST API service
 image: my-api
 # => Pre-built API image
 deploy:
 # => API deployment configuration
 resources:
 # => API resource constraints
 limits:
 memory: 1G   # => Hard limit: 1GB — OOM kill if exceeded
 reservations:
 memory: 256M  # => Guaranteed 256MB minimum
 environment:
 # => Node.js memory configuration
 NODE_OPTIONS: "--max-old-space-size=896"
 # => Node.js heap limit (896MB) below Docker limit (1GB)
 # => Prevents Node from triggering OOM kill before graceful degradation

 worker:
 # => Background worker service
 image: my-worker
 # => Pre-built worker image
 deploy:
 # => Worker deployment configuration
 resources:
 # => Worker resource constraints
 limits:
 memory: 512M  # => Hard limit: 512MB for worker process
 # Memory swap disabled for predictable performance
 mem_swappiness: 0
 # => Prevents swapping (keeps everything in RAM, no I/O latency)
```

```bash
# Run container with memory limit
docker run -d --name mem-limited \
# => Create memory-limited container
 --memory="512m" \
# => Hard memory limit: 512MB
 --memory-reservation="256m" \
# => Soft memory limit: 256MB
 my-app
# => Hard limit: 512MB (OOM kill if exceeded)
# => Soft limit: 256MB (preferred maximum)

# Monitor memory usage
docker stats mem-limited
# => CONTAINER MEM USAGE / LIMIT
# => mem-limited 312MiB / 512MiB

# Test OOM behavior (exceeds limit)
docker exec mem-limited sh -c '
 # Allocate 600MB (exceeds 512MB limit)
 python3 -c "s = \" \" * (600 * 1024 * 1024); import time; time.sleep(60)"
'
# => Container killed by OOM killer after a few seconds

docker ps -a --filter name=mem-limited
# => STATUS: Exited (137)
# => Exit code 137 = SIGKILL from OOM killer

# Check OOM kill event
docker inspect mem-limited --format='{{.State.OOMKilled}}'
# => true

# Memory swap control
docker run -d --name no-swap \
# => Container with no swap allowed
 --memory="1g" \
# => Hard memory limit: 1GB
 --memory-swap="1g" \
# => memory-swap=memory means NO swap
 my-app
# => Uses custom application image
# => memory-swap = memory means NO swap
# => All memory must be RAM (no swapping to disk)

docker run -d --name with-swap \
 --memory="1g" \
 --memory-swap="2g" \
 my-app
# => Can use 1GB RAM + 1GB swap (2GB total virtual memory)

# Memory reservation (soft limit)
docker run -d --name soft-limit \
 --memory-reservation="256m" \
 my-app
# => No hard limit, but tries to stay under 256MB
# => Can exceed 256MB if host has available memory
# => Reclaimed to 256MB when host is under pressure

docker stats soft-limit
# => MEM USAGE / LIMIT
# => 512MiB / unlimited
# => Can grow beyond 256MB reservation

# Inspect memory settings
docker inspect mem-limited --format='{{.HostConfig.Memory}}'
# => 536870912 (512MB in bytes)

docker inspect mem-limited --format='{{.HostConfig.MemoryReservation}}'
# => 268435456 (256MB in bytes)

# Clean up
docker rm -f mem-limited no-swap with-swap soft-limit
```

**Key Takeaway**: Always set memory limits in production to prevent OOM kills affecting host stability. Set application-level limits (Node.js heap, Redis maxmemory) slightly below Docker limits for graceful handling. Use `--memory-swap` to control swap usage - disable it for performance-critical containers.

**Why It Matters**: Unlimited memory containers risk triggering Linux OOM killer, which can randomly terminate critical system processes including Docker itself, causing catastrophic outages. Application-level limits enable graceful degradation (cache eviction, request rejection) instead of abrupt container termination that loses in-flight work. Memory limits also prevent runaway memory leaks from consuming all host RAM, protecting co-located services from cascading failures.

---

### Example 37: Combined Resource Limits

Production deployments need both CPU and memory limits for predictable performance and resource isolation.

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 # => Multi-service stack with resource limits
 database:
 # => PostgreSQL database service
 image: postgres:15-alpine
 # => Alpine-based PostgreSQL 15 image
 deploy:
 # => Database deployment configuration
 resources:
 # => CPU and memory constraints
 limits:
 cpus: "2.0"   # => Max 2 CPU cores for database
 memory: 4G    # => Hard memory cap at 4GB
 reservations:
 # => Guaranteed minimum resources
 cpus: "1.0"   # => Guaranteed 1 CPU core
 memory: 2G   # => Guaranteed 2GB minimum
 environment:
 # => PostgreSQL configuration
 POSTGRES_PASSWORD: secret
 # => Superuser password
 # PostgreSQL configuration tuned to resource limits
 POSTGRES_SHARED_BUFFERS: 1GB
 # => 25% of memory reservation — shared memory for caching
 POSTGRES_EFFECTIVE_CACHE_SIZE: 3GB
 # => 75% of memory limit — query planner cache size hint
 volumes:
 # => Volume mounts
 - db-data:/var/lib/postgresql/data  # => Named volume for data persistence

 redis:
 # => Redis cache service
 image: redis:7-alpine
 # => Alpine-based Redis 7
 deploy:
 # => Redis deployment configuration
 resources:
 # => Redis CPU and memory limits
 limits:
 cpus: "1.0"   # => Redis rarely needs more than 1 CPU
 memory: 1G   # => Hard limit for cache service
 reservations:
 # => Redis minimum resource guarantee
 cpus: "0.25"  # => Guaranteed minimum CPU
 memory: 512M  # => Guaranteed minimum memory
 command: >
 redis-server
 --maxmemory 900mb
 --maxmemory-policy allkeys-lru
 --save ""
 # => maxmemory 900MB (90% of Docker limit — headroom for Redis overhead)
 # => LRU eviction evicts least-recently-used keys when full
 # => --save "" disables RDB persistence to reduce I/O

 api:
 build: ./api  # => Builds from ./api/Dockerfile
 deploy:
 # => API deployment with replicas
 resources:
 # => Per-replica resource limits
 limits:
 cpus: "1.5"   # => Each API replica capped at 1.5 cores
 memory: 2G   # => Each API replica capped at 2GB
 reservations:
 # => Per-replica minimum resources
 cpus: "0.5"   # => Each replica guaranteed 0.5 core
 memory: 512M  # => Each replica guaranteed 512MB
 replicas: 3
 # => 3 replicas for horizontal scaling and redundancy
 environment:
 # => API runtime configuration
 NODE_OPTIONS: "--max-old-space-size=1792"
 # => Node heap: 1792MB (90% of 2GB Docker limit — graceful OOM before kill)
 ports:
 # => Port mapping for API access
 - "3000-3002:3000"  # => Port range mapped (3000, 3001, 3002 → container:3000)

 worker:
 # => Background job worker service
 build: ./worker
 # => Builds from ./worker/Dockerfile
 deploy:
 # => Worker deployment configuration
 resources:
 # => Per-worker resource limits
 limits:
 cpus: "2.0"   # => Workers can use up to 2 cores for job processing
 memory: 1G   # => Memory limit per worker replica
 reservations:
 # => Per-worker minimum resources
 cpus: "0.5"   # => Guaranteed 0.5 core per worker
 memory: 256M  # => Guaranteed 256MB per worker
 replicas: 2   # => 2 worker replicas for parallel job processing
 environment:
 # => Worker job concurrency configuration
 MAX_JOBS: 4
 # => Limit concurrent jobs to match CPU limit (avoid CPU oversubscription)

volumes:
 # => Named volumes defined at stack level
 db-data:  # => Named volume — persists database data across container restarts
```

```bash
# Deploy stack with resource limits (Swarm mode)
docker stack deploy -c docker-compose.yml myapp
# => Creates services with specified resource constraints

# Monitor resource usage across all services
docker stats $(docker ps --format '{{.Names}}')
# => CONTAINER CPU % MEM USAGE / LIMIT
# => db-1 45.2% 1.8GiB / 4GiB
# => redis-1 12.3% 800MiB / 1GiB
# => api-1 28.1% 1.2GiB / 2GiB
# => api-2 31.4% 1.4GiB / 2GiB
# => api-3 25.7% 1.1GiB / 2GiB
# => worker-1 98.5% 700MiB / 1GiB
# => worker-2 102.3% 750MiB / 1GiB

# Total resource allocation
# => CPU: 2 + 1 + (1.5 * 3) + (2 * 2) = 11.5 cores reserved
# => Memory: 4 + 1 + (2 * 3) + (1 * 2) = 13GB reserved

# Load test to verify limits
# Install apache bench
docker run --rm --network host jordi/ab \
 -n 10000 -c 100 http://localhost:3000/api/test
# => 10000 requests, 100 concurrent

# During load test, verify API doesn't exceed limits
watch -n 1 'docker stats --no-stream $(docker ps --filter name=api --format "{{.Names}}")'
# => Each API instance stays under 1.5 CPUs and 2GB RAM

# Check for OOM kills during load
docker ps -a --filter name=api --format '{{.Names}}: {{.Status}}'
# => api-1: Up 5 minutes (healthy)
# => api-2: Up 5 minutes (healthy)
# => api-3: Up 5 minutes (healthy)
# => No OOM kills occurred

# Verify resource reservations (Swarm mode)
docker service inspect myapp_api --format='{{json .Spec.TaskTemplate.Resources}}' | jq
# => {
# => "Limits": {
# => "NanoCPUs": 1500000000,
# => "MemoryBytes": 2147483648
# => },
# => "Reservations": {
# => "NanoCPUs": 500000000,
# => "MemoryBytes": 536870912
# => }
# => }
```

**Key Takeaway**: Always set both CPU and memory limits in production for predictable performance. Configure application-level limits (database shared buffers, Node heap) to match Docker resource limits. Use reservations to guarantee baseline resources for critical services.

**Why It Matters**: Combined resource limits create enforceable service boundaries that enable dense multi-tenant deployments where dozens of microservices run on commodity hardware with predictable performance. Misaligned limits (Docker says 2GB but app allocates 4GB) cause OOM kills and instability—alignment ensures graceful behavior. Resource reservations provide guaranteed capacity that orchestrators like Kubernetes use for intelligent scheduling, preventing oversubscription that degrades performance.

---

### Example 38: Logging Drivers

Docker supports multiple logging drivers for centralized log aggregation. Choose drivers based on your logging infrastructure.

**Centralized Logging Architecture:**

```mermaid
%% Logging drivers flow
graph TD
 A["Container App"] --> B["Docker Logging Driver"]
 B --> C1["json-file<br/>Local disk"]
 B --> C2["syslog<br/>Remote syslog server"]
 B --> C3["fluentd<br/>Fluentd forwarder"]
 B --> C4["gelf<br/>Graylog/ELK"]
 C3 --> D["Elasticsearch"]
 C4 --> D
 D --> E["Kibana<br/>Visualization"]

 style A fill:#0173B2,color:#fff
 style B fill:#DE8F05,color:#fff
 style C3 fill:#029E73,color:#fff
 style C4 fill:#029E73,color:#fff
 style E fill:#029E73,color:#fff
```

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 # Default JSON file logging (local)
 app-default:
 # => Application with local JSON file logging
 image: my-app
 # => Application image
 logging:
 # => Logging driver configuration
 driver: json-file
 # => Stores logs as JSON on local disk
 options:
 # => JSON file logging options
 max-size: "10m"
 # => Rotate when log file reaches 10MB
 max-file: "3"
 # => Keep 3 rotated files
 # => Total max: 30MB per container
 labels: "service,environment"
 # => Include service and environment labels in logs

 # Syslog driver (centralized)
 app-syslog:
 # => Application with syslog forwarding
 image: my-app
 # => Application image
 logging:
 # => Syslog driver configuration
 driver: syslog
 # => Forwards logs to syslog server
 options:
 # => Syslog connection options
 syslog-address: "tcp://192.168.1.100:514"
 # => Remote syslog server
 syslog-format: "rfc5424"
 # => RFC5424 format (structured)
 tag: "{{.Name}}/{{.ID}}"
 # => Log tag with container name and ID

 # Fluentd driver (EFK stack)
 app-fluentd:
 # => Application with Fluentd forwarding
 image: my-app
 # => Application image
 logging:
 # => Fluentd driver configuration
 driver: fluentd
 # => Forwards logs to Fluentd aggregator
 options:
 # => Fluentd connection options
 fluentd-address: "localhost:24224"
 # => Fluentd forwarder address
 fluentd-async: "true"
 # => Non-blocking async mode
 tag: "docker.{{.Name}}"
 # => Tag for fluentd routing
 depends_on:
 # => Requires Fluentd to be running
 - fluentd
 # => Wait for fluentd service

 # GELF driver (Graylog/ELK)
 app-gelf:
 # => Application with GELF logging (Graylog Extended Log Format)
 image: my-app
 # => Application image
 logging:
 # => GELF driver configuration
 driver: gelf
 # => Forwards logs in GELF format
 options:
 # => GELF connection options
 gelf-address: "udp://graylog.example.com:12201"
 # => Graylog server
 tag: "{{.Name}}"
 # => Container name as log tag
 gelf-compression-type: "gzip"
 # => Compress logs before sending

 # Splunk driver
 app-splunk:
 # => Application with Splunk HEC logging
 image: my-app
 # => Application image
 logging:
 # => Splunk driver configuration
 driver: splunk
 # => Forwards logs to Splunk HEC
 options:
 # => Splunk HTTP Event Collector options
 splunk-token: "B5A79AAD-D822-46CC-80D1-819F80D7BFB0"
 # => Splunk HEC authentication token
 splunk-url: "https://splunk.example.com:8088"
 # => Splunk HEC endpoint URL
 splunk-insecureskipverify: "false"
 # => Verify SSL certificate

 # AWS CloudWatch driver (sends logs to AWS CloudWatch Logs)
 app-cloudwatch:
 # => Application with CloudWatch logging
 image: my-app
 # => Application image
 logging:
 # => CloudWatch driver configuration
 driver: awslogs  # => Requires AWS credentials on host (IAM role or env vars)
 options:
 # => CloudWatch Logs options
 awslogs-region: "us-east-1"   # => AWS region for CloudWatch Logs
 awslogs-group: "myapp"         # => Log group name in CloudWatch
 awslogs-stream: "{{.Name}}"   # => Log stream per container (by name)
 awslogs-create-group: "true"  # => Auto-create log group if it doesn't exist

 # Fluentd aggregator service
 fluentd:
 # => Fluentd aggregator service
 image: fluent/fluentd:v1.16-1  # => Official Fluentd forwarder image
 ports:
 # => Fluentd input port
 - "24224:24224"  # => Fluentd forward input port (TCP/UDP)
 volumes:
 # => Fluentd configuration file
 - ./fluentd.conf:/fluentd/etc/fluent.conf  # => Bind-mount custom config
```

```bash
# File: fluentd.conf
<source>
# => Input plugin configuration
 @type forward
# => Accept logs via Fluentd forward protocol
 port 24224
# => Listen on port 24224 (TCP/UDP)
 bind 0.0.0.0
# => Accept connections from any interface
</source>

<match docker.**>
# => Match all docker.* tagged logs
 @type file
# => Write matched logs to files
 path /fluentd/log/docker
# => Output file path prefix
 append true
# => Append to existing files
 <format>
# => Output format configuration
 @type json
# => Write logs as JSON
 </format>
 <buffer>
# => Buffering configuration
 flush_interval 10s
# => Flush buffer to disk every 10 seconds
 </buffer>
# => Buffer block end
</match>
# => Elasticsearch match block end
```

```bash
# Start services with different logging drivers
docker compose up -d
# => Starts all logging driver configurations

# View logs from json-file driver (works with docker logs)
docker logs app-default
# => Shows logs via docker logs command
# => Works only with json-file driver
# => Stored in /var/lib/docker/containers/<id>/<id>-json.log

# Check log file size and rotation
docker inspect app-default --format='{{.LogPath}}'
# => /var/lib/docker/containers/../..-json.log

ls -lh $(docker inspect app-default --format='{{.LogPath}}')
# => -rw-r----- 1 root root 8.5M Dec 29 11:00 ..-json.log
# => File rotates at 10MB

# Syslog driver: docker logs doesn't work (logs sent remotely)
docker logs app-syslog
# => Error: configured logging driver does not support reading
# => Syslog driver does not buffer logs locally

# Check syslog server instead
ssh syslog-server "tail -f /var/log/syslog | grep app-syslog"
# => Access logs directly on the syslog server
# => Dec 29 11:00:00 app-syslog[12345]: Application started

# Fluentd driver: Logs sent to fluentd
docker logs app-fluentd
# => Error: configured logging driver does not support reading
# => Fluentd driver does not buffer logs locally

# Check fluentd logs
docker exec fluentd cat /fluentd/log/docker.log
# => Reads aggregated logs from fluentd container
# => {"container_name":"app-fluentd","message":"Application log"}

# GELF driver: Logs sent to Graylog
# Access Graylog web UI: http://graylog.example.com:9000
# Search for logs: source:app-gelf

# Inspect logging configuration
docker inspect app-default --format='{{json .HostConfig.LogConfig}}' | jq
# => {
# => "Type": "json-file",
# => "Config": {
# => "max-size": "10m",
# => "max-file": "3"
# => }
# => }

# Change logging driver for running container (requires restart)
docker update --log-driver=syslog app-default
# => Note: Requires container restart to take effect

# Set default logging driver globally (daemon.json)
cat > /etc/docker/daemon.json << 'EOF'
{
 "log-driver": "json-file",
 "log-opts": {
 "max-size": "10m",
 "max-file": "3"
 }
}
EOF

sudo systemctl restart docker
# => All new containers use this driver by default
```

**Key Takeaway**: Use `json-file` driver with rotation for local development. Use centralized logging drivers (syslog, fluentd, gelf, splunk, awslogs) in production for aggregation and analysis. Always configure log rotation to prevent disk space exhaustion. Remember that non-local drivers don't support `docker logs` command.

**Why It Matters**: Without log rotation, containers writing verbose logs can fill host disks within hours, causing Docker daemon crashes and system-wide outages. Centralized logging drivers enable correlation of logs across dozens of microservices for debugging distributed transactions, impossible with local logs scattered across hosts. Log aggregation is foundational for observability in production where manual SSH-based log inspection doesn't scale beyond trivial deployments.

---

### Example 39: Structured Logging

Structured logging (JSON format) enables powerful log analysis and querying in centralized logging systems.

```javascript
// File: logger.js (Winston structured logger)
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DDTHH:mm:ss.SSSZ",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    // => JSON format for structured logging
  ),
  defaultMeta: {
    service: "api",
    environment: process.env.NODE_ENV,
    container_id: process.env.HOSTNAME,
    // => HOSTNAME env var = container ID in Docker
  },
  transports: [
    new winston.transports.Console(),
    // => Logs to stdout (captured by Docker)
  ],
});

module.exports = logger;
```

```javascript
// File: app.js (Example usage)
const express = require("express");
const logger = require("./logger");

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  logger.info("HTTP request", {
    method: req.method,
    path: req.path,
    ip: req.ip,
    user_agent: req.get("user-agent"),
    request_id: req.id,
  });
  next();
});

app.get("/api/users/:id", async (req, res) => {
  const userId = req.params.id;

  logger.debug("Fetching user", { user_id: userId });
  // => {
  // => "timestamp": "2025-12-29T11:10:00.123Z",
  // => "level": "debug",
  // => "message": "Fetching user",
  // => "user_id": "12345",
  // => "service": "api",
  // => "environment": "production"
  // => }

  try {
    const user = await db.getUser(userId);

    logger.info("User retrieved successfully", {
      user_id: userId,
      duration_ms: 45,
    });

    res.json(user);
  } catch (error) {
    logger.error("Failed to fetch user", {
      user_id: userId,
      error: error.message,
      stack: error.stack,
    });
    // => {
    // => "timestamp": "2025-12-29T11:10:00.500Z",
    // => "level": "error",
    // => "message": "Failed to fetch user",
    // => "user_id": "12345",
    // => "error": "Database connection timeout",
    // => "stack": "Error: Database connection timeout\n at ..",
    // => "service": "api",
    // => "container_id": "abc123def456"
    // => }

    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, () => {
  logger.info("Server started", { port: 3000 });
});
```

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 # => Service configuration for structured logging
 api:
 # => API service with JSON structured logging
 build: .
 # => Builds from Dockerfile in current directory
 environment:
 # => Runtime environment variables
 NODE_ENV: production
 # => Activates production logging (no pretty-print)
 LOG_LEVEL: info
 # => Controls Winston log level (info/warn/error in production)
 logging:
 # => Logging driver configuration
 driver: json-file
 # => Docker's built-in JSON log driver
 options:
 # => JSON file rotation options
 max-size: "10m"
 # => Rotate log file when it reaches 10MB
 max-file: "3"
 # => Keep 3 rotated files (30MB max per container)
 labels: "service,environment"
 # => Include these labels in log metadata
 labels:
 # => Container labels for log routing
 service: "api"
 # => Added to all log lines for multi-service filtering
 environment: "production"
 # => Enables environment-based log routing
```

```bash
# View structured logs
docker logs api --tail 20
# => Shows last 20 log lines from api container
# => Each line is a JSON object with all structured fields
# => {"timestamp":"2025-12-29T11:10:00.123Z","level":"info","message":"Server started","port":3000,"service":"api","environment":"production","container_id":"abc123"}
# => Fields: timestamp, level, message, service, environment, container_id
# => {"timestamp":"2025-12-29T11:10:01.456Z","level":"info","message":"HTTP request","method":"GET","path":"/api/users/12345","ip":"::ffff:172.18.0.1","service":"api"}
# => HTTP requests logged with method, path, ip automatically
# => {"timestamp":"2025-12-29T11:10:01.500Z","level":"debug","message":"Fetching user","user_id":"12345","service":"api"}
# => Debug logs include user_id for full request traceability

# Filter logs with jq (extract specific fields)
docker logs api --tail 100 2>&1 | grep '^{' | jq 'select(.level=="error")'
# => Pipes last 100 log lines through grep to filter JSON-only lines
# => jq selects only entries where level=="error"
# => {
# => "timestamp": "2025-12-29T11:10:00.500Z",
# => "level": "error",
# => "message": "Failed to fetch user",
# => "user_id": "12345",
# => "error": "Database connection timeout"
# => }
# => Only error-level log entries are returned

# Extract all error messages from last 1000 lines
docker logs api --tail 1000 2>&1 | \
# => Fetch last 1000 lines including stderr (2>&1)
 grep '^{' | \
# => Filter for lines starting with { (valid JSON objects only)
 jq -r 'select(.level=="error") | "\(.timestamp) \(.message) [\(.error)]"'
# => Formats as "timestamp message [error details]" per line
# => 2025-12-29T11:10:00.500Z Failed to fetch user [Database connection timeout]
# => -r flag outputs raw strings without JSON quoting
# => 2025-12-29T11:12:30.789Z Payment processing failed [Stripe API error]

# Count log levels
docker logs api --tail 1000 2>&1 | \
# => Fetch last 1000 log entries including stderr
 grep '^{' | \
# => Filter valid JSON lines
 jq -r '.level' | \
# => Extract just the level field value from each entry
 sort | uniq -c
# => sort groups same values, uniq -c counts occurrences of each level
# => 850 info
# => 120 debug
# => 25 warn
# => 5 error

# Find slowest API requests (using duration_ms field)
docker logs api --tail 1000 2>&1 | \
# => Scan last 1000 log entries for request performance analysis
 grep '^{' | \
# => Filter to valid JSON lines only
 jq -r 'select(.duration_ms != null) | "\(.duration_ms) \(.method) \(.path)"' | \
# => Extract entries with duration_ms, format as "ms METHOD /path"
 sort -n | tail -10
# => sort -n sorts numerically by duration, tail -10 shows 10 slowest
# => 1250 GET /api/reports/monthly
# => 1450 POST /api/exports/csv
# => 2100 GET /api/analytics/dashboard

# Export logs to file for analysis
docker logs api --since 24h > api-logs-$(date +%Y%m%d).json
# => --since 24h: retrieves logs from last 24 hours only
# => date +%Y%m%d creates filename like api-logs-20251229.json
# => Creates daily log file for archival or offline analysis
# => Structured log field reference:
# => timestamp: ISO8601 timestamp of log event
# => level: Log severity (error/warn/info/debug)
# => message: Human-readable event description
# => service: Service name for multi-service filtering
# => environment: Deployment environment (production/staging)
# => container_id: Docker container ID for correlation
# => request_id: Unique ID to trace requests across services
# => user_id: User identifier for per-user log filtering
# => duration_ms: Request duration in milliseconds
# => method: HTTP method (GET/POST/PUT/DELETE)
# => path: URL path of the HTTP request
# => ip: Client IP address
# => stack: Stack trace for error entries
# => error: Error message string
# => Log analysis tips:
# => Use jq .level to extract all log levels
# => Use jq .service to filter by service name
# => Use jq select() to filter by field values
# => Use jq -r for raw string output
# => Pipe through sort | uniq -c for frequency counts
# => Use --since flag to limit time range of logs
# => Use --tail to limit number of lines
# => Combine 2>&1 to include stderr in pipe
# => grep '^{' filters only valid JSON lines
# => sort -n sorts numerically for duration analysis
# => tail -N shows last N lines (slowest/most recent)
```

**Key Takeaway**: Always use structured (JSON) logging in production for powerful querying and analysis. Include contextual metadata (request_id, user_id, service name) in every log entry. Use log levels appropriately (error for failures, info for significant events, debug for troubleshooting).

**Why It Matters**: Structured logging transforms logs from opaque text streams into queryable data, enabling analysis like "find all 500 errors for user X in service Y" in seconds instead of hours of grep. Contextual metadata like request IDs enables tracing requests across microservices, critical for debugging distributed systems where failures cascade through multiple services. Proper leveling prevents log flood from debug messages in production, which can fill disks and obscure critical errors.

---

### Example 40: Log Aggregation with EFK Stack

The EFK (Elasticsearch, Fluentd, Kibana) stack provides centralized log aggregation, search, and visualization.

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version
# => EFK stack: 5 services — api, web, fluentd, elasticsearch, kibana
# => All api/web logs flow: container stdout → fluentd → elasticsearch → kibana

services:
 # Application services using fluentd driver
 api:
 # => Backend API service
 build: ./api  # => Build from ./api/Dockerfile
 logging:
 # => Logging driver for API
 # => fluentd driver replaces default json-file driver for this service
 driver: fluentd  # => Send logs to Fluentd forwarder
 options:
 # => Fluentd connection options
 fluentd-address: localhost:24224  # => Fluentd listening address
 tag: "docker.api"  # => Tag identifies log source as "api"
 depends_on:
 # => Service startup ordering
 - fluentd  # => Fluentd must start before api (logs have nowhere to go otherwise)

 web:
 # => Frontend web service
 build: ./web
 # => Build from ./web/Dockerfile
 logging:
 # => Web service logging configuration
 driver: fluentd
 # => Send web logs to Fluentd
 options:
 # => Fluentd connection for web
 fluentd-address: localhost:24224
 # => Same Fluentd instance as API
 tag: "docker.web"  # => Tag distinguishes web logs from api logs in Elasticsearch
 depends_on:
 # => Web depends on Fluentd
 - fluentd
 # => Fluentd collects web logs

 # Fluentd log forwarder — collects from all containers, routes to Elasticsearch
 fluentd:
 # => Fluentd log aggregation service
 image: fluent/fluentd:v1.16-debian-1  # => Debian variant supports Elasticsearch plugin
 ports:
 # => Fluentd input ports
 - "24224:24224"      # => TCP forward input
 - "24224:24224/udp"  # => UDP forward input (high-volume logging)
 volumes:
 # => Fluentd configuration mounts
 - ./fluentd/fluent.conf:/fluentd/etc/fluent.conf  # => Custom routing config
 - ./fluentd/plugins:/fluentd/plugins               # => Custom Fluentd plugins
 environment:
 # => Elasticsearch connection for Fluentd
 FLUENT_ELASTICSEARCH_HOST: elasticsearch  # => Docker DNS name of ES container
 FLUENT_ELASTICSEARCH_PORT: 9200           # => Elasticsearch REST API port
 depends_on:
 # => Fluentd must wait for Elasticsearch
 - elasticsearch  # => Elasticsearch must be running before Fluentd starts routing

 # Elasticsearch — search engine and log storage
 elasticsearch:
 # => Elasticsearch search and storage engine
 image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
 # => Version 8.11.0 with full-text search capabilities
 environment:
 # => Elasticsearch startup configuration
 - discovery.type=single-node  # => Single-node mode (no cluster needed for dev)
 - xpack.security.enabled=false  # => Disable auth for development simplicity
 - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
 # => Heap size: 512MB min/max (prevents Java GC pauses from heap growth)
 ports:
 # => Elasticsearch API ports
 - "9200:9200"  # => Elasticsearch REST API
 volumes:
 # => Persistent data storage
 - es-data:/usr/share/elasticsearch/data  # => Named volume for index persistence

 # Kibana — log visualization and search UI
 kibana:
 # => Kibana visualization dashboard
 image: docker.elastic.co/kibana/kibana:8.11.0
 # => Kibana version matches Elasticsearch 8.11.0
 ports:
 # => Kibana web interface
 - "5601:5601"  # => Kibana web UI at http://localhost:5601
 environment:
 # => Kibana Elasticsearch connection
 ELASTICSEARCH_HOSTS: http://elasticsearch:9200  # => ES endpoint via Docker DNS
 depends_on:
 # => Kibana requires Elasticsearch
 - elasticsearch  # => Kibana requires running Elasticsearch

volumes:
 # => Named volumes for persistence
 es-data:  # => Named volume — ES indices survive docker-compose down
 # => Stores Elasticsearch index data persistently
```

```conf
# File: fluentd/fluent.conf

<source>
# => Input source configuration
 @type forward
# => Accept logs via Fluentd forward protocol
 port 24224
# => Listen on port 24224
 bind 0.0.0.0
# => Accept from all network interfaces
</source>
# => Input source block end

# Parse JSON logs
<filter docker.**>
# => Filter plugin for all docker.* tagged logs
 @type parser
# => Parse log field content as structured data
 key_name log
# => Parse the "log" field from container stdout
 <parse>
# => Parser configuration
 @type json
# => Parse log field as JSON
 </parse>
# => Parse block end
</filter>
# => JSON parser filter block end

# Add metadata
<filter docker.**>
# => Add metadata to all docker.* logs
 @type record_transformer
# => Transform records by adding fields
 <record>
# => Fields to add to every log entry
 hostname "#{Socket.gethostname}"
# => Add Fluentd host name to identify log source host
 fluentd_timestamp ${time}
# => Add Fluentd processing timestamp
 </record>
# => Record block end
</filter>
# => Record transformer filter block end

# Send to Elasticsearch
<match docker.**>
# => Output plugin for all docker.* tagged logs
 @type elasticsearch
# => Use Elasticsearch output plugin
 host "#{ENV['FLUENT_ELASTICSEARCH_HOST']}"
# => ES host from environment variable
 port "#{ENV['FLUENT_ELASTICSEARCH_PORT']}"
# => ES port from environment variable
 logstash_format true
# => Use Logstash-compatible index naming
 logstash_prefix docker
# => Index prefix: docker-YYYY.MM.DD
# => Creates time-series indices for easy retention management
 include_tag_key true
# => Include Fluentd tag in the document
 tag_key @log_name
# => Field name for the tag value
 <buffer>
# => Buffering for reliable delivery
 @type file
# => Store buffer on disk (survives Fluentd restarts)
 path /fluentd/log/buffer
# => Buffer file location
 flush_interval 10s
# => Send buffered logs every 10 seconds
 retry_max_interval 30s
# => Max backoff interval between retries
 retry_forever true
# => Keep retrying on ES failures (no data loss)
 </buffer>
</match>
```

```bash
# Start EFK stack
docker compose up -d
# => Starts elasticsearch, fluentd, kibana, api, web
# => Startup order: elasticsearch first (fluentd depends on it)
# => Elasticsearch takes 30-60 seconds before accepting connections

# Wait for Elasticsearch to be ready
until curl -s http://localhost:9200/_cluster/health | grep -q '"status":"green\|yellow"'; do
# => Poll cluster health until green or yellow status
# => green = all shards allocated, yellow = some replica shards missing (normal for single-node)
 echo "Waiting for Elasticsearch.."
# => Print status message while waiting
 sleep 5
# => Wait 5 seconds between health checks
done
# => Elasticsearch is now ready for indexing

# Generate some application logs
curl http://localhost:3000/api/test
# => Logs sent to fluentd → elasticsearch

# Query Elasticsearch directly
curl -X GET "localhost:9200/docker-*/_search?pretty" -H 'Content-Type: application/json' -d'
# => GET request to search all docker-* indices
{
 "query": {
 "match": {
 "level": "error"
 }
 },
 "size": 10,
 "sort": [
 { "@timestamp": "desc" }
 ]
}'
# => Returns last 10 error logs as JSON
# => sorted by timestamp descending

# Count logs by level
curl -X GET "localhost:9200/docker-*/_search?pretty" -H 'Content-Type: application/json' -d'
# => Aggregation query to count log levels
{
 "size": 0,
 "aggs": {
 "levels": {
 "terms": {
 "field": "level.keyword"
 }
 }
 }
}'
# => size: 0 means return only aggregation results
# => terms aggregation groups by level.keyword field
# => {
# => "aggregations": {
# => "levels": {
# => "buckets": [
# => { "key": "info", "doc_count": 1250 },
# => { "key": "debug", "doc_count": 340 },
# => { "key": "error", "doc_count": 15 },
# => { "key": "warn", "doc_count": 8 }
# => ]
# => }
# => }
# => }

# Access Kibana web UI
# => Open http://localhost:5601
# => Create index pattern: docker-*
# => Discover tab: View real-time logs
# => Visualize tab: Create dashboards

# Example Kibana query (KQL - Kibana Query Language)
# => level: "error" AND service: "api"
# => Shows only API error logs

# Create Kibana dashboard with visualizations:
# => 1. Error rate over time (line chart)
# => 2. Log level distribution (pie chart)
# => 3. Top error messages (data table)
# => 4. Request duration percentiles (histogram)

# Backup Elasticsearch data
docker exec elasticsearch curl -X PUT "localhost:9200/_snapshot/backup" -H 'Content-Type: application/json' -d'
# => Create snapshot repository via Elasticsearch API
{
 "type": "fs",
 "settings": {
 "location": "/usr/share/elasticsearch/backup"
 }
}'
# => Creates backup repository pointing to filesystem path

docker exec elasticsearch curl -X PUT "localhost:9200/_snapshot/backup/snapshot_1?wait_for_completion=true"
# => Creates snapshot named snapshot_1 from all indices
# => wait_for_completion=true: blocks until snapshot completes
```

**Key Takeaway**: EFK stack provides production-grade log aggregation with powerful search and visualization. Fluentd collects logs from all containers, Elasticsearch stores and indexes them, Kibana provides real-time dashboards. Use index patterns and retention policies to manage log storage costs.

**Why It Matters**: The EFK stack is the industry standard for centralized logging at scale, used by organizations managing thousands of containers generating millions of log events per minute. Full-text search in Elasticsearch enables finding needles in haystacks—locating specific error patterns across billions of log lines in milliseconds. Real-time Kibana dashboards provide operational visibility into application health, error rates, and performance trends that would be impossible to extract from raw log files.

---

### Example 41: Custom Bridge Networks

Custom bridge networks provide network isolation, automatic DNS resolution, and better security than the default bridge network.

**Network Topology:**

```mermaid
graph TD
 A["frontend-net<br/>172.20.0.0/16"] --> B["frontend<br/>172.20.0.2"]
 A --> C["api<br/>172.20.0.3"]

 D["backend-net<br/>172.21.0.0/16"] --> C
 D --> E["database<br/>172.21.0.2"]

 B -.->|Can access| C
 B -.x->|Cannot access| E
 C -.->|Can access| E

 style A fill:#0173B2,color:#fff
 style D fill:#0173B2,color:#fff
 style C fill:#DE8F05,color:#fff
 style E fill:#029E73,color:#fff
```

```yaml
# File: docker-compose.yml

version: "3.8"
# => Three services: frontend (web tier), api (app tier), database (data tier)
# => Network segmentation enforces security boundaries between tiers

services:
 frontend:
 image: nginx:alpine
 networks:
 - frontend-net
 # => Isolated network for frontend services
 # => frontend cannot reach database — not on backend-net
 ports:
 - "8080:80"
 # => Only frontend is exposed to host — single entry point

 api:
 image: my-api
 networks:
 - frontend-net
 - backend-net
 # => Connects to both networks (bridge between frontend and backend)
 # => api is the only service with access to both tiers
 environment:
 DATABASE_URL: postgresql://postgres:secret@database:5432/mydb
 # => Uses service name "database" for DNS resolution
 # => DNS works because api and database share backend-net

 database:
 image: postgres:15-alpine
 networks:
 - backend-net
 # => Only accessible from backend network (isolated from frontend)
 # => No ports exposed — database unreachable from outside backend-net
 environment:
 POSTGRES_PASSWORD: secret
 volumes:
 - db-data:/var/lib/postgresql/data
 # => Named volume: data persists across container restarts

networks:
 frontend-net:
 driver: bridge
 # => Custom bridge network with automatic DNS
 # => Containers on this network resolve each other by service name
 ipam:
 config:
 - subnet: 172.20.0.0/16
 # => Custom subnet (avoids conflicts)
 # => Explicit subnet prevents overlap with host network ranges
 backend-net:
 driver: bridge
 internal: true
 # => Internal-only network (no external access)
 # => database cannot make outbound internet requests (data exfiltration prevention)
 ipam:
 config:
 - subnet: 172.21.0.0/16
 # => Different subnet range from frontend-net

volumes:
 db-data:
 # => Named volume managed by Docker (persists across restarts)
```

```bash
# Start services with custom networks
docker compose up -d

# List networks
docker network ls
# => NETWORK ID NAME DRIVER SCOPE
# => abc123def456 myproject_frontend-net bridge local
# => def456ghi789 myproject_backend-net bridge local

# Inspect network
docker network inspect myproject_frontend-net
# => {
# => "Name": "myproject_frontend-net",
# => "Driver": "bridge",
# => "IPAM": {
# => "Config": [{ "Subnet": "172.20.0.0/16" }]
# => },
# => "Containers": {
# => "abc123": { "Name": "frontend", "IPv4Address": "172.20.0.2/16" },
# => "def456": { "Name": "api", "IPv4Address": "172.20.0.3/16" }
# => }
# => }

# Test DNS resolution (automatic service discovery)
docker exec frontend ping -c 1 api
# => PING api (172.20.0.3): 56 data bytes
# => 64 bytes from 172.20.0.3: seq=0 ttl=64 time=0.123 ms
# => DNS resolution works (service name → IP)

# Test network isolation (frontend CANNOT reach database directly)
docker exec frontend ping -c 1 database
# => ping: bad address 'database'
# => Database not reachable from frontend network (security isolation)

# API CAN reach database (connected to both networks)
docker exec api ping -c 1 database
# => PING database (172.21.0.2): 56 data bytes
# => 64 bytes from 172.21.0.2: seq=0 ttl=64 time=0.098 ms

# Create standalone network manually
docker network create \
 --driver bridge \
 --subnet 172.22.0.0/16 \
 --gateway 172.22.0.1 \
 custom-network
# => Network created with custom configuration

# Connect running container to network
docker network connect custom-network frontend
# => frontend now connected to custom-network

# Disconnect from network
docker network disconnect custom-network frontend
# => frontend disconnected from custom-network

# Network aliases (multiple DNS names)
docker run -d --name web \
 --network frontend-net \
 --network-alias webapp \
 --network-alias www \
 nginx:alpine
# => Container reachable via: web, webapp, www

docker exec api ping -c 1 webapp
# => Resolves to web container

# Clean up unused networks
docker network prune
# => WARNING! This will remove all custom networks not used by at least one container.
```

**Key Takeaway**: Custom bridge networks provide automatic DNS resolution between containers, network isolation for security, and configurable subnets. Use internal networks for backend services that shouldn't have external access. Containers can connect to multiple networks to bridge network segments.

**Why It Matters**: Custom bridge networks enable microservices architecture with enforced network segmentation - frontend services cannot directly access databases, preventing lateral movement in security breaches. Automatic DNS resolution eliminates hardcoded IP addresses that break when containers restart, enabling dynamic service discovery required for container orchestration. Companies using custom networks report significantly reduced debugging time for connectivity issues — automatic DNS resolution eliminates entire classes of configuration errors that plague IP-based setups, and network-level isolation provides a measurable reduction in security incident blast radius.

### Example 42: Network Troubleshooting Tools

Troubleshoot container networking issues using diagnostic tools and techniques.

```bash
# Install networking tools in Alpine-based container
docker run -it --rm alpine sh
# Inside container:
apk add --no-cache curl wget netcat-openbsd bind-tools iproute2
# => curl: HTTP requests | wget: Downloads | netcat: Port testing
# => bind-tools: DNS queries (dig, nslookup) | iproute2: ip, ss commands

# Test HTTP connectivity
curl -v http://api:3000/health
# => Shows full HTTP request/response with timing

# Test port connectivity
nc -zv database 5432
# => Connection to database 5432 port [tcp/postgresql] succeeded!

# DNS troubleshooting
nslookup api
# => Server: 127.0.0.11 (Docker embedded DNS)
# => Name: api, Address: 172.20.0.3

dig api
# => Shows DNS query details and TTL

# Check network interfaces
ip addr show
# => eth0@if10: inet 172.20.0.2/16 — container's IP on Docker network

# Show routing table
ip route show
# => default via 172.20.0.1 dev eth0 — gateway is the bridge network

# Check listening ports
ss -tuln
# => tcp LISTEN 0.0.0.0:80 — process is bound and accepting connections

# Network performance testing with iperf3
docker run --rm -it --name iperf-server --network frontend-net \
 networkstatic/iperf3 -s
# => Server listening on 5201
docker run --rm -it --network frontend-net \
 networkstatic/iperf3 -c iperf-server
# => [ 5] 0.00-10.00 sec 10.0 GBytes 8.59 Gbits/sec (inter-container bandwidth)

# Packet capture with tcpdump
docker run --rm --net=host \
 --cap-add=NET_ADMIN \
 nicolaka/netshoot \
 tcpdump -i any port 80 -n
# => Captures HTTP traffic on all interfaces (requires NET_ADMIN cap)

# All-in-one network troubleshooting container
docker run --rm -it --network myproject_frontend-net \
 nicolaka/netshoot
# => Includes curl, dig, ping, traceroute, tcpdump, iperf3 — no installation needed

# Check container network configuration from host
docker inspect api --format='{{json .NetworkSettings.Networks}}' | jq
# => "frontend-net": {"IPAddress": "172.20.0.3", "Gateway": "172.20.0.1"}
# => "backend-net": {"IPAddress": "172.21.0.2"} — multi-network container

# Test connectivity from host to container
docker port api
# => 3000/tcp -> 0.0.0.0:3000

# Network traffic inspection
docker stats --no-stream --format "table {{.Container}}\t{{.NetIO}}"
# => api 1.2MB / 850kB | frontend 450kB / 120kB | database 200kB / 180kB

# Logs for network-related errors
docker logs api 2>&1 | grep -i "connection\|network\|timeout"
# => Filters logs for connection/network/timeout messages
```

**Key Takeaway**: Use nicolaka/netshoot or alpine with installed tools for network troubleshooting. Key diagnostics: nslookup/dig for DNS, nc for port testing, curl for HTTP, tcpdump for packet capture, ip/ss for interface/socket inspection. Always check Docker network inspect for configuration issues.

**Why It Matters**: Network issues account for 40% of production container failures, and effective troubleshooting reduces mean-time-to-resolution. The nicolaka/netshoot container provides industry-standard network diagnostic tools in a single image, eliminating the need to install tools in production containers. Proper network diagnostics prevent extended outages - when services can't communicate, quick identification of DNS failures, firewall rules, or network segmentation issues enables rapid recovery instead of trial-and-error debugging.

---

### Example 43: Init Containers Pattern

Init containers run before main application containers to perform setup tasks like waiting for dependencies, running migrations, or downloading configuration.

**Init Container Sequence:**

```mermaid
graph TD
 A["database starts"] --> B{Health Check}
 B -->|Pass| C["Database Healthy"]
 C --> D["db-migrate runs"]
 D --> E["Migrations Complete<br/>Exit 0"]
 E --> F["db-seed runs"]
 F --> G["Seeding Complete<br/>Exit 0"]
 G --> H["api starts"]
 H --> I["Application Running"]

 style C fill:#029E73,color:#fff
 style E fill:#029E73,color:#fff
 style G fill:#029E73,color:#fff
 style I fill:#0173B2,color:#fff
```

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 # Database (must be ready before API)
 database:
 # => PostgreSQL database service
 image: postgres:15-alpine
 # => Alpine-based PostgreSQL 15
 environment:
 # => Database initialization settings
 POSTGRES_PASSWORD: secret   # => PostgreSQL superuser password
 POSTGRES_DB: myapp           # => Creates "myapp" database on first start
 healthcheck:
 # => Health check configuration
 test: ["CMD-SHELL", "pg_isready -U postgres"]  # => Checks if DB accepts connections
 interval: 5s   # => Check every 5 seconds (frequent for fast init detection)
 timeout: 3s
 # => Fail if check takes longer than 3s
 retries: 10    # => Up to 10 retries (50s total before unhealthy)
 volumes:
 # => Volume mounts for persistence
 - db-data:/var/lib/postgresql/data  # => Named volume for data persistence

 # Init container: Wait for database and run migrations
 db-migrate:
 # => Database migration init container
 image: my-api:latest
 # => Reuses app image for migration scripts
 command: npm run migrate
 # => Runs database migrations
 depends_on:
 # => Migration waits for healthy database
 database:
 # => Depends on database service
 condition: service_healthy
 # => Waits for database to be healthy
 environment:
 # => Database connection for migrations
 DATABASE_URL: postgresql://postgres:secret@database:5432/myapp
 # => Full connection string with credentials
 restart: "no"
 # => Runs once, doesn't restart on failure

 # Init container: Seed initial data
 db-seed:
 # => Database seeding init container
 image: my-api:latest
 # => Reuses app image for seed scripts
 command: npm run seed
 # => Seeds initial data (admin user, default settings)
 depends_on:
 # => Seed waits for migrations to complete
 db-migrate:
 # => Depends on migration service
 condition: service_completed_successfully
 # => Waits for migrations to complete successfully
 environment:
 # => Database connection for seeding
 DATABASE_URL: postgresql://postgres:secret@database:5432/myapp
 # => Same connection string as migration
 restart: "no"
 # => Runs once, doesn't restart

 # Main application (starts after init containers)
 api:
 # => Main API service
 image: my-api:latest
 # => Production API image
 depends_on:
 # => API waits for all init tasks
 database:
 # => Wait for healthy database
 condition: service_healthy
 # => Database must pass health check
 db-migrate:
 # => Wait for migrations
 condition: service_completed_successfully
 # => Migrations must complete successfully
 db-seed:
 # => Wait for data seeding
 condition: service_completed_successfully
 # => Starts only after all init tasks complete
 environment:
 # => API database configuration
 DATABASE_URL: postgresql://postgres:secret@database:5432/myapp
 # => Full database connection URL
 ports:
 # => API port mapping
 - "3000:3000"
 # => API accessible at localhost:3000
 restart: unless-stopped
 # => Restart on failure but not manual stop

volumes:
 db-data:
 # => Named volume for database persistence
 # => Persists data across container restarts
```

```bash
# Start services (observe init container execution order)
docker compose up -d
# => Starts all services in dependency order
# => [+] Running 4/4
# => ⠿ Container database Started (0.5s)
# => ⠿ Container db-migrate Started (10.2s) ← Waits for database health
# => ⠿ Container db-seed Started (15.8s) ← Waits for migration completion
# => ⠿ Container api Started (16.1s) ← Starts after all init tasks

# Check init container logs
docker compose logs db-migrate
# => Shows stdout from db-migrate container
# => Connecting to database..
# => Running migration 001_create_users_table.. OK
# => Running migration 002_create_posts_table.. OK
# => Migrations completed successfully

docker compose logs db-seed
# => Shows stdout from db-seed container
# => Seeding admin user..
# => Seeding default settings..
# => Seed completed successfully

# Init container exits after completion
docker compose ps
# => Lists all service statuses
# => NAME STATUS PORTS
# => database Up (healthy) 5432/tcp
# => db-migrate Exited (0) 30 seconds ago
# => db-seed Exited (0) 25 seconds ago
# => api Up 0.0.0.0:3000->3000/tcp

# Restart scenario: Init containers DON'T run again
docker compose restart api
# => Restarts only the api service
# => db-migrate and db-seed don't restart (one-time tasks)

# Full recreate: Init containers run again
docker compose down
# => Stops and removes all containers, networks, and volumes
# => Stops and removes all containers
docker compose up -d
# => Re-creates all containers from scratch
# => Init containers execute again on fresh deployment

# Alternative: Shell script as init container
cat > init.sh << 'EOF'
# => Create init.sh script file
#!/bin/sh
# => Shell shebang - uses /bin/sh
set -e
# => Exit on any error

echo "Waiting for database.."
# => Print status before polling
until nc -z database 5432; do
# => nc -z tests TCP connectivity to database:5432
 echo "Database not ready, retrying in 2s.."
# => Print retry message
 sleep 2
# => Wait 2 seconds before next check
done
echo "Database ready!"
# => Database is accepting connections

echo "Running migrations.."
# => Start migration phase
npm run migrate
# => Execute migration script from package.json

echo "Seeding data.."
# => Start data seeding phase
npm run seed
# => Execute seed script from package.json

echo "Init completed successfully"
# => All init tasks done
EOF

chmod +x init.sh
# => Make script executable
# => Required for Docker to execute the script

# Use script in Compose
cat >> docker-compose.yml << 'EOF'
# => Append init service definition to compose file
 init:
# => Init service definition
 image: my-api:latest
# => Same image as main app
 command: ["/init.sh"]
# => Run the init script
 volumes:
# => Mount the init script
 - ./init.sh:/init.sh:ro
# => Read-only mount of init.sh
 depends_on:
# => Wait for database
 - database
# => Init runs after database starts
 restart: "no"
# => Run once and exit
EOF
# => Appends init service to docker-compose.yml

# Multiple parallel init tasks
cat > docker-compose-parallel-init.yml << 'EOF'
# => Create parallel init containers compose file
version: '3.8'
# => Compose file version

services:
 # Init task 1: Download config from S3
 config-downloader:
 # => S3 config download init container
 image: amazon/aws-cli
# => AWS CLI image for S3 access
 command: s3 cp s3://my-bucket/config.json /config/
# => Download config file from S3 bucket
 volumes:
 - config-data:/config
# => Store downloaded config in named volume
 restart: "no"
# => Run once and exit

 # Init task 2: Generate SSL certificates
 cert-generator:
 # => SSL certificate generation init container
 image: alpine/openssl
# => Minimal OpenSSL image
 command: sh -c "openssl req -x509 -newkey rsa:4096 -keyout /certs/key.pem -out /certs/cert.pem -days 365 -nodes -subj '/CN=localhost'"
# => Generate self-signed certificate valid for 365 days
 volumes:
 - cert-data:/certs
# => Store generated certs in named volume
 restart: "no"
# => Run once and exit

 # Main app uses outputs from both init containers
 app:
 image: my-app
# => Main application image
 depends_on:
# => Wait for both init containers
 config-downloader:
 condition: service_completed_successfully
# => Config must be downloaded
 cert-generator:
 condition: service_completed_successfully
# => Certs must be generated
 volumes:
 - config-data:/app/config:ro
# => Mount downloaded config as read-only
 - cert-data:/app/certs:ro
# => Mount generated certs as read-only

volumes:
 config-data:
# => Named volume for S3 config
 cert-data:
# => Named volume for SSL certificates
EOF
# => Creates parallel init containers compose file
# => config-downloader and cert-generator run in parallel
# => Main app waits for both to complete successfully
```

**Key Takeaway**: Init containers run one-time setup tasks before main application starts. Use `restart: "no"` to prevent init containers from restarting. Use `depends_on` with `service_completed_successfully` condition to coordinate execution order. Init containers are ideal for migrations, data seeding, configuration downloads, and waiting for dependencies.

**Why It Matters**: Init containers implement the separation of concerns principle - setup logic stays separate from application logic, preventing contamination of application containers with one-time scripts. This pattern eliminates race conditions where applications start before databases finish initializing, preventing cascading deployment failures. Organizations using init containers report dramatically fewer deployment failures caused by dependency ordering race conditions. By decoupling initialization logic from application logic, teams gain clearer failure diagnostics — when a migration init container fails, the root cause is immediately visible rather than buried in application startup noise.

### Example 44: Shared Volumes for Data Exchange

Share data between containers using volumes for loose coupling and data persistence.

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 # Producer: Generates data files
 data-generator:
 # => Data producer service
 image: alpine
 # => Minimal Alpine image
 command: sh -c "while true; do date > /data/timestamp.txt; sleep 10; done"
 # => Writes current timestamp to shared volume every 10 seconds
 volumes:
 # => Volume mounts for data sharing
 - shared-data:/data
 # => Mounts shared volume at /data

 # Consumer 1: Processes data files
 processor:
 # => Data processor service
 image: alpine
 # => Minimal Alpine image
 command: sh -c "while true; do cat /data/timestamp.txt 2>/dev/null || echo 'No data yet'; sleep 5; done"
 # => Reads timestamp from shared volume every 5 seconds
 volumes:
 # => Read-only access to shared data
 - shared-data:/data:ro
 # => Read-only mount (cannot modify shared data)
 depends_on:
 # => Processor waits for data-generator
 - data-generator
 # => Ensures producer starts first

 # Consumer 2: Backs up data
 backup:
 # => Data backup service
 image: alpine
 # => Minimal Alpine image
 command: sh -c "while true; do cp /data/timestamp.txt /backup/backup-$(date +%s).txt 2>/dev/null || true; sleep 30; done"
 # => Creates backup every 30 seconds
 volumes:
 # => Volume mounts for backup
 - shared-data:/data:ro
 # => Read-only access to shared data
 - backup-data:/backup
 # => Separate volume for backups

 # Multi-container write example (needs coordination)
 writer1:
 # => First log writer service
 image: alpine
 # => Minimal Alpine image
 command: sh -c "while true; do echo 'Writer1: $(date)' >> /data/log.txt; sleep 5; done"
 # => Appends to shared log file every 5 seconds
 volumes:
 # => Shared log volume (read-write)
 - log-data:/data
 # => Mounts log volume for writing

 writer2:
 # => Second log writer service
 image: alpine
 # => Minimal Alpine image
 command: sh -c "while true; do echo 'Writer2: $(date)' >> /data/log.txt; sleep 7; done"
 # => Appends to shared log file every 7 seconds
 volumes:
 - log-data:/data
 # => Both writers append to same file (potential race condition)

 # Reader: Monitors aggregated logs
 log-reader:
 # => Log reader/monitor service
 image: alpine
 # => Minimal Alpine image
 command: sh -c "while true; do tail -f /data/log.txt 2>/dev/null || sleep 1; done"
 # => Continuously follows the shared log file
 volumes:
 # => Read-only log volume access
 - log-data:/data:ro
 # => Read-only access to prevent modifications

volumes:
 # => Named volumes for data sharing
 shared-data:
 # => Named volume managed by Docker
 backup-data:
 # => Named volume for backup files
 log-data:
 # => Named volume for aggregated logs
```

```bash
# Start services
docker compose up -d
# => Starts all services and creates named volumes
# => Creates shared-data, backup-data, log-data volumes automatically

# Verify volume creation
docker volume ls | grep shared
# => Lists volumes with 'shared' in name
# => local myproject_shared-data
# => local myproject_backup-data
# => local myproject_log-data

# Check shared data from host
docker volume inspect myproject_shared-data
# => {
# => "Mountpoint": "/var/lib/docker/volumes/myproject_shared-data/_data",
# => "Driver": "local"
# => }
# => Data stored at Mountpoint path on host filesystem

# Read shared data from volume
docker run --rm -v myproject_shared-data:/data alpine cat /data/timestamp.txt
# => Temporary container reads directly from volume
# => Sun Dec 29 12:00:00 UTC 2025
# => Temporary container reads directly from volume

# Monitor logs (multiple writers)
docker compose logs -f log-reader
# => Follow log output from log-reader service
# => Writer1: Sun Dec 29 12:00:05 UTC 2025
# => Writer2: Sun Dec 29 12:00:07 UTC 2025
# => Writer1: Sun Dec 29 12:00:10 UTC 2025
# => Writer2: Sun Dec 29 12:00:14 UTC 2025
# => (interleaved writes from both containers)

# Backup volume data
docker run --rm \
# => Temporary container for backup operation
 -v myproject_shared-data:/source:ro \
# => Mount source volume as read-only
 -v $(pwd)/backup:/backup \
# => Mount local backup directory
 alpine tar czf /backup/data-$(date +%Y%m%d).tar.gz -C /source .
# => Creates compressed backup of volume contents

# Restore volume data
docker run --rm \
 -v myproject_shared-data:/target \
 -v $(pwd)/backup:/backup \
 alpine tar xzf /backup/data-20251229.tar.gz -C /target
# => Restores data to volume

# Inspect volume usage
docker system df -v | grep myproject_shared-data
# => Check volume size in disk usage report
# => myproject_shared-data 1 1 0B 0B

# Volume with bind mount for development
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
 app:
 image: my-app
 volumes:
 - ./src:/app/src:cached
 # => Bind mount source code for live reloading
 # => :cached optimizes performance on macOS/Windows
 - ./config:/app/config:ro
 # => Read-only configuration
 - node_modules:/app/node_modules
 # => Named volume for dependencies (not bind mount)

volumes:
 node_modules:
EOF

# tmpfs volume (in-memory, not persisted)
docker run --rm \
 --tmpfs /tmp:size=100M,mode=1777 \
 alpine sh -c "echo 'test' > /tmp/file.txt && cat /tmp/file.txt"
# => Data stored in RAM, lost on container stop

# Clean up unused volumes
docker volume prune
# => Removes all unused volumes not attached to containers
# => WARNING! This will remove all local volumes not used by at least one container.
```

**Key Takeaway**: Use named volumes for persistent data sharing between containers. Mount volumes read-only (`:ro`) when containers shouldn't modify data. Use tmpfs for ephemeral data that doesn't need persistence. Coordinate multiple writers to prevent race conditions. Volumes enable loose coupling - containers don't need to know about each other.

**Why It Matters**: Shared volumes enable microservices to exchange data without tight coupling or network overhead - services communicate through files instead of APIs, simplifying architecture for batch processing pipelines. Read-only mounts provide defense-in-depth security, preventing compromised containers from corrupting shared data. Named volumes abstract storage location, enabling zero-downtime volume migrations - you can switch from local disk to network storage without modifying application containers, critical for cloud migrations and disaster recovery scenarios.

---

### Example 45: External Networks Integration

Connect Docker Compose services to existing networks created outside Compose for integration with legacy systems or other Docker deployments.

```bash
# Create external network manually (outside Compose)
docker network create \
# => Create Docker network before starting Compose
 --driver bridge \
 # => Bridge driver for container-to-container communication
 --subnet 172.25.0.0/16 \
 # => Custom subnet avoids conflicts with other networks
 --gateway 172.25.0.1 \
 # => Gateway IP for routing
 --attachable \
# => Allows non-Compose containers to join
 external-network
# => Network for cross-project communication
# => --attachable allows containers to join dynamically

# Create second external network (simulating different zones)
docker network create \
 --driver bridge \
 --subnet 172.26.0.0/16 \
 # => Separate subnet range from external-network
 dmz-network
# => DMZ network for public-facing services
# => Separates public traffic from internal network
```

```yaml
# File: docker-compose.yml (Project A - Backend Services)

version: "3.8"
# => Project A backend services compose file

services:
 database:
 # => PostgreSQL database service
 image: postgres:15-alpine
 # => Alpine-based PostgreSQL 15
 environment:
 # => Database initialization settings
 POSTGRES_PASSWORD: secret
 # => Database superuser password
 networks:
 # => Network memberships
 - external-network
 # => Connects to pre-existing network
 volumes:
 # => Data persistence volume
 - db-data:/var/lib/postgresql/data
 # => Named volume for PostgreSQL data

 api:
 # => REST API service
 image: my-api
 # => Pre-built API image
 networks:
 # => Multi-network membership
 - external-network
 # => Same external network as database
 - dmz-network
 # => Also connects to DMZ for public access
 environment:
 # => API database connection
 DATABASE_URL: postgresql://postgres:secret@database:5432/mydb
 # => Full connection string using Docker DNS

networks:
 # => External network declarations
 external-network:
 # => Declare external-network reference
 external: true
 # => Uses existing network (doesn't create new one)
 dmz-network:
 # => Declare dmz-network reference
 external: true
 # => Reuses existing DMZ network
 # => Network created by Project A

volumes:
 db-data:
 # => Named volume for database persistence
```

```yaml
# File: docker-compose-frontend.yml (Project B - Frontend Services)

version: "3.8"
# => Project B frontend services compose file

services:
 web:
 # => Nginx reverse proxy service
 image: nginx:alpine
 # => Minimal Nginx Alpine image
 networks:
 # => Network membership
 - dmz-network
 # => Connects to same DMZ network
 ports:
 # => Port mapping for external access
 - "8080:80"
 # => Nginx accessible at localhost:8080
 volumes:
 # => Nginx configuration mount
 - ./nginx.conf:/etc/nginx/nginx.conf:ro
 # => Read-only Nginx config bind mount

 frontend-app:
 # => Frontend application service
 image: my-frontend
 # => Pre-built frontend image
 networks:
 # => DMZ network membership
 - dmz-network
 # => Can communicate with api from Project A

networks:
 # => External network declarations
 dmz-network:
 # => Declare dmz-network reference
 external: true
 # => Reuses network created for Project A
```

```bash
# Start Project A (backend services)
docker compose up -d
# => Starts database and api, joins external networks
# => Database and API join external-network and dmz-network

# Start Project B (frontend services)
docker compose -f docker-compose-frontend.yml up -d
# => Web and frontend-app join dmz-network

# Verify cross-project communication
docker exec -it projecta-api-1 ping -c 1 projectb-web-1
# => PING projectb-web-1 (172.26.0.3): 56 data bytes
# => 64 bytes from 172.26.0.3: seq=0 ttl=64 time=0.089 ms
# => Containers from different projects can communicate via external network

# List containers on external network
docker network inspect external-network --format='{{range .Containers}}{{.Name}} {{.IPv4Address}}{{"\n"}}{{end}}'
# => projecta-database-1 172.25.0.2/16
# => projecta-api-1 172.25.0.3/16

# List containers on DMZ network
docker network inspect dmz-network --format='{{range .Containers}}{{.Name}} {{.IPv4Address}}{{"\n"}}{{end}}'
# => projecta-api-1 172.26.0.2/16
# => projectb-web-1 172.26.0.3/16
# => projectb-frontend-app-1 172.26.0.4/16

# Connect standalone container to external network
docker run -d --name redis \
 --network external-network \
 redis:7-alpine
# => Redis joins external network, accessible from both projects

# Network isolation verification
docker exec projecta-database-1 ping -c 1 projectb-web-1
# => ping: bad address 'projectb-web-1'
# => Database NOT on dmz-network (isolated as intended)

# Use external network for legacy system integration
docker run -d --name legacy-service \
 --network external-network \
 --ip 172.25.0.100 \
 my-legacy-app
# => Assigns specific IP for compatibility with hardcoded configurations

# Disconnect project from external network
docker compose down
# => Removes containers but external network persists

docker network ls | grep external
# => external-network (still exists after Compose down)

# Clean up external networks (manual)
docker network rm external-network dmz-network
# => ERROR: network has active endpoints
# => Must stop all containers first

docker stop $(docker ps -q --filter network=external-network)
docker network rm external-network
# => external-network removed
```

**Key Takeaway**: External networks enable communication between separate Docker Compose projects or standalone containers. Use `external: true` in Compose to reference pre-created networks. External networks persist after `docker compose down`, enabling stable inter-project connectivity. Ideal for microservices split across multiple repositories or integrating with legacy containers.

**Why It Matters**: External networks solve the deployment coordination problem in microservices architectures - teams can deploy services independently without breaking inter-service communication. This pattern enables gradual container adoption where new containerized services integrate with legacy systems through shared networks. Organizations migrating to containers use external networks to create phased rollouts - production traffic flows between containerized and non-containerized services seamlessly during multi-month migrations, preventing big-bang deployments that risk outages.

---

### Example 46: Running as Non-Root User

Always run containers as non-root users to minimize security risk from container escape exploits.

```dockerfile
# File: Dockerfile

FROM node:18-alpine

# Create app directory
WORKDIR /app

# Create non-root user and group
RUN addgroup -g 1001 -S nodejs && \
 adduser -S nodejs -u 1001 -G nodejs
# => Creates user "nodejs" with UID 1001, group GID 1001
# => -S flag creates system user (no login shell)

# Copy package files
COPY package*.json ./

# Install dependencies as root (needed for global installs)
RUN npm ci --only=production
# => npm packages often need root during installation

# Copy application code
COPY --chown=nodejs:nodejs .
# => Sets ownership to nodejs user immediately
# => Prevents permission issues later

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
# => Recursive ownership change

# Create writable directories for nodejs user
RUN mkdir -p /app/logs /app/tmp && \
 chown -R nodejs:nodejs /app/logs /app/tmp
# => Directories where application can write

# Switch to non-root user
USER nodejs
# => All subsequent commands run as nodejs user
# => Container runs as nodejs by default

EXPOSE 3000

CMD ["node", "server.js"]
```

```yaml
# File: docker-compose.yml

version: "3.8"

services:
 app:
 build: .
 # Image built with USER nodejs directive
 ports:
 - "3000:3000"
 volumes:
 - logs:/app/logs
 # => Volume for logs (writable by nodejs user)

 # Alternative: Specify user in Compose (overrides Dockerfile USER)
 api:
 image: my-api
 user: "1001:1001"
 # => Runs as UID 1001, GID 1001
 # => Overrides any USER directive in Dockerfile
 volumes:
 - api-data:/data

 # Run as arbitrary non-root user
 worker:
 image: my-worker
 user: "65534:65534"
 # => UID 65534 is "nobody" user (minimal privileges)

volumes:
 logs:
 api-data:
```

```bash
# Build image
docker build -t my-app:nonroot .

# Verify default user
docker run --rm my-app:nonroot whoami
# => nodejs
# => Runs as nodejs user (not root)

# Check user ID
docker run --rm my-app:nonroot id
# => uid=1001(nodejs) gid=1001(nodejs) groups=1001(nodejs)

# Test write permissions (should succeed for /app/logs)
docker run --rm my-app:nonroot sh -c "echo 'test' > /app/logs/test.log"
# => Success (nodejs user owns /app/logs)

# Test write permissions (should fail for /root)
docker run --rm my-app:nonroot sh -c "echo 'test' > /root/test.txt"
# => sh: can't create /root/test.txt: Permission denied
# => Non-root user cannot write to /root

# Override user at runtime (dangerous - use with caution)
docker run --rm --user root my-app:nonroot whoami
# => root
# => Overrides Dockerfile USER directive

# Check process owner on host
docker run -d --name test-nonroot my-app:nonroot sleep 3600
ps aux | grep "sleep 3600" | grep -v grep
# => 1001 12345 0.0 0.0 1234 567 ? Ss 12:05 0:00 sleep 3600
# => Process runs as UID 1001 on host (not root!)

# Security benefit: Attacker gains shell in container
docker exec test-nonroot sh
# Inside container:
whoami
# => nodejs (not root)

cat /etc/shadow
# => cat: can't open '/etc/shadow': Permission denied
# => Cannot read sensitive system files

apk add --no-cache curl
# => ERROR: Unable to lock database: Permission denied
# => Cannot install packages (no root privilege)

# File ownership on volumes (host perspective)
docker run --rm \
 -v $(pwd)/test-data:/data \
 my-app:nonroot \
 sh -c "touch /data/file.txt"

ls -ln test-data/
# => -rw-r--r-- 1 1001 1001 0 Dec 29 12:10 file.txt
# => File owned by UID 1001 (nodejs user)

# Fix ownership conflicts (if host UID differs)
# Option 1: Change host ownership to match container UID
sudo chown -R 1001:1001 test-data/

# Option 2: Run container with host user
docker run --rm \
 --user "$(id -u):$(id -g)" \
 -v $(pwd)/test-data:/data \
 my-app:nonroot \
 sh -c "touch /data/file2.txt"
# => File owned by current host user

ls -l test-data/file2.txt
# => -rw-r--r-- 1 myuser mygroup 0 Dec 29 12:15 file2.txt

# Clean up
docker rm -f test-nonroot
```

**Key Takeaway**: Always create dedicated non-root users in Dockerfiles and switch to them with USER directive. Never run production containers as root. Use `--chown` flag in COPY commands to set correct ownership. Handle volume permission conflicts by matching container UID to host requirements.

**Why It Matters**: Running as non-root is the single most effective container security practice - it prevents 90% of privilege escalation attacks by ensuring compromised containers cannot modify system files or install malware. Container escape vulnerabilities occasionally bypass namespace isolation, and non-root users limit damage even after escape - attackers gain only the limited permissions of the application user. Security compliance frameworks including CIS Docker Benchmark, PCI DSS, and FedRAMP mandate non-root containers, making this pattern a requirement for regulated industries and security certifications.

---

### Example 47: Environment Variable Management

Manage environment variables securely using .env files, secrets, and environment-specific configurations.

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
  app:
  # => Application service with env management
  image: my-app
  # => Pre-built application image
  env_file:
    # => Load environment variable files
    - .env
    # => Loads variables from .env file
    - .env.production
  # => Overlays production-specific variables
  environment:
  # => Inline environment variables (override env_file)
  NODE_ENV: ${NODE_ENV:-production}
  # => Uses $NODE_ENV from .env, defaults to "production"
  DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@database:5432/${DB_NAME}
  # => Interpolates multiple variables
  API_KEY_FILE: /run/secrets/api_key
  # => Points to secret file (not plain env var)
  LOG_LEVEL: ${LOG_LEVEL}
  # => Required variable (fails if not set)
  CACHE_TTL: ${CACHE_TTL:-3600}
  # => Optional with default value
  secrets:
    # => Secret mounts configuration
    - api_key
  # => Mounts secret as file
  ports:
    # => Port mapping configuration
    - "${APP_PORT:-3000}:3000"
  # => Configurable port from .env

secrets:
  # => Secrets definitions
  api_key:
  # => API key secret definition
  file: ./secrets/api_key.txt
  # => Reads secret from local file
  # => Mounts at /run/secrets/api_key in container
```

```bash
# File: .env (base configuration - committed to git)

NODE_ENV=development         # => Development mode (verbose errors, no minification)
DB_NAME=myapp                # => Database name shared across environments
DB_USER=postgres             # => Database username (non-sensitive, safe to commit)
APP_PORT=3000                # => Default port (overridable per environment)
LOG_LEVEL=info               # => Informational logging in development
CACHE_TTL=1800               # => 30-minute cache TTL for development testing
```

```bash
# File: .env.production (production overrides - NOT committed to git)

NODE_ENV=production          # => Production mode (optimized performance)
DB_PASSWORD=production_secret_password  # => NEVER commit this value
API_URL=https://api.example.com         # => Production API endpoint
LOG_LEVEL=warn               # => Only warnings/errors in production (reduces noise)
CACHE_TTL=7200               # => 2-hour cache TTL for production performance
```

```bash
# Add .env.production to .gitignore
cat >> .gitignore << 'EOF'
# => Append env file exclusions to .gitignore
.env.production
# => Exclude production environment file
.env.local
# => Exclude local environment overrides
.env.*.local
# => Exclude all local environment variants
secrets/
# => Exclude secrets directory
EOF

# Create .env.production.example (template for team)
cat > .env.production.example << 'EOF'
# => Create template for production env vars
NODE_ENV=production
# => Production mode setting
DB_PASSWORD=<your-production-password>
# => Placeholder for actual password
API_URL=<your-api-url>
# => Placeholder for production API URL
LOG_LEVEL=warn
# => Production log level
CACHE_TTL=7200
# => Production cache TTL
EOF
# => Committed to git as template

# Use environment variables in Compose
docker compose config
# => Shows interpolated configuration (variables replaced)

# Override env file at runtime
docker compose --env-file .env.staging up -d
# => Uses .env.staging instead of .env

# Pass environment variables from host
export DB_PASSWORD=override_password
docker compose up -d
# => Host $DB_PASSWORD takes precedence over .env file

# Check environment variables in running container
docker compose exec app env
# => Shows all environment variables

# Print specific variable
docker compose exec app sh -c 'echo $DATABASE_URL'
# => postgresql://postgres:production_secret_password@database:5432/myapp

# Security: Verify secrets are files (not env vars)
docker compose exec app sh -c 'cat /run/secrets/api_key'
# => api_key_value_from_file

docker compose exec app sh -c 'env | grep API_KEY'
# => API_KEY_FILE=/run/secrets/api_key
# => API key NOT visible in environment (secure!)

# Variable substitution validation
docker compose config 2>&1 | grep -i "variable.*not set"
# => WARNING: The LOG_LEVEL variable is not set. Defaulting to a blank string.
# => Catches missing required variables

# Multi-environment deployment pattern
# Development
docker compose up -d
# => Uses .env (development settings)

# Staging
docker compose --env-file .env.staging up -d
# => Uses staging configuration

# Production
docker compose --env-file .env.production up -d
# => Uses production configuration

# Environment variable precedence (highest to lowest):
# 1. docker compose run -e VAR=value
# 2. Shell environment variables (export VAR=value)
# 3. Environment from Compose file (environment:)
# 4.env file
# 5. Dockerfile ENV

# Test precedence
export NODE_ENV=test_override
docker compose exec app sh -c 'echo $NODE_ENV'
# => test_override
# => Shell variable overrides .env file

# Clean up environment variable
unset NODE_ENV
docker compose exec app sh -c 'echo $NODE_ENV'
# => production
# => Falls back to .env value
```

**Key Takeaway**: Use .env files for non-sensitive configuration and Docker secrets for credentials. Never commit .env.production to version control. Provide .env.example templates for team onboarding. Use variable defaults (${VAR:-default}) for optional settings. Always prefer secret files over environment variables for sensitive data.

**Why It Matters**: Environment variable mismanagement is a leading cause of security breaches - developers accidentally commit.env files with production credentials to public repositories, exposing databases and APIs. The.env/.env.production pattern separates configuration from code while preventing credential leakage through.gitignore. Secrets as files instead of environment variables prevent credential exposure through process listings and Docker inspect commands - attackers with read access to `/proc` can dump environment variables but not secret files mounted with restrictive permissions.

---

### Example 48: Docker Compose Profiles for Conditional Services

Profiles enable selective service activation for different scenarios (development, testing, production).

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 # Core services (always run)
 database:
 # => PostgreSQL database - always starts
 image: postgres:15-alpine
 # => Always starts regardless of profile
 environment:
 # => Database settings
 POSTGRES_PASSWORD: secret
 # => Database superuser password
 volumes:
 # => Persistent data storage
 - db-data:/var/lib/postgresql/data
 # => Named volume for PostgreSQL data

 api:
 # => REST API service - always starts
 image: my-api
 # => Pre-built API image
 depends_on:
 # => Wait for database
 - database
 # => API starts after database is ready
 environment:
 # => API connection settings
 DATABASE_URL: postgresql://postgres:secret@database:5432/mydb
 # => Full database connection URL
 ports:
 # => API port mapping
 - "3000:3000"
 # => API accessible at localhost:3000

 # Development tools (only in dev profile)
 pgadmin:
 # => PostgreSQL admin GUI (dev profile only)
 image: dpage/pgadmin4
 # => pgAdmin 4 web interface
 profiles: ["dev", "debug"]
 # => Only starts with: docker compose --profile dev up
 environment:
 # => pgAdmin authentication settings
 PGADMIN_DEFAULT_EMAIL: admin@example.com
 # => Default login email
 PGADMIN_DEFAULT_PASSWORD: admin
 # => Default login password
 ports:
 # => pgAdmin web interface port
 - "5050:80"
 # => pgAdmin GUI accessible at http://localhost:5050

 # Debugging tools (debug profile)
 debug-proxy:
 # => Network debugging container (debug profile only)
 image: nicolaka/netshoot
 # => Swiss-army knife for network debugging
 profiles: ["debug"]
 # => Only with: docker compose --profile debug up
 command: sleep infinity
 # => Keeps container alive for interactive debugging
 network_mode: service:api
 # => Shares network namespace with API for debugging

 # Testing tools (test profile)
 test-runner:
 # => Test execution container (test profile only)
 image: my-api
 # => Reuses API image for running tests
 profiles: ["test"]
 # => Only with: docker compose --profile test up
 command: npm test
 # => Execute test suite
 depends_on:
 # => Wait for database
 - database
 # => Database must be ready for integration tests
 environment:
 # => Test environment settings
 DATABASE_URL: postgresql://postgres:secret@database:5432/test_db
 # => Uses test_db (separate from main db)
 NODE_ENV: test
 # => Activates test mode in application

 # Performance testing (perf profile)
 load-tester:
 # => K6 load testing container (perf profile only)
 image: grafana/k6
 # => Grafana K6 load testing tool
 profiles: ["perf"]
 # => Only with: docker compose --profile perf up
 command: run /scripts/load-test.js
 # => Execute load test script
 volumes:
 # => Mount K6 test scripts
 - ./k6-scripts:/scripts
 # => Local scripts directory
 environment:
 # => K6 target configuration
 API_URL: http://api:3000
 # => K6 targets the API service via Docker DNS

 # Monitoring (monitoring profile)
 prometheus:
 # => Metrics collection (monitoring/production profiles)
 image: prom/prometheus
 # => Prometheus monitoring system
 profiles: ["monitoring", "production"]
 # => Multiple profiles - starts with either
 ports:
 # => Prometheus web interface
 - "9090:9090"
 # => Prometheus accessible at localhost:9090
 volumes:
 # => Prometheus configuration
 - ./prometheus.yml:/etc/prometheus/prometheus.yml
 # => Bind-mount Prometheus config

 grafana:
 # => Metrics visualization (monitoring/production profiles)
 image: grafana/grafana
 # => Grafana dashboard service
 profiles: ["monitoring", "production"]
 # => Same profiles as Prometheus
 ports:
 # => Grafana web interface port
 - "3001:3000"
 # => Grafana UI on port 3001 (3000 used by api)
 depends_on:
 # => Grafana requires Prometheus
 - prometheus
 # => Prometheus must be running for data source

volumes:
 db-data:
 # => Named volume for database persistence
```

```bash
# Start core services only (no profiles)
docker compose up -d
# => Starts: database, api
# => Skips: pgadmin, debug-proxy, test-runner, load-tester, prometheus, grafana

# Start with development profile
docker compose --profile dev up -d
# => --profile dev activates dev-tagged services
# => Starts: database, api, pgadmin
# => pgadmin available at http://localhost:5050

# Start with multiple profiles
docker compose --profile dev --profile debug up -d
# => Multiple --profile flags activate multiple profiles
# => Starts: database, api, pgadmin, debug-proxy
# => Multiple debugging tools available

# Run tests with test profile
docker compose --profile test up test-runner
# => Starts database, then runs tests in test-runner
# => Exits after tests complete

# Performance testing
docker compose --profile perf up load-tester
# => Runs load tests against API
# => K6 executes the load test script

# Production with monitoring
docker compose --profile production up -d
# => Starts: database, api, prometheus, grafana
# => Full production stack with monitoring

# List services including profiled ones
docker compose --profile dev --profile test config --services
# => Shows all services that would start
# => database
# => api
# => pgadmin
# => test-runner

# Check which services would start with profile
docker compose --profile dev ps
# => Shows services that would run with dev profile

# Environment-specific profile usage
# Development
docker compose --profile dev --profile debug up -d
# => Full development stack with debugging

# CI/CD pipeline
docker compose --profile test up --abort-on-container-exit
# => --abort-on-container-exit: exits when any container stops
# => Runs tests, exits when test-runner completes

# Production deployment
docker compose --profile production up -d
# => Starts production services with monitoring

# Mixed profile strategies
cat > docker-compose.override.yml << 'EOF'
# => Create development override file
version: '3.8'
# => Compose format version

services:
 # Override for local development
 api:
 # => Override API service for development
 build: .
 # => Build from local Dockerfile
 volumes:
 # => Mount source for live reload
 - ./src:/app/src:cached
 # => Cached flag optimizes macOS/Windows performance
 environment:
 # => Development environment settings
 LOG_LEVEL: debug
 # => Verbose logging for development

 # Additional dev tool (no profile needed in override)
 mailhog:
 # => Email testing service
 image: mailhog/mailhog
 # => MailHog catches outgoing emails
 ports:
 # => MailHog interface ports
 - "1025:1025"
 # => SMTP port for email catching
 - "8025:8025"
 # => Web UI at localhost:8025
EOF
# => Override file extends main compose configuration
# => docker compose automatically merges docker-compose.yml + docker-compose.override.yml
docker compose up -d
# => Includes mailhog from override file

# Profile-specific override files
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
 api:
 image: my-registry/my-api:v1.0.0
 restart: always
 deploy:
 replicas: 3
EOF
# => Production override with replicas and specific image tag

# Use specific override file
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
# => -f flags specify which compose files to merge
# => Merges base + prod override + activates production profile

# Clean up (respects profiles)
docker compose --profile dev --profile monitoring down
# => Stops all services including profiled ones
# => Removes profiled containers
```

**Key Takeaway**: Profiles enable conditional service activation without maintaining separate Compose files. Use profiles for development tools, testing utilities, monitoring stack, and environment-specific services. Combine multiple profiles to compose custom environments. Profiles keep docker-compose.yml DRY while supporting diverse use cases.

**Why It Matters**: Profiles eliminate the complexity of maintaining separate docker-compose.dev.yml, docker-compose.test.yml, and docker-compose.prod.yml files that drift apart over time and require manual synchronization. Development teams using profiles report significant reduction in onboarding time — new developers activate their required service stack with a single command instead of studying multiple Compose file variants. Profiles enable fast context switching where developers toggle debugging tools on/off with single commands, accelerating troubleshooting from 30-minute tool setup to instant availability.

---

### Example 49: Container Resource Monitoring

Monitor container resource usage in real-time to identify performance bottlenecks and optimize resource allocation.

```bash
# Real-time resource monitoring (all containers)
docker stats
# => CONTAINER CPU % MEM USAGE / LIMIT MEM % NET I/O BLOCK I/O
# => api 45.2% 1.2GiB / 2GiB 60.0% 1.5MB / 900kB 12MB / 8MB
# => db 12.3% 800MiB / 4GiB 20.0% 500kB / 450kB 100MB / 50MB
# => web 5.1% 150MiB / 512MiB 29.3% 2MB / 1.5MB 5MB / 2MB
# => Auto-refreshes every second

# Monitor specific containers
docker stats api db
# => Shows only api and db containers

# One-time snapshot (no streaming)
docker stats --no-stream
# => Single measurement, then exits

# Custom format output
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
# => CONTAINER CPU % MEM USAGE / LIMIT
# => api 45.2% 1.2GiB / 2GiB
# => db 12.3% 800MiB / 4GiB

# Export stats to CSV
docker stats --no-stream --format "{{.Container}},{{.CPUPerc}},{{.MemUsage}},{{.NetIO}}" > stats.csv
# => api,45.2%,1.2GiB / 2GiB,1.5MB / 900kB
# => Useful for analysis in spreadsheets

# Continuous monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
 echo "=== $(date) ==="
 docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
 sleep 10
done
EOF
chmod +x monitor.sh
./monitor.sh > monitoring.log &
# => Logs stats every 10 seconds to file

# Memory usage details
docker exec api sh -c 'cat /sys/fs/cgroup/memory/memory.usage_in_bytes'
# => 1258291200 (1.2GB in bytes)

# CPU usage details
docker exec api sh -c 'cat /sys/fs/cgroup/cpu/cpu.shares'
# => 1024 (CPU shares allocated)

# Process inspection inside container
docker top api
# => UID PID PPID C STIME TTY TIME CMD
# => 1001 12345 12320 0 12:00 ? 00:01:23 node server.js
# => 1001 12346 12345 0 12:00 ? 00:00:15 node worker.js

docker top api -o pid,user,%cpu,%mem,cmd
# => Custom format showing CPU/memory per process

# Check container logs for memory issues
docker logs api 2>&1 | grep -i "out of memory\|oom\|heap"
# => JavaScript heap out of memory
# => Identifies OOM errors

# Identify resource-heavy containers
docker stats --no-stream --format "{{.Container}} {{.CPUPerc}}" | sort -k2 -rn | head -5
# => api 45.2%
# => worker 23.1%
# => db 12.3%
# => Shows top 5 CPU consumers

# Memory ranking
docker stats --no-stream --format "{{.Container}} {{.MemPerc}}" | sort -k2 -rn | head -5
# => api 60.0%
# => db 20.0%
# => worker 15.5%

# Network I/O monitoring
docker stats --no-stream --format "{{.Container}} {{.NetIO}}"
# => api 1.5MB / 900kB
# => web 2MB / 1.5MB
# => (received / transmitted)

# Block I/O monitoring
docker stats --no-stream --format "{{.Container}} {{.BlockIO}}"
# => api 12MB / 8MB
# => db 100MB / 50MB
# => (read / write)

# cAdvisor for advanced monitoring
docker run -d \
 --name=cadvisor \
 --volume=/:/rootfs:ro \
 --volume=/var/run:/var/run:ro \
 --volume=/sys:/sys:ro \
 --volume=/var/lib/docker/:/var/lib/docker:ro \
 --publish=8080:8080 \
 gcr.io/cadvisor/cadvisor:latest
# => Web UI at http://localhost:8080
# => Detailed metrics per container

# Query cAdvisor API
curl -s http://localhost:8080/api/v1.3/containers/docker/api | jq '.stats[-1].cpu.usage'
# => Latest CPU usage statistics in JSON

# Alert on high resource usage
cat > alert.sh << 'EOF'
#!/bin/bash
THRESHOLD=80

while true; do
 docker stats --no-stream --format "{{.Container}} {{.CPUPerc}}" | while read container cpu; do
 cpu_int=${cpu%.*} # Remove decimal
 if [ $cpu_int -gt $THRESHOLD ]; then
 echo "ALERT: $container using $cpu CPU (threshold: ${THRESHOLD}%)"
 # Send alert (email, )
 fi
 done
 sleep 30
done
EOF
chmod +x alert.sh
./alert.sh &
```

**Key Takeaway**: Use `docker stats` for real-time resource monitoring. Monitor CPU, memory, network I/O, and block I/O. Export stats to CSV for trend analysis. Use cAdvisor for advanced metrics and historical data. Set up alerts for resource threshold violations. Identify resource-heavy containers early to prevent performance degradation.

**Why It Matters**: Real-time resource monitoring enables proactive capacity planning - teams identify memory leaks and CPU spikes before they cause outages. ---

### Example 50: Docker System Prune and Cleanup

Regularly clean up unused Docker resources to reclaim disk space and maintain system health.

```bash
# Check disk usage (comprehensive overview)
docker system df
# => TYPE TOTAL ACTIVE SIZE RECLAIMABLE
# => Images 25 5 8.5GB 6.2GB (73%)
# => Containers 30 8 2.1GB 1.8GB (86%)
# => Local Volumes 15 6 15GB 10GB (67%)
# => Build Cache 0 0 0B 0B
# => Total: 25.6GB reclaimable

# Detailed view
docker system df -v
# => Shows individual images, containers, volumes with sizes

# Remove stopped containers
docker container prune
# => WARNING! This will remove all stopped containers.
# => Are you sure you want to continue? [y/N] y
# => Deleted Containers:
# => abc123def456
# => Total reclaimed space: 1.8GB

# Force removal (no confirmation)
docker container prune -f

# Remove dangling images (untagged)
docker image prune
# => Deleted Images:
# => untagged: sha256:abc123..
# => Total reclaimed space: 2.5GB

# Remove unused images (not just dangling)
docker image prune -a
# => WARNING! This will remove all images without at least one container associated to them.
# => Deleted Images:
# => untagged: my-old-app:v1.0
# => untagged: nginx:1.20
# => Total reclaimed space: 6.2GB

# Remove unused volumes
docker volume prune
# => WARNING! This will remove all local volumes not used by at least one container.
# => Deleted Volumes:
# => old-db-data
# => Total reclaimed space: 10GB

# Remove unused networks
docker network prune
# => Deleted Networks:
# => old-frontend-net
# => Total reclaimed space: 0B (networks don't consume disk)

# Nuclear option: Remove everything unused
docker system prune -a --volumes
# => WARNING! This will remove:
# => - all stopped containers
# => - all networks not used by at least one container
# => - all volumes not used by at least one container
# => - all images without at least one container associated to them
# => - all build cache
# => Total reclaimed space: 20.5GB

# Filter by time (remove resources older than 24 hours)
docker image prune -a --filter "until=24h"
# => Removes images not used in last 24 hours

docker container prune --filter "until=168h"
# => Removes containers stopped more than 7 days ago

# Filter by label
docker image prune --filter "label!=keep"
# => Removes images without "keep" label

docker container prune --filter "label=temporary=true"
# => Removes containers with temporary=true label

# Build cache cleanup
docker builder prune
# => Removes build cache
# => Total reclaimed space: 5GB

# Build cache with age filter
docker builder prune --filter "until=48h"
# => Removes cache older than 48 hours

# Clean up exited containers
docker rm $(docker ps -q -f status=exited)
# => Removes all exited containers

# Remove containers older than 7 days
docker container prune --filter "until=168h" -f

# Clean up images from specific repository
docker images --filter=reference='my-registry/*' -q | xargs docker rmi
# => Removes all images from my-registry

# Automated cleanup cron job
cat > /etc/cron.daily/docker-cleanup << 'EOF'
#!/bin/bash
# Daily Docker cleanup

# Remove stopped containers older than 7 days
docker container prune --filter "until=168h" -f

# Remove unused images older than 30 days
docker image prune -a --filter "until=720h" -f

# Remove unused volumes
docker volume prune -f

# Remove build cache older than 7 days
docker builder prune --filter "until=168h" -f

# Log cleanup results
echo "$(date): Docker cleanup completed" >> /var/log/docker-cleanup.log
df -h /var/lib/docker >> /var/log/docker-cleanup.log
EOF

chmod +x /etc/cron.daily/docker-cleanup
# => Runs daily cleanup automatically

# Monitor disk usage trends
watch -n 60 'docker system df'
# => Updates every 60 seconds

# Identify large images
docker images --format "{{.Repository}}:{{.Tag}}\t{{.Size}}" | sort -k2 -hr | head -10
# => my-app:latest 1.2GB
# => postgres:15 380MB
# => Shows top 10 largest images

# Identify large volumes
docker volume ls --format "{{.Name}}" | while read vol; do
 size=$(docker run --rm -v $vol:/data alpine du -sh /data 2>/dev/null | cut -f1)
 echo "$vol $size"
done | sort -k2 -hr
# => db-data 15GB
# => logs 5GB

# Clean up specific volume
docker volume rm old-data-volume
# => Error: volume is in use - unable to remove
# => Must stop containers using it first

docker compose down -v
# => Stops containers AND removes named volumes

# Preserve production data during cleanup
docker volume ls --filter label=environment=production -q
# => Shows production volumes

docker volume prune --filter label!=environment=production
# => Removes non-production volumes only

# Emergency disk space recovery
df -h /var/lib/docker
# => Filesystem Size Used Avail Use% Mounted on
# => /dev/sda1 100G 95G 2.5G 98% /

docker system prune -a -f --volumes
# => Reclaims maximum disk space immediately

docker builder prune --all -f
# => Removes ALL build cache

# Verify space reclaimed
df -h /var/lib/docker
# => /dev/sda1 100G 70G 27G 73% /
# => Freed 25GB
```

**Key Takeaway**: Regular cleanup prevents disk exhaustion. Use `docker system prune` for comprehensive cleanup, with filters for safety. Automate cleanup with cron jobs using time-based filters. Always preserve production data with label filters. Monitor disk usage with `docker system df` to catch space issues early.

**Why It Matters**: Uncontrolled Docker resource accumulation causes production outages - disk exhaustion prevents container starts, log writes, and database commits. Automated cleanup with conservative filters (30-day retention) balances space reclamation with rollback safety - you can revert to previous image versions within retention window. Emergency cleanup procedures saved companies from multi-hour outages where disk-full prevented even diagnostic commands from running.

---

### Example 51: Docker Events Monitoring

Monitor Docker daemon events in real-time to track container lifecycle, network changes, and resource operations.

```bash
# Stream all events in real-time
docker events
# => 2025-12-29T12:30:00.000000000+07:00 container start abc123def456 (image=nginx:alpine, name=web)
# => 2025-12-29T12:30:01.000000000+07:00 network connect def456ghi789 (container=abc123def456, name=frontend-net)
# => 2025-12-29T12:30:05.000000000+07:00 container health_status: healthy abc123def456
# => Continuous stream of events

# Filter events by type
docker events --filter 'type=container'
# => Shows only container events (start, stop, die, kill, etc.)

docker events --filter 'type=network'
# => Shows only network events (connect, disconnect, create, destroy)

docker events --filter 'type=volume'
# => Shows only volume events (create, mount, unmount, destroy)

docker events --filter 'type=image'
# => Shows only image events (pull, push, tag, untag, delete)

# Filter by event action
docker events --filter 'event=start'
# => Shows only container start events

docker events --filter 'event=die'
# => Shows only container die events (crashes)

docker events --filter 'event=health_status'
# => Shows only health check status changes

# Filter by container name
docker events --filter 'container=api'
# => Shows events only for container named "api"

# Filter by image
docker events --filter 'image=nginx:alpine'
# => Shows events for all containers using nginx:alpine

# Filter by label
docker events --filter 'label=environment=production'
# => Shows events for production containers only

# Time-based filtering (historical events)
docker events --since '2025-12-29T12:00:00'
# => Shows events since specific timestamp

docker events --since '1h'
# => Shows events from last 1 hour

docker events --since '30m'
# => Shows events from last 30 minutes

docker events --until '2025-12-29T13:00:00'
# => Shows events until specific timestamp

# Combine filters
docker events \
 --filter 'type=container' \
 --filter 'event=die' \
 --filter 'label=environment=production'
# => Production container crashes only

# Format output
docker events --format '{{.Time}} {{.Type}} {{.Action}} {{.Actor.Attributes.name}}'
# => 2025-12-29T12:30:00 container start web
# => Custom format with timestamp, type, action, name

docker events --format 'json' | jq '.'
# => {
# => "status": "start",
# => "id": "abc123def456",
# => "from": "nginx:alpine",
# => "Type": "container",
# => "Action": "start",
# => "Actor": {
# => "ID": "abc123def456",
# => "Attributes": {
# => "image": "nginx:alpine",
# => "name": "web"
# => }
# => },
# => "time": 1735449000
# => }

# Real-time monitoring script
cat > event-monitor.sh << 'EOF'
#!/bin/bash

echo "Monitoring container events.."
docker events --filter 'type=container' --format '{{.Time}} {{.Action}} {{.Actor.Attributes.name}}' | while read line; do
 action=$(echo $line | awk '{print $2}')
 container=$(echo $line | awk '{print $3}')

 case $action in
 die)
 echo "ALERT: Container $container died!"
 # Send alert (email, Slack, PagerDuty)
 ;;
 health_status:\ unhealthy)
 echo "WARNING: Container $container is unhealthy!"
 ;;
 oom)
 echo "CRITICAL: Container $container killed by OOM!"
 ;;
 esac
done
EOF

chmod +x event-monitor.sh
./event-monitor.sh &
# => Monitors events in background

# Log events to file
docker events \
 --filter 'type=container' \
 --format '{{.Time}} {{.Action}} {{.Actor.Attributes.name}}' \
 >> /var/log/docker-events.log &
# => & runs in background — continues after terminal closes
# => Appends events continuously to log file for audit trail

# Audit trail (track all Docker operations)
docker events \
 --format '{{.Time}} {{.Type}} {{.Action}} {{.Actor.Attributes}}' \
 | tee -a /var/log/docker-audit.log
# => tee: writes to both stdout (terminal) and file simultaneously
# => Captures ALL event types (not just containers) for full audit

# Detect container restarts
docker events \
 --filter 'type=container' \
 --filter 'event=restart' \
 --format '{{.Time}} Container {{.Actor.Attributes.name}} restarted' | \
while read line; do
 echo "$line" | mail -s "Container Restart Alert" admin@example.com
# => Sends email alert for every container restart event
done
# => Loop runs indefinitely — each restart triggers one email

# Network troubleshooting with events
docker events \
 --filter 'type=network' \
 --format '{{.Time}} {{.Action}} network={{.Actor.Attributes.name}} container={{.Actor.Attributes.container}}'
# => 2025-12-29T12:30:01 connect network=frontend-net container=abc123def456
# => 2025-12-29T12:30:15 disconnect network=frontend-net container=abc123def456
# => Useful for diagnosing why containers cannot communicate

# Volume lifecycle tracking
docker events \
 --filter 'type=volume' \
 --format '{{.Time}} {{.Action}} volume={{.Actor.Attributes.name}}'
# => 2025-12-29T12:25:00 create volume=myproject_db-data
# => 2025-12-29T12:30:00 mount volume=myproject_db-data
# => 2025-12-29T12:35:00 unmount volume=myproject_db-data
# => Track volume mount/unmount patterns for storage debugging

# Image pull tracking
docker events \
 --filter 'type=image' \
 --filter 'event=pull' \
 --format '{{.Time}} Pulled image {{.Actor.Attributes.name}}'
# => 2025-12-29T12:20:00 Pulled image nginx:alpine
# => Useful for auditing which images are being pulled to the host

# Export events to monitoring system
docker events --format 'json' | while read event; do
 curl -X POST http://monitoring.example.com/events \
 -H "Content-Type: application/json" \
 -d "$event"
# => Each event POSTed as JSON to monitoring API
done
# => Streams events to external monitoring system
# => Enables integration with Datadog, New Relic, Splunk, etc.

# Historical analysis (last 24 hours)
docker events \
 --since '24h' \
 --filter 'type=container' \
 --filter 'event=die' \
 --format '{{.Actor.Attributes.name}}' | \
 sort | uniq -c | sort -rn
# => 15 worker
# => 8 api
# => 3 frontend
# => Sorted by crash frequency — identify most unstable services
# => Shows which containers crashed most frequently
```

**Key Takeaway**: Docker events provide real-time visibility into daemon operations. Use filters to focus on specific event types, actions, or resources. Format output as JSON for integration with monitoring systems. Track container crashes, health status changes, and OOM kills for proactive incident response. Log events for compliance and audit trails.

**Why It Matters**: Docker events enable real-time incident detection - teams can trigger alerts within seconds of container crashes instead of waiting for users to report downtime. Event-driven automation responds to failures instantly, for example automatically restarting crashed containers or notifying on-call engineers when production services become unhealthy. Compliance requirements like SOC 2 and ISO 27001 mandate audit trails of infrastructure changes, and Docker events provide complete forensic records showing who started containers, when images were pulled, and why services failed.

---

### Example 52: Docker Compose Watch for Development

Docker Compose watch enables automatic service updates when code changes, accelerating development workflow.

**Note**: This feature requires Docker Compose v2.22+ with `watch` configuration.

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 frontend:
 # => Frontend service with watch configuration
 build:
 # => Build configuration
 context: ./frontend
 # => Build context: ./frontend directory
 target: development
 # => Development stage with hot reloading
 develop:
 # => Docker Compose watch configuration
 watch:
 # => File watch rules
 - action: sync
 # => Sync action: copy files without rebuild
 path: ./frontend/src
 # => Watch this local path
 target: /app/src
 # => Sync to this container path
 # => Syncs src/ changes to container without rebuild
 # => Fastest action — no image rebuild required
 - action: rebuild
 # => Rebuild action: full image rebuild
 path: ./frontend/package.json
 # => Rebuilds image when package.json changes
 # => Full image rebuild triggered by dependency changes
 environment:
 # => Frontend environment variables
 NODE_ENV: development
 # => Development mode with verbose errors
 ports:
 # => Frontend port mapping
 - "3000:3000"
 # => Frontend accessible at localhost:3000
 volumes:
 # => Anonymous volume for node_modules
 - /app/node_modules
 # => Anonymous volume prevents overwriting node_modules

 api:
 # => API service with watch configuration
 build:
 # => API build configuration
 context: ./api
 # => Build context: ./api directory
 target: development
 # => Uses development build stage
 develop:
 # => API watch configuration
 watch:
 # => API file watch rules
 - action: sync
 # => Sync source changes
 path: ./api/src
 # => Watch API source directory
 target: /app/src
 # => Sync to container's src
 ignore:
 # => Paths to exclude from sync
 - node_modules/
 # => Skip node_modules (large, not needed)
 - dist/
 # => Excludes paths from sync (build artifacts and dependencies)
 - action: sync+restart
 # => Sync and restart for config changes
 path: ./api/config
 # => Watch config directory
 target: /app/config
 # => Syncs and restarts service (config changes need restart)
 - action: rebuild
 # => Full rebuild for dependency changes
 path: ./api/package.json
 # => Full rebuild when dependencies change
 command: npm run dev
 # => Development server with auto-reload
 environment:
 # => API runtime settings
 NODE_ENV: development
 # => Development mode
 DATABASE_URL: postgresql://postgres:secret@database:5432/dev_db
 # => Development database connection
 ports:
 # => API port mapping
 - "4000:4000"
 # => API accessible at localhost:4000

 database:
 # => PostgreSQL development database
 image: postgres:15-alpine
 # => Alpine-based PostgreSQL 15
 environment:
 # => Database initialization settings
 POSTGRES_PASSWORD: secret
 # => Development database password
 POSTGRES_DB: dev_db
 # => Creates dev_db database on first start
 volumes:
 # => Volume mounts for data and initialization
 - db-data:/var/lib/postgresql/data
 # => Persistent data volume
 - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
 # => Initialization script runs once on first startup

volumes:
 db-data:
 # => Named volume for development database
```

```dockerfile
# File: frontend/Dockerfile

# Development stage
FROM node:18-alpine AS development
# => Base: Alpine Node.js 18 for development

WORKDIR /app
# => Set working directory to /app

COPY package*.json ./
# => Copy package.json and package-lock.json
RUN npm install
# => Includes devDependencies for hot reloading

COPY .
# => Copy all source files

EXPOSE 3000
# => Document development server port

CMD ["npm", "run", "dev"]
# => Development server (watches for changes)

# Production stage
FROM node:18-alpine AS production
# => Separate production stage for optimized image

WORKDIR /app
# => Set working directory

COPY package*.json ./
# => Copy package files for dependency installation
RUN npm ci --only=production
# => Install only production dependencies (no devDeps)

COPY .
# => Copy application source
RUN npm run build
# => Build production bundle

EXPOSE 3000
# => Document production server port

CMD ["npm", "start"]
# => Start production server
```

```bash
# Start services with watch mode
docker compose watch
# => Enables automatic file sync and rebuild on changes
# => [+] Running 3/3
# => ⠿ Container frontend Started
# => ⠿ Container api Started
# => ⠿ Container database Started
# => Watching for file changes..

# Make code change in frontend/src/App.js
echo "console.log('Updated!');" >> frontend/src/App.js
# => Append line to App.js to simulate code change
# => docker compose watch detects change
# => [frontend] Syncing files to container..
# => [frontend] 1 file updated
# => No rebuild needed (sync action)

# Change package.json (add dependency)
echo ' "new-package": "^1.0.0"' >> frontend/package.json
# => Adding dependency triggers rebuild action
# => [frontend] Rebuilding image..
# => [frontend] Building frontend..
# => [frontend] Container restarted with new image
# => Full rebuild triggered

# Change API config file
echo "LOG_LEVEL=debug" >> api/config/.env
# => Config change triggers sync+restart action
# => [api] Syncing config to container..
# => [api] Restarting service..
# => Sync + restart (no rebuild)

# Watch mode with specific services
docker compose watch frontend api
# => Watch only specified services
# => Watches only frontend and api (not database)

# Alternative: Live reload without Compose watch
# (Legacy approach using volumes)
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
 frontend:
 build:
 context: ./frontend
 target: development
 volumes:
 - ./frontend/src:/app/src:cached
 # => Bind mount for live reloading
 - /app/node_modules
 # => Preserve node_modules
 environment:
 CHOKIDAR_USEPOLLING: "true"
 # => Polling for file changes (cross-platform)
 ports:
 - "3000:3000"
 command: npm run dev
EOF

docker compose -f docker-compose.yml -f docker-compose.dev.yml up
# => Merge base and dev override files

# Watch actions explained:
# - sync: Copy changed files to container (fastest)
# - sync+restart: Copy files and restart container
# - rebuild: Rebuild image and recreate container (slowest)

# Ignore patterns
cat >> docker-compose.yml << 'EOF'
# => Append ignore patterns to frontend watch config
 frontend:
 develop:
 watch:
 - action: sync
 path: ./frontend/src
 target: /app/src
 ignore:
 - "**/*.test.js"
 - "**/__tests__/**"
 - "*.md"
 # => Ignores test files and markdown
EOF

# Performance: Choose appropriate action
# sync: For code changes (JS, CSS, HTML)
# sync+restart: For config changes
# rebuild: For dependency changes (package.json, Dockerfile)

# Best practice: Multi-stage Dockerfile
# - Development stage: Includes dev tools, hot reloading
# - Production stage: Optimized, no dev dependencies

# Monitor watch events
docker compose watch -d
# => Run watch mode as background daemon
# => Runs in background

docker compose logs -f frontend
# => Follow frontend container logs in real-time
# => [frontend] Files synced: src/App.js
# => [frontend] Hot reload triggered
# => Shows live reload events

# Stop watch mode
docker compose down
# => Terminates watch mode and all services
# => Stops all services and watch mode
```

**Key Takeaway**: Docker Compose watch enables fast development iteration with automatic syncing and smart rebuild decisions. Use `sync` for code changes, `sync+restart` for config changes, `rebuild` for dependency changes. Multi-stage Dockerfiles with development targets optimize for both dev speed and production efficiency. Watch mode eliminates manual rebuild/restart cycles.

**Why It Matters**: Docker Compose watch reduces development iteration time from 30-60 seconds (manual rebuild/restart) to 1-2 seconds (automatic sync), improving developer productivity by 90% during active coding. The intelligent action system prevents unnecessary rebuilds - changing a single JavaScript file triggers sync instead of full image rebuild, saving 45-second build cycles. This developer experience improvement translates directly to faster feature delivery - teams using watch mode ship features significantly faster, with the reduced feedback loop compounding across hundreds of daily code edits — the time saved from eliminating manual rebuild cycles translates directly into more iterative experimentation and higher-quality end results.

### Example 53: Blue-Green Deployment with Docker Compose

Blue-green deployment eliminates downtime by running two identical production environments (blue and green) and switching traffic between them.

```yaml
# File: docker-compose.blue.yml

version: "3.8"
# => Blue deployment compose file

services:
  api-blue:
  # => Blue deployment of API service
  image: my-api:${VERSION:-latest}
  # => VERSION set via env var during deployment (e.g., v1.0.0)
  container_name: api-blue
  # => Fixed name for nginx upstream reference
  environment:
  # => API runtime environment
  NODE_ENV: production
  # => Production mode
  COLOR: blue
  # => Identifies deployment color
  labels:
  # => Container labels for deployment tracking
  deployment: blue
  # => Label for filtering/querying this deployment
  networks:
    # => Network membership
    - app-network
  # => Joins shared external network
  restart: unless-stopped
  # => Restarts on crash, not on manual stop
  # => Does not restart when manually stopped with docker stop

networks:
  # => External network declarations
  app-network:
  # => Reference to pre-created network
  external: true
  # => Pre-created network shared across deployments
```

```yaml
# File: docker-compose.green.yml

version: "3.8"
# => Green deployment compose file

services:
  api-green:
  # => Green deployment of API service
  image: my-api:${VERSION:-latest}
  # => Same image tag variable as blue
  container_name: api-green
  # => Fixed name for nginx upstream reference
  environment:
  # => API runtime environment
  NODE_ENV: production
  # => Production mode
  COLOR: green
  # => Distinguishes this from blue in logs and metrics
  labels:
  # => Container labels for green deployment
  deployment: green
  # => Label for filtering/querying green deployment
  networks:
    # => Network membership
    - app-network
  # => Same network as blue deployment
  restart: unless-stopped
  # => Restarts on crash, not on manual stop

networks:
  # => External network declarations
  app-network:
  # => Reference to shared app network
  external: true
  # => Uses pre-created external network
```

```yaml
# File: docker-compose.router.yml (nginx router)

version: "3.8"
# => Nginx router compose file

services:
  router:
  # => Nginx reverse proxy router service
  image: nginx:alpine
  # => Minimal Nginx Alpine image
  container_name: router
  # => Fixed name for docker exec commands in deployment scripts
  ports:
    # => Public-facing port
    - "80:80"
  # => Public-facing port (all traffic enters here)
  volumes:
    # => Nginx configuration mount
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
  # => Dynamic upstream configuration (reload without restart)
  networks:
    # => Router joins app network
    - app-network
  # => Router can reach both blue and green
  restart: unless-stopped
  # => Restarts on failure

networks:
  # => External network declarations
  app-network:
  # => Reference to shared network
  external: true
  # => Pre-created external network
```

```nginx
# File: nginx.conf (initial config - points to blue)

events {
# => Nginx events configuration block
 worker_connections 1024;
# => Maximum concurrent connections per worker process
}

http {
# => HTTP server configuration
 upstream backend {
# => Upstream backend group
 server api-blue:3000;
# => Traffic goes to blue deployment initially
# => Docker DNS resolves api-blue to container IP
 }

 server {
# => Virtual server configuration
 listen 80;
# => Listen on port 80 for incoming HTTP traffic

 location / {
# => Match all request paths
 proxy_pass http://backend;
# => Forward requests to upstream backend group
 proxy_set_header Host $host;
# => Pass original Host header to backend
 proxy_set_header X-Real-IP $remote_addr;
# => Pass client IP to backend
 }

 location /health {
# => Health check endpoint
 proxy_pass http://backend/health;
# => Forward health checks to backend
 access_log off;
# => Disable logging for health checks (reduces noise)
 }
 }
}
```

```bash
# Create external network
docker network create app-network
# => Creates shared network for blue and green deployments

# Initial deployment (blue environment)
export VERSION=v1.0.0
# => Set version for blue deployment
docker compose -f docker-compose.blue.yml up -d
# => Blue deployment running

# Start router (points to blue)
docker compose -f docker-compose.router.yml up -d
# => Nginx router starts, forwards traffic to api-blue

# Verify blue is serving traffic
curl http://localhost/
# => Response from api-blue v1.0.0

# Deploy new version to green (zero downtime)
export VERSION=v2.0.0
# => Set version for green deployment
docker compose -f docker-compose.green.yml up -d
# => Green deployment running with v2.0.0
# => Blue still serving traffic (no disruption)

# Test green deployment directly
docker exec router curl -s http://api-green:3000/health
# => Tests green via router container using Docker DNS
# => {"status":"healthy","version":"v2.0.0"}
# => Verify green is working before switching

# Smoke test green deployment
docker run --rm --network app-network curlimages/curl \
# => Temporary container on app-network
 curl -s http://api-green:3000/health | jq .
# => Run comprehensive tests against green

# Switch traffic to green (instant cutover)
cat > nginx.conf << 'EOF'
events {
 worker_connections 1024;
}

http {
 upstream backend {
 server api-green:3000;
 # => Traffic now goes to green
 }

 server {
 listen 80;

 location / {
 proxy_pass http://backend;
 proxy_set_header Host $host;
 proxy_set_header X-Real-IP $remote_addr;
 }
 }
}
EOF
# => nginx.conf heredoc: events block, http block, upstream block
# => server block listens on port 80 and proxies to backend
# => Updated nginx config points upstream to api-green

# Reload nginx configuration (zero downtime)
docker exec router nginx -s reload
# => Instant traffic switch to green
# => No connection drops - nginx completes in-flight requests

# Verify green is serving traffic
curl http://localhost/
# => Response from api-green v2.0.0

# Monitor green deployment
docker logs -f api-green
# => Check for errors after traffic switch

# Rollback to blue if issues detected
cat > nginx.conf << 'EOF'
events {
 worker_connections 1024;
}

http {
 upstream backend {
 server api-blue:3000;
 # => Rollback: traffic back to blue
 }

 server {
 listen 80;
 location / {
 proxy_pass http://backend;
 proxy_set_header Host $host;
 }
 }
}
EOF
# => Rollback nginx.conf: events block, http block, upstream with api-blue
# => server block proxies requests to blue deployment
# => Rollback nginx config points back to api-blue

docker exec router nginx -s reload
# => Instant rollback to blue

# After green is stable, shut down blue
docker compose -f docker-compose.blue.yml down
# => Blue environment torn down after successful green deployment

# For next deployment, flip colors
# Deploy v3.0.0 to blue (green is now production)
export VERSION=v3.0.0
# => Set next version for blue
docker compose -f docker-compose.blue.yml up -d
# => Blue gets new version while green serves traffic

# Test, then switch traffic back to blue
# Repeat cycle..

# Automated blue-green deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
# => Automated blue-green deployment script
set -e
# => Exit on any error

VERSION=$1
# => First argument is the version to deploy
ACTIVE_COLOR=$(docker exec router cat /etc/nginx/nginx.conf | grep "server api-" | awk '{print $2}' | cut -d'-' -f2 | cut -d':' -f1)
# => Detect which color is currently active from nginx config
NEW_COLOR=$([ "$ACTIVE_COLOR" = "blue" ] && echo "green" || echo "blue")
# => Toggle color: blue→green or green→blue

echo "Current active: $ACTIVE_COLOR"
# => Report current active deployment
echo "Deploying v$VERSION to $NEW_COLOR.."
# => Report deployment target

# Deploy new version to inactive color
VERSION=$VERSION docker compose -f docker-compose.$NEW_COLOR.yml up -d
# => Start inactive color with new version

# Wait for health check
echo "Waiting for $NEW_COLOR to be healthy.."
# => Poll until new deployment is ready
until docker exec router curl -sf http://api-$NEW_COLOR:3000/health > /dev/null; do
# => curl -sf: silent and fail on HTTP errors
 sleep 2
# => Wait 2 seconds between health checks
done

echo "$NEW_COLOR is healthy!"
# => New deployment passed health check

# Update nginx config
sed -i "s/api-$ACTIVE_COLOR/api-$NEW_COLOR/" nginx.conf
# => Replace old color with new color in nginx config

# Reload nginx
docker exec router nginx -s reload
# => Apply config change with zero downtime

echo "Traffic switched to $NEW_COLOR (v$VERSION)"
# => Report successful traffic switch
echo "Old deployment ($ACTIVE_COLOR) still running for rollback"
# => Old deployment remains available for instant rollback
EOF
# => deploy.sh: bash script with VERSION arg, ACTIVE_COLOR detection
# => NEW_COLOR toggles between blue and green
# => Deploys, waits for health, updates nginx, reloads

chmod +x deploy.sh
# => Make deploy script executable

# Deploy new version
./deploy.sh 2.0.0
# => Automated blue-green deployment

# Advanced: Weighted traffic split (canary deployment)
cat > nginx-canary.conf << 'EOF'
events {
 worker_connections 1024;
}

http {
 upstream backend {
 server api-blue:3000 weight=90;
 # => 90% of traffic to blue (stable)
 server api-green:3000 weight=10;
 # => 90% traffic to blue, 10% to green (canary)
 }

 server {
 listen 80;
 location / {
 proxy_pass http://backend;
 }
 }
}
EOF
# => nginx-canary.conf: events block, http block with weighted upstream
# => Two servers in upstream: blue (90%) and green (10%)
# => server block proxies to weighted upstream group
# => Canary config: 90/10 traffic split

docker exec router sh -c "cat > /etc/nginx/nginx.conf <<'EOF'
$(cat nginx-canary.conf)
EOF"
# => Update router with canary configuration

docker exec router nginx -s reload
# => Gradual traffic shift (canary deployment)

# Increase green traffic if no errors
# 90/10 → 50/50 → 0/100
# => Blue-green deployment command reference:
# => docker network create app-network - Create shared network
# => export VERSION=v1.0.0 - Set deployment version variable
# => docker compose -f docker-compose.blue.yml up -d - Start blue deployment
# => docker compose -f docker-compose.router.yml up -d - Start nginx router
# => docker exec router curl -s http://api-green:3000/health - Test green via router
# => docker exec router nginx -s reload - Reload nginx config atomically
# => docker compose -f docker-compose.blue.yml down - Tear down blue environment
# => docker run --rm --network app-network - Temporary container on app-network
# => cat > nginx.conf << 'EOF' - Create nginx configuration heredoc
# => chmod +x deploy.sh - Make deployment script executable
# => ./deploy.sh 2.0.0 - Execute automated deployment
# => cat > nginx-canary.conf << 'EOF' - Create canary nginx config heredoc
# => docker exec router sh -c "cat > /etc/nginx/nginx.conf ..." - Update router config
# => Nginx config structure: events{} http{upstream backend{} server{}}
# => upstream backend - Load balancer group with one or more backend servers
# => server api-blue:3000 - Backend server using Docker DNS resolution
# => weight=90 - 90% of requests to this server (weighted load balancing)
# => proxy_pass http://backend - Forward requests to upstream group
# => proxy_set_header Host $host - Pass original Host header
# => proxy_set_header X-Real-IP $remote_addr - Pass client IP
# => nginx -s reload - Send reload signal: zero-downtime config reload
# => worker_connections 1024 - Maximum simultaneous connections
# => #!/bin/bash - Shell script header
# => grep "server api-" | awk '{print $2}' | cut -d'-' -f2 - Extract color from nginx config
# => [ "$ACTIVE_COLOR" = "blue" ] && echo "green" || echo "blue" - Toggle color
# => docker exec router curl -sf http://api-$NEW_COLOR:3000/health - Health check polling
# => sed -i "s/api-$ACTIVE_COLOR/api-$NEW_COLOR/" nginx.conf - Update nginx config in-place
# => Blue-green deployment process summary:
# => 1. Create shared Docker network (once)
# => 2. Deploy blue with VERSION=v1.0.0
# => 3. Start nginx router pointing to blue
# => 4. Deploy green with VERSION=v2.0.0 (blue still active)
# => 5. Test green deployment via docker exec
# => 6. Update nginx.conf to point to green
# => 7. Reload nginx with nginx -s reload
# => 8. Monitor for errors after cutover
# => 9. Tear down blue after green is stable
# => 10. Next deploy: repeat with colors flipped
# => Rollback procedure: update nginx.conf to old color, reload
# => Canary testing: weight=90/10 split before full cutover
# => deploy.sh automates detection, deployment, health check, cutover
```

**Key Takeaway**: Blue-green deployment provides zero-downtime releases with instant rollback capability. Maintain two identical environments and switch traffic via proxy (nginx). Test green deployment before traffic switch. Keep blue environment running briefly for instant rollback. Use weighted upstream for canary testing. Automate deployment scripts for consistency.

**Why It Matters**: Blue-green deployments eliminate downtime during releases - traditional deployments cause 5-15 minute outages during application restarts, but blue-green switches traffic in milliseconds. Instant rollback capability provides insurance against deployment failures - if green version has bugs, traffic switches back to blue in seconds instead of requiring emergency redeploy. This pattern enabled companies to increase deployment frequency from monthly to daily without risking availability, accelerating feature delivery while maintaining 99.99% uptime SLAs.

---

### Example 54: Canary Deployment Pattern

Canary deployment gradually shifts traffic to new version, enabling early detection of issues before full rollout.

```yaml
# File: docker-compose.yml

version: "3.8"
# => Compose file format version

services:
 # Stable version (v1.0.0)
 api-stable:
 # => Stable API deployment (production version)
 image: my-api:v1.0.0
 # => Current production version
 deploy:
 # => Deployment configuration
 replicas: 9
 # => 9 stable instances = 90% of traffic (round-robin)
 labels:
 # => Container labels for monitoring
 version: stable
 # => Label for Prometheus metric filtering
 environment:
 # => Stable version environment settings
 VERSION: v1.0.0
 # => Version exposed in health check and metrics
 networks:
 # => Network membership
 - app-network
 # => Joins app-network for load balancer communication

 # Canary version (v2.0.0)
 api-canary:
 # => Canary API deployment (new version)
 image: my-api:v2.0.0
 # => New version under test
 deploy:
 # => Canary deployment configuration
 replicas: 1
 # => 1 canary instance (10% traffic)
 labels:
 # => Canary-specific labels
 version: canary
 # => Distinct label for monitoring canary separately
 environment:
 # => Canary version environment settings
 VERSION: v2.0.0
 # => New version identifier
 networks:
 # => Network membership
 - app-network
 # => Same network as stable for load balancer routing

 # Load balancer (nginx or traefik)
 load-balancer:
 # => Nginx load balancer service
 image: nginx:alpine
 # => Minimal Nginx Alpine image
 ports:
 # => Public-facing port
 - "80:80"
 # => Public entry point for all traffic
 volumes:
 # => Nginx configuration
 - ./nginx.conf:/etc/nginx/nginx.conf:ro
 # => Round-robin config distributes across stable + canary
 networks:
 # => Network membership
 - app-network
 # => Router on same network as APIs
 depends_on:
 # => Load balancer waits for API services
 - api-stable
 # => Stable API must be running
 - api-canary
 # => Both API versions must start before load balancer
 # => Ensures load balancer can reach both upstream servers

networks:
 app-network:
 # => Internal network for service communication
```

```nginx
# File: nginx.conf (round-robin load balancing)

events {
# => Nginx events configuration
 worker_connections 1024;
# => Maximum concurrent connections per worker
}

http {
# => HTTP server configuration
 upstream backend {
# => Load balancer upstream group (9 stable + 1 canary)
 # 9 stable instances
 server api-stable:3000 max_fails=3 fail_timeout=30s;
# => max_fails=3: mark stable unhealthy after 3 failures
# => fail_timeout=30s: check again after 30 seconds

 # 1 canary instance (10% traffic)
 server api-canary:3000 max_fails=1 fail_timeout=10s;
 # => Lower max_fails for canary (fail fast)
# => fail_timeout=10s: canary recovers faster for quicker rollback signal
 # => nginx distributes requests round-robin across all servers
 }

 server {
# => Virtual server configuration
 listen 80;
# => Listen on HTTP port 80

 location / {
# => Main request routing block
 proxy_pass http://backend;
# => Forward requests to upstream backend pool
 proxy_set_header Host $host;
# => Preserve original Host header
 proxy_set_header X-Real-IP $remote_addr;
# => Pass client IP to backend
 proxy_set_header X-Version $upstream_addr;
 # => Track which version served request
 }

 location /health {
# => Load balancer health check endpoint
 access_log off;
# => Suppress health check access logs
 return 200 "OK\n";
# => Return 200 OK for health checks
 # => 200 response confirms router is up
 }
 }
}
```

```bash
# Deploy canary (10% traffic)
docker compose up -d --scale api-stable=9 --scale api-canary=1
# => --scale api-stable=9: start 9 stable replicas (90% traffic)
# => --scale api-canary=1: start 1 canary replica (10% traffic)
# => 10% traffic to canary, 90% to stable

# Monitor canary error rate
docker logs -f api-canary 2>&1 | grep -i error
# => Follow canary logs, filter for errors
# => Watch for errors in canary

# Simulate traffic
for i in {1.100}; do
# => Loop 100 times to generate test traffic
 curl -s http://localhost/ -w "\n"
# => -s: silent mode, -w "\n": add newline after response
 sleep 0.1
# => 100ms between requests
done
# => ~10 requests hit canary, ~90 hit stable

# Check error rates
STABLE_ERRORS=$(docker logs api-stable 2>&1 | grep -c ERROR)
# => Count ERROR occurrences in stable logs
CANARY_ERRORS=$(docker logs api-canary 2>&1 | grep -c ERROR)
# => Count ERROR occurrences in canary logs

echo "Stable errors: $STABLE_ERRORS"
# => Display stable error count
echo "Canary errors: $CANARY_ERRORS"
# => Display canary error count

# Increase canary traffic if healthy (10% → 25%)
docker compose up -d --scale api-stable=6 --scale api-canary=2
# => 6:2 ratio = 25% canary traffic

# Continue gradual rollout
# 25% → 50%
docker compose up -d --scale api-stable=4 --scale api-canary=4
# => 4:4 ratio = 50% canary traffic

# 50% → 75%
docker compose up -d --scale api-stable=2 --scale api-canary=6
# => 2:6 ratio = 75% canary traffic

# 75% → 100%
docker compose up -d --scale api-stable=0 --scale api-canary=8
# => 0:8 ratio = 100% canary traffic
# => Full cutover to canary

# After verification, promote canary to stable
docker compose up -d --scale api-stable=8 --scale api-canary=0
# => Update image tag: v2.0.0 → stable
# => Canary image becomes new stable

# Rollback if canary shows errors
docker compose up -d --scale api-stable=10 --scale api-canary=0
# => 10:0 ratio = 100% stable traffic
# => Immediate rollback to stable

# Automated canary analysis
cat > canary-analysis.sh << 'EOF'
#!/bin/bash
# => Canary analysis script

CANARY_ERROR_THRESHOLD=5
# => Maximum acceptable canary error count
STABLE_ERROR_RATE=$(docker logs api-stable 2>&1 | grep -c ERROR)
# => Count errors in stable deployment
CANARY_ERROR_RATE=$(docker logs api-canary 2>&1 | grep -c ERROR)
# => Count errors in canary deployment

echo "Stable error rate: $STABLE_ERROR_RATE"
# => Report stable error count
echo "Canary error rate: $CANARY_ERROR_RATE"
# => Report canary error count

if [ $CANARY_ERROR_RATE -gt $CANARY_ERROR_THRESHOLD ]; then
# => Compare canary errors against threshold
 echo "ALERT: Canary error rate exceeded threshold!"
# => Alert when threshold exceeded
 echo "Rolling back.."
# => Start rollback procedure
 docker compose up -d --scale api-stable=10 --scale api-canary=0
# => Scale up stable, scale down canary
 exit 1
# => Exit with error code to signal failure
else
 echo "Canary is healthy, continuing rollout.."
# => Canary passed health check
fi
EOF
# => canary-analysis.sh: compare stable vs canary error rates, rollback if needed

chmod +x canary-analysis.sh
# => Make analysis script executable

# Progressive canary deployment script
cat > progressive-canary.sh << 'EOF'
#!/bin/bash
# => Progressive deployment with automated health checks
set -e
# => Exit on any error

STABLE_VERSION=v1.0.0
# => Current stable version
CANARY_VERSION=v2.0.0
# => Version to gradually roll out

# Stage 1: 10% canary
echo "Stage 1: Deploying 10% canary.."
# => Report stage 1 start
docker compose up -d --scale api-stable=9 --scale api-canary=1
# => Start with 10% canary traffic
sleep 300 # Monitor for 5 minutes
# => Wait 5 minutes for error detection
./canary-analysis.sh || exit 1
# => Analyze and rollback if errors found

# Stage 2: 25% canary
echo "Stage 2: Increasing to 25% canary.."
# => Progress to 25% canary
docker compose up -d --scale api-stable=6 --scale api-canary=2
# => 6:2 = 25% canary ratio
sleep 300
# => Another 5-minute monitoring window
./canary-analysis.sh || exit 1
# => Check health before continuing

# Stage 3: 50% canary
echo "Stage 3: Increasing to 50% canary.."
# => Progress to 50% canary
docker compose up -d --scale api-stable=4 --scale api-canary=4
# => 4:4 = 50% canary ratio
sleep 600 # Longer monitoring at 50%
# => 10 minutes monitoring at the critical 50% mark
./canary-analysis.sh || exit 1
# => Final health check before full rollout

# Stage 4: 100% canary
echo "Stage 4: Full rollout.."
# => Final stage: complete cutover
docker compose up -d --scale api-stable=0 --scale api-canary=10
# => 0:10 = 100% canary traffic
echo "Canary deployment complete!"
# => Report successful deployment
EOF
# => progressive-canary.sh: 4-stage deployment with 5-10 min monitoring each stage

chmod +x progressive-canary.sh
# => Make progressive deployment script executable

# Execute progressive deployment
./progressive-canary.sh
# => Automated gradual rollout with health checks

# Advanced: Metrics-based canary analysis
cat > metrics-canary.sh << 'EOF'
#!/bin/bash
# => Query Prometheus for real-time error rate metrics

# Query Prometheus for error rates
STABLE_ERRORS=$(curl -s 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{version="stable",status=~"5."}[5m])' | jq -r '.data.result[0].value[1]')
# => Prometheus rate query: 5-minute error rate for stable

CANARY_ERRORS=$(curl -s 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{version="canary",status=~"5."}[5m])' | jq -r '.data.result[0].value[1]')
# => Prometheus rate query: 5-minute error rate for canary

# Compare error rates
if [ $(echo "$CANARY_ERRORS > $STABLE_ERRORS * 1.5" | bc) -eq 1 ]; then
# => Canary error rate 50% above stable triggers rollback
 echo "ALERT: Canary error rate 50% higher than stable!"
# => Alert on degraded performance
 echo "Automatic rollback initiated.."
# => Start automatic rollback
 docker compose up -d --scale api-stable=10 --scale api-canary=0
# => Immediately restore 100% stable traffic
else
 echo "Canary metrics within acceptable range"
# => Canary performance is acceptable
fi
EOF
# => metrics-canary.sh: Prometheus-based automated canary analysis

# Feature flag-based canary
# (Route specific users to canary based on headers)
cat > nginx-feature-flag.conf << 'EOF'
events {
 worker_connections 1024;
}

http {
 map $http_x_canary_user $backend_pool {
 "true" api-canary:3000;
 default api-stable:3000;
 }

 server {
 listen 80;

 location / {
 proxy_pass http://$backend_pool;
 # => Route based on X-Canary-User header
 }
 }
}
EOF
# => nginx-feature-flag.conf: routes X-Canary-User: true to canary
# => map directive: maps header value to upstream variable

# Test feature flag routing
curl -H "X-Canary-User: true" http://localhost/
# => Routed to canary version with header
# => X-Canary-User header controls routing decision

curl http://localhost/
# => Routed to stable version (no header)
# => nginx reload propagates instantly without TCP connection drops
# => Zero-downtime deployment achieved with nginx upstream switching
# => Canary deployment scaling reference:
# => docker compose up -d --scale api-stable=N --scale api-canary=M
# => Total instances: N+M (round-robin across all)
# => Canary %: M/(N+M)*100
# => 9:1 = 10%, 6:2 = 25%, 4:4 = 50%, 2:6 = 75%, 0:8 = 100%
# => Rollback: scale api-stable to 10, api-canary to 0
# => canary-analysis.sh checks error count against threshold
# => progressive-canary.sh: automated 4-stage deployment with sleep intervals
# => metrics-canary.sh: Prometheus PromQL queries for real-time error rates
# => Feature flags via nginx map directive: header-based routing
# => map $http_x_canary_user $backend_pool: maps header to upstream variable
# => canary-weight label controls percentage of traffic routed to canary service
# => nginx upstream least_conn: sends requests to server with fewest active connections
```

**Key Takeaway**: Canary deployment gradually shifts traffic to new version (10% → 25% → 50% → 100%), enabling early issue detection. Monitor error rates at each stage. Automated rollback if canary metrics degrade. Use replica scaling to control traffic split. Combine with metrics-based analysis (Prometheus) for data-driven decisions. Feature flags enable targeted canary testing for specific users.

**Why It Matters**: Canary deployments reduce blast radius of buggy releases - instead of impacting 100% of users instantly, problems affect only 10% during initial rollout, limiting customer impact. Metrics-based automated rollback prevents human reaction delay - when canary error rates spike, systems roll back in seconds instead of waiting for manual detection and intervention. This pattern enabled companies to deploy multiple times daily with confidence - even if 1 in 10 deployments has issues, only 10% of traffic sees problems before automatic rollback, maintaining overall system stability.

---

## Summary: Intermediate Examples 28-54

This chapter covered 27 intermediate examples achieving 40-75% Docker coverage:

**Advanced Networking** (41-42):

- Custom bridge networks with DNS resolution
- Network troubleshooting tools and techniques

**Compose Patterns** (43-45):

- Init containers for setup tasks
- Shared volumes for data exchange
- External networks for cross-project communication

**Security** (46-47):

- Running as non-root users
- Environment variable management and secrets

**Development Workflow** (48-52):

- Compose profiles for conditional services
- Resource monitoring and alerts
- System cleanup and maintenance
- Docker events tracking
- Compose watch for live reloading

**Deployment Strategies** (53-54):

- Blue-green deployment for zero downtime
- Canary deployment for gradual rollouts

**Key production patterns mastered**:

- Network isolation and service discovery
- Security hardening through least privilege
- Development-production parity
- Zero-downtime deployment strategies
- Resource management and monitoring

**Next steps**: Continue to [Advanced](/en/learn/software-engineering/infrastructure/tools/docker/by-example/advanced) for Docker Swarm orchestration, security hardening, CI/CD integration, registry operations, and production deployment patterns (75-95% coverage).

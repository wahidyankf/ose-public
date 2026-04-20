---
title: Go Build Configuration
description: Authoritative build and deployment standards for Go projects in the OSE Platform
category: explanation
subcategory: prog-lang
tags:
  - golang
  - build
  - deployment
  - go-mod
  - makefile
  - ci-cd
  - docker
  - cross-compilation
  - go-1.18
  - go-1.21
  - go-1.22
  - go-1.23
  - go-1.24
  - go-1.25
  - go-1.26
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-04
updated: 2026-03-06
---

# Go Build Configuration

## 📋 Quick Reference

**Core Topics**:

- [Prerequisite Knowledge](#prerequisite-knowledge)
- [Purpose](#-purpose)
- [go.mod File Standards](#-gomod-file-standards)
- [Makefile Patterns](#-makefile-patterns)
- [Build Flags and Options](#-build-flags-and-options)
- [Cross-Compilation](#-cross-compilation)
- [Binary Optimization](#-binary-optimization)
- [CI/CD Pipeline Patterns](#-cicd-pipeline-patterns)
- [Docker Multi-Stage Builds](#-docker-multi-stage-builds)
- [Release Automation](#-release-automation)
- [Build Tags](#-build-tags)
- [Version Information](#-version-information)
- [Best Practices Checklist](#-best-practices-checklist)
- [Related Documentation](#related-documentation)

**Understanding-oriented guide** to build configuration standards for Go projects in the open-sharia-enterprise platform.

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Go fundamentals from [AyoKoding Go Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/golang/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Go tutorial.

**What you need to know before reading**:

- Basic Go project structure
- Go modules basics
- Command-line tools fundamentals
- Basic Docker knowledge

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## 🎯 Purpose

This document defines **authoritative build and configuration standards** for Go development in the OSE Platform. These rules ensure consistent, reproducible builds across all environments and developers.

**Target Audience**: OSE Platform Go developers configuring builds, CI/CD pipelines, and deployments.

**Scope**: go.mod management, Makefile patterns, compilation flags, cross-compilation, Docker builds, CI/CD configuration, release automation.

**Principles Applied**:

- **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)** - Automated builds and testing
- **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)** - Explicit configuration, no magic
- **[Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)** - Same input = same output

## 📦 go.mod File Standards

### Required go.mod Structure

**MUST** follow this structure for all Go projects:

```go
// go.mod - Exact versioning for reproducibility

// Module path - MUST match repository structure
module github.com/open-sharia-enterprise/[project-name]

// Go version - MUST specify exact version (major.minor.patch)
go 1.26.0

// Direct dependencies - MUST specify exact versions
require (
 github.com/google/uuid v1.6.0
 github.com/shopspring/decimal v1.4.0
 github.com/stretchr/testify v1.9.0
)

// Indirect dependencies - auto-managed
require (
 github.com/davecgh/go-spew v1.1.1 // indirect
 github.com/pmezard/go-difflib v1.0.0 // indirect
 gopkg.in/yaml.v3 v3.0.1 // indirect
)

// Replacements - ONLY for local development
// MUST NOT commit uncommented replace directives for published modules
// replace github.com/open-sharia-enterprise/lib => ../lib

// Retractions - MUST document why versions are retracted
// retract v1.2.3 // Contains critical security vulnerability CVE-2025-1234
```

### Version Specification Rules

**MUST** follow semantic versioning:

- ✅ **CORRECT**: `v1.6.0` (exact version)
- ✅ **CORRECT**: `v0.9.1` (pre-1.0 exact version)
- ❌ **WRONG**: `v1.6` (missing patch version)
- ❌ **WRONG**: `latest` (not a valid version)
- ❌ **WRONG**: `v1.6.x` (wildcard not supported)

### go.mod Management Commands

```bash
# Initialize new module
go mod init github.com/open-sharia-enterprise/[project-name]

# Add dependency (automatic version selection)
go get github.com/google/uuid

# Add specific version
go get github.com/google/uuid@v1.6.0

# Update all dependencies to latest minor/patch
go get -u ./...

# Update to specific version
go get github.com/google/uuid@v1.6.1

# Remove unused dependencies
go mod tidy

# Verify checksums match go.sum
go mod verify

# Download dependencies to local cache
go mod download

# Vendor dependencies (optional, for hermetic builds)
go mod vendor

# Check why dependency is needed
go mod why github.com/google/uuid

# Visualize dependency graph
go mod graph
```

### go.sum Verification

**CRITICAL**: `go.sum` MUST be committed to version control.

```bash
# Verify checksums match go.sum
go mod verify

# Regenerate go.sum (ONLY if go.mod changed)
go mod tidy

# Ensure no changes after tidy (CI check)
go mod tidy
git diff --exit-code go.mod go.sum
```

**go.sum Format**:

```
github.com/google/uuid v1.6.0 h1:NIvaJDMOsjHA8n1jAhLSgzrAzy1Hgr+hNrb57e+94F0=
github.com/google/uuid v1.6.0/go.mod h1:TIyPZe4MgqvfeYDBFedMoGGpEw/LqOeaOT+nhxU+yHo=
```

- First line: cryptographic hash of module source code
- Second line: cryptographic hash of go.mod file

### Private Modules Configuration

```bash
# Configure private module prefix (one-time setup)
go env -w GOPRIVATE=github.com/open-sharia-enterprise/*

# Configure Git authentication for private repos
git config --global url."git@github.com:".insteadOf "https://github.com/"

# Disable proxy for private modules
go env -w GONOPROXY=github.com/open-sharia-enterprise/*

# Disable checksum database for private modules
go env -w GONOSUMDB=github.com/open-sharia-enterprise/*
```

## 🛠️ Makefile Patterns

### Standard Makefile Template

**MUST** use this Makefile structure for all Go projects:

```makefile
# Makefile - Standard build automation for Go projects

.PHONY: help build test lint clean install-tools verify docker-build ci

# Default target - show help
help:
 @echo "Available targets:"
 @echo "  build         - Build the application binary"
 @echo "  test          - Run all tests with coverage"
 @echo "  lint          - Run linters (golangci-lint)"
 @echo "  clean         - Remove build artifacts"
 @echo "  install-tools - Install development tools"
 @echo "  verify        - Verify go.mod and go.sum"
 @echo "  docker-build  - Build Docker image"
 @echo "  ci            - Run all CI checks"

# Build configuration
BINARY_NAME=app
VERSION?=$(shell git describe --tags --always --dirty)
BUILD_TIME=$(shell date -u '+%Y-%m-%d_%H:%M:%S')
GIT_COMMIT=$(shell git rev-parse HEAD)
LDFLAGS=-ldflags "-s -w -X main.Version=$(VERSION) -X main.GitCommit=$(GIT_COMMIT) -X main.BuildTime=$(BUILD_TIME)"

# Build the application
build:
 @echo "Building $(BINARY_NAME) version $(VERSION)..."
 go build $(LDFLAGS) -o bin/$(BINARY_NAME) ./cmd/server

# Run tests with coverage
test:
 @echo "Running tests with coverage..."
 go test -v -race -coverprofile=coverage.out ./...
 go tool cover -func=coverage.out
 @echo "Coverage report saved to coverage.out"

# Run linters
lint:
 @echo "Running linters..."
 golangci-lint run ./...
 go fmt ./...
 go vet ./...

# Clean build artifacts
clean:
 @echo "Cleaning build artifacts..."
 rm -rf bin/
 rm -f coverage.out

# Install development tools
install-tools:
 @echo "Installing development tools..."
 go install github.com/golangci/golangci-lint/cmd/golangci-lint@v2.8.0

# Verify go.mod and go.sum
verify:
 @echo "Verifying go.mod and go.sum..."
 go mod verify
 go mod tidy
 git diff --exit-code go.mod go.sum

# Build Docker image
docker-build:
 @echo "Building Docker image..."
 docker build -t $(BINARY_NAME):$(VERSION) .
 docker tag $(BINARY_NAME):$(VERSION) $(BINARY_NAME):latest

# CI target - run all checks
ci: verify lint test build
 @echo "All CI checks passed!"
```

### Makefile Best Practices

**1. Always use .PHONY targets**:

```makefile
.PHONY: build test
```

**2. Use variables for configuration**:

```makefile
BINARY_NAME=app
VERSION?=$(shell git describe --tags --always --dirty)
```

**3. Provide helpful error messages**:

```makefile
lint:
 @echo "Running linters..."
 @golangci-lint run ./... || (echo "Linting failed! Run 'make lint' to see errors."; exit 1)
```

**4. Support parallel execution**:

```makefile
test-unit:
 go test -v ./internal/...

test-integration:
 go test -v ./test/integration/...

# Parallel execution
test: test-unit test-integration
```

## 🚀 Build Flags and Options

### Standard Build Flags

```bash
# Basic build
go build -o bin/app ./cmd/server

# Build with version information
go build -ldflags "-X main.Version=1.0.0" -o bin/app ./cmd/server

# Build optimized binary (strip debug info)
go build -ldflags "-s -w" -o bin/app ./cmd/server

# Build for release (optimized + version info)
go build -ldflags "-s -w -X main.Version=1.0.0 -X main.GitCommit=$(git rev-parse HEAD)" \
  -o bin/app ./cmd/server
```

### Common Build Flags

| Flag         | Purpose                       | When to Use                          |
| ------------ | ----------------------------- | ------------------------------------ |
| `-o <path>`  | Output binary path            | Always (explicit output)             |
| `-ldflags`   | Linker flags                  | Version injection, size optimization |
| `-s`         | Strip debug symbols           | Production builds                    |
| `-w`         | Strip DWARF debug info        | Production builds                    |
| `-race`      | Enable race detector          | Testing only (slower)                |
| `-cover`     | Enable coverage               | Testing only                         |
| `-tags`      | Build tags                    | Conditional compilation              |
| `-trimpath`  | Remove file system paths      | Reproducible builds                  |
| `-buildmode` | Build mode (exe, pie, plugin) | Special cases                        |

### Linker Flags (-ldflags)

```bash
# Strip symbols (reduce binary size)
-ldflags "-s -w"

# Inject version information
-ldflags "-X main.Version=1.0.0 -X main.GitCommit=abc123"

# Multiple flags combined
-ldflags "-s -w -X main.Version=1.0.0 -X main.GitCommit=$(git rev-parse HEAD)"
```

**Size comparison**:

```bash
# Normal build
go build -o app ./cmd/server
# Size: ~15MB

# Optimized build
go build -ldflags "-s -w" -o app ./cmd/server
# Size: ~10MB (33% reduction)
```

### CGO Configuration

```bash
# Disable CGO (static linking, recommended)
CGO_ENABLED=0 go build -o bin/app ./cmd/server

# Enable CGO (dynamic linking, use only if needed)
CGO_ENABLED=1 go build -o bin/app ./cmd/server
```

**When to disable CGO** (recommended default):

- ✅ Pure Go code
- ✅ Docker Alpine images
- ✅ Cross-compilation
- ✅ Static binaries

**When to enable CGO** (only if necessary):

- ❌ SQLite with C bindings
- ❌ System-specific libraries
- ❌ Performance-critical C code

## 🌍 Cross-Compilation

### Supported Platforms

```bash
# Build for Linux (amd64)
GOOS=linux GOARCH=amd64 go build -o bin/app-linux-amd64 ./cmd/server

# Build for macOS (amd64)
GOOS=darwin GOARCH=amd64 go build -o bin/app-darwin-amd64 ./cmd/server

# Build for macOS (arm64, Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o bin/app-darwin-arm64 ./cmd/server

# Build for Windows (amd64)
GOOS=windows GOARCH=amd64 go build -o bin/app-windows-amd64.exe ./cmd/server

# Build for Linux (arm64, ARM servers)
GOOS=linux GOARCH=arm64 go build -o bin/app-linux-arm64 ./cmd/server
```

### Makefile Cross-Compilation Target

```makefile
.PHONY: build-all

# Build for all platforms
build-all: build-linux-amd64 build-darwin-amd64 build-darwin-arm64 build-windows-amd64

build-linux-amd64:
 @echo "Building for Linux amd64..."
 GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build $(LDFLAGS) \
  -o bin/$(BINARY_NAME)-linux-amd64 ./cmd/server

build-darwin-amd64:
 @echo "Building for macOS amd64..."
 GOOS=darwin GOARCH=amd64 CGO_ENABLED=0 go build $(LDFLAGS) \
  -o bin/$(BINARY_NAME)-darwin-amd64 ./cmd/server

build-darwin-arm64:
 @echo "Building for macOS arm64..."
 GOOS=darwin GOARCH=arm64 CGO_ENABLED=0 go build $(LDFLAGS) \
  -o bin/$(BINARY_NAME)-darwin-arm64 ./cmd/server

build-windows-amd64:
 @echo "Building for Windows amd64..."
 GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build $(LDFLAGS) \
  -o bin/$(BINARY_NAME)-windows-amd64.exe ./cmd/server
```

### Supported GOOS/GOARCH Combinations

**Common targets**:

| OS      | Architecture | Use Case                       |
| ------- | ------------ | ------------------------------ |
| linux   | amd64        | Linux servers (Intel/AMD)      |
| linux   | arm64        | ARM servers (Graviton, Ampere) |
| darwin  | amd64        | macOS Intel                    |
| darwin  | arm64        | macOS Apple Silicon (M1/M2/M3) |
| windows | amd64        | Windows desktops/servers       |
| freebsd | amd64        | FreeBSD servers                |

**Full list**:

```bash
# Show all supported platforms
go tool dist list
```

## ⚡ Binary Optimization

### Optimization Techniques

**1. Strip Debug Symbols** (-ldflags "-s -w"):

```bash
# Before: 15MB
go build -o bin/app ./cmd/server

# After: 10MB (33% reduction)
go build -ldflags "-s -w" -o bin/app ./cmd/server
```

**2. UPX Compression** (optional, aggressive):

```bash
# Install UPX (one-time)
# macOS: brew install upx
# Linux: apt-get install upx-ucl

# Compress binary (AFTER build)
go build -ldflags "-s -w" -o bin/app ./cmd/server
upx --brute bin/app

# Size reduction: 10MB → 3MB (70% reduction)
```

**⚠️ WARNING**: UPX can trigger false positives in antivirus software. Use only for internal tools.

**3. Build Mode** (static vs dynamic):

```bash
# Static binary (recommended for Docker)
CGO_ENABLED=0 go build -o bin/app ./cmd/server

# Dynamic binary (default)
CGO_ENABLED=1 go build -o bin/app ./cmd/server
```

### Comparison: Optimization Levels

| Method           | Size | Compatibility | Security  | Recommended         |
| ---------------- | ---- | ------------- | --------- | ------------------- |
| No optimization  | 15MB | ✅ High       | ✅ High   | Development only    |
| -ldflags "-s -w" | 10MB | ✅ High       | ✅ High   | ✅ Production       |
| UPX --brute      | 3MB  | ⚠️ Medium     | ⚠️ Medium | Internal tools only |

## 🐳 Docker Multi-Stage Builds

### Standard Dockerfile Template

**MUST** use multi-stage builds for all Go Docker images:

```dockerfile
# Dockerfile - Multi-stage build for Go applications

# Stage 1: Build
FROM golang:1.25.0-alpine AS builder

# Install build dependencies
RUN apk --no-cache add git make ca-certificates tzdata

WORKDIR /app

# Copy dependency files first (layer caching)
COPY go.mod go.sum ./
RUN go mod download
RUN go mod verify

# Copy source code
COPY . .

# Build binary with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
  -ldflags="-s -w -X main.Version=${VERSION:-dev} -X main.GitCommit=${GIT_COMMIT:-unknown}" \
  -o /app/bin/server \
  ./cmd/server

# Stage 2: Runtime
FROM alpine:3.19

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user
RUN addgroup -g 1000 app && \
  adduser -D -u 1000 -G app app

WORKDIR /app

# Copy binary from builder
COPY --from=builder --chown=app:app /app/bin/server /app/server

# Switch to non-root user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/app/server", "health"]

# Expose port
EXPOSE 8080

# Run application
CMD ["/app/server"]
```

### Multi-Stage Build Benefits

**Size comparison**:

```bash
# Single-stage (full Go image): ~800MB
FROM golang:1.25.0
# ... build and run in same image

# Multi-stage (Alpine): ~15MB
FROM golang:1.25.0-alpine AS builder
# ... build
FROM alpine:3.19
# ... copy binary only
```

### Docker Build Commands

```bash
# Basic build
docker build -t app:latest .

# Build with version
docker build --build-arg VERSION=1.0.0 -t app:1.0.0 .

# Build with Git commit
docker build --build-arg GIT_COMMIT=$(git rev-parse HEAD) -t app:latest .

# Build with all metadata
docker build \
  --build-arg VERSION=1.0.0 \
  --build-arg GIT_COMMIT=$(git rev-parse HEAD) \
  --build-arg BUILD_TIME=$(date -u '+%Y-%m-%d_%H:%M:%S') \
  -t app:1.0.0 \
  .

# Build and push
docker build -t myregistry/app:1.0.0 .
docker push myregistry/app:1.0.0
```

### Docker Compose for Local Development

```yaml
# docker-compose.yml
version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VERSION: dev
    ports:
      - "8080:8080"
    environment:
      - LOG_LEVEL=debug
      - DATABASE_URL=postgres://user:pass@db:5432/app
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

## 🔄 CI/CD Pipeline Patterns

### GitHub Actions - Recommended Template

**MUST** use this GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  GO_VERSION: "1.25.6"

jobs:
  # Job 1: Verify go.mod and go.sum
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}

      - name: Verify dependencies
        run: |
          go mod verify
          go mod tidy
          git diff --exit-code go.mod go.sum

  # Job 2: Lint
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}

      - name: golangci-lint
        uses: golangci/golangci-lint-action@v4
        with:
          version: v2.10.1
          args: --timeout=5m

  # Job 3: Test
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}

      - name: Run tests with coverage
        run: |
          go test -v -race -coverprofile=coverage.out ./...
          go tool cover -func=coverage.out

  # Job 4: Build
  build:
    runs-on: ubuntu-latest
    needs: [verify, lint, test]
    strategy:
      matrix:
        goos: [linux, darwin, windows]
        goarch: [amd64, arm64]
        exclude:
          - goos: windows
            goarch: arm64
    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}

      - name: Build binary
        run: |
          BINARY_NAME=app-${{ matrix.goos }}-${{ matrix.goarch }}
          if [ "${{ matrix.goos }}" = "windows" ]; then
            BINARY_NAME="${BINARY_NAME}.exe"
          fi
          GOOS=${{ matrix.goos }} GOARCH=${{ matrix.goarch }} CGO_ENABLED=0 \
            go build -ldflags="-s -w" -o bin/${BINARY_NAME} ./cmd/server

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-${{ matrix.goos }}-${{ matrix.goarch }}
          path: bin/*
```

### GitLab CI - Alternative Template

```yaml
# .gitlab-ci.yml
image: golang:1.25.6-alpine

stages:
  - verify
  - lint
  - test
  - build

variables:
  CGO_ENABLED: "0"

before_script:
  - apk add --no-cache git make

verify:
  stage: verify
  script:
    - go mod verify
    - go mod tidy
    - git diff --exit-code go.mod go.sum

lint:
  stage: lint
  image: golangci/golangci-lint:v2.10.1-alpine
  script:
    - golangci-lint run ./...

test:
  stage: test
  script:
    - go test -v -race -coverprofile=coverage.out ./...
    - go tool cover -func=coverage.out
  coverage: '/total:\s+\(statements\)\s+(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.out

build:
  stage: build
  parallel:
    matrix:
      - GOOS: [linux, darwin, windows]
        GOARCH: [amd64, arm64]
  script:
    - |
      BINARY_NAME=app-${GOOS}-${GOARCH}
      if [ "$GOOS" = "windows" ]; then
        BINARY_NAME="${BINARY_NAME}.exe"
      fi
      go build -ldflags="-s -w" -o bin/${BINARY_NAME} ./cmd/server
  artifacts:
    paths:
      - bin/
```

## 📦 Release Automation

### GitHub Releases with GoReleaser

**MUST** use GoReleaser for release automation:

```yaml
# .goreleaser.yml
project_name: app

before:
  hooks:
    - go mod tidy

builds:
  - id: server
    main: ./cmd/server
    binary: app
    env:
      - CGO_ENABLED=0
    goos:
      - linux
      - darwin
      - windows
    goarch:
      - amd64
      - arm64
    ldflags:
      - -s -w
      - -X main.Version={{.Version}}
      - -X main.GitCommit={{.FullCommit}}
      - -X main.BuildTime={{.Date}}

archives:
  - id: default
    format: tar.gz
    format_overrides:
      - goos: windows
        format: zip
    name_template: >-
      {{ .ProjectName }}_
      {{- .Version }}_
      {{- .Os }}_
      {{- .Arch }}
    files:
      - README.md
      - LICENSE

checksum:
  name_template: "checksums.txt"

snapshot:
  name_template: "{{ incpatch .Version }}-next"

changelog:
  sort: asc
  filters:
    exclude:
      - "^docs:"
      - "^test:"
      - "^chore:"

release:
  github:
    owner: open-sharia-enterprise
    name: app
  draft: false
  prerelease: auto
```

### Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - "v*"

permissions:
  contents: write

jobs:
  goreleaser:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-go@v5
        with:
          go-version: "1.25.6"

      - name: Run GoReleaser
        uses: goreleaser/goreleaser-action@v5
        with:
          version: latest
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Manual Release Process

```bash
# 1. Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 2. Build binaries
make build-all

# 3. Create checksums
cd bin/
sha256sum * > checksums.txt

# 4. Create GitHub release
gh release create v1.0.0 \
  --title "Release v1.0.0" \
  --notes "Release notes..." \
  bin/*
```

## 🏷️ Build Tags

### Conditional Compilation

```go
// main.go
package main

import (
 "fmt"
)

func main() {
 fmt.Println(buildMessage())
}
```

```go
// +build production
// build_prod.go

package main

func buildMessage() string {
 return "Running in PRODUCTION mode"
}
```

```go
// +build !production
// build_dev.go

package main

func buildMessage() string {
 return "Running in DEVELOPMENT mode"
}
```

**Build with tags**:

```bash
# Development build (default)
go build -o bin/app ./cmd/server
# Output: "Running in DEVELOPMENT mode"

# Production build
go build -tags=production -o bin/app ./cmd/server
# Output: "Running in PRODUCTION mode"
```

### Common Build Tags

**Platform-specific**:

```go
// +build linux
// linux_specific.go

package main

func platformMessage() string {
 return "Linux-specific implementation"
}
```

**Integration tests**:

```go
// +build integration
// integration_test.go

package main

func TestDatabaseIntegration(t *testing.T) {
 // Test code...
}
```

```bash
# Run only integration tests
go test -tags=integration ./...
```

## 📊 Version Information

### Inject Version at Build Time

```go
// version.go
package main

import "fmt"

var (
 // Version is the semantic version (injected at build time)
 Version = "dev"
 // GitCommit is the git commit hash (injected at build time)
 GitCommit = "unknown"
 // BuildTime is the build timestamp (injected at build time)
 BuildTime = "unknown"
)

func PrintVersion() {
 fmt.Printf("Version:    %s\n", Version)
 fmt.Printf("Git Commit: %s\n", GitCommit)
 fmt.Printf("Build Time: %s\n", BuildTime)
}
```

**Build command**:

```bash
go build -ldflags "\
  -X main.Version=1.0.0 \
  -X main.GitCommit=$(git rev-parse HEAD) \
  -X main.BuildTime=$(date -u '+%Y-%m-%d_%H:%M:%S')" \
  -o bin/app ./cmd/server
```

**CLI version command**:

```go
// cmd/server/main.go
package main

import (
 "flag"
 "fmt"
 "os"
)

func main() {
 versionFlag := flag.Bool("version", false, "Print version information")
 flag.Parse()

 if *versionFlag {
  PrintVersion()
  os.Exit(0)
 }

 // Application logic...
}
```

```bash
# Check version
./bin/app --version
# Output:
# Version:    1.0.0
# Git Commit: abc123def456...
# Build Time: 2026-02-04_10:30:00
```

## ✅ Best Practices Checklist

**Before committing**:

- [ ] `go.mod` specifies exact Go version (e.g., `go 1.26.0`)
- [ ] `go.mod` has exact dependency versions (no wildcards)
- [ ] `go.sum` is committed to version control
- [ ] `go mod verify` passes without errors
- [ ] `go mod tidy` produces no changes
- [ ] Makefile includes `verify` target
- [ ] Makefile includes `test` target with coverage
- [ ] Makefile includes `lint` target
- [ ] `.PHONY` declared for all non-file targets

**Before releasing**:

- [ ] Version information injected via `-ldflags`
- [ ] Binary optimized with `-ldflags "-s -w"`
- [ ] CGO_ENABLED=0 for static binaries
- [ ] Cross-compilation tested for all target platforms
- [ ] Docker multi-stage build used
- [ ] Docker image runs as non-root user
- [ ] GitHub Actions workflow includes all platforms
- [ ] GoReleaser configuration validated
- [ ] Checksums generated for all binaries
- [ ] Release notes documented

**Security checklist**:

- [ ] No hardcoded secrets in code
- [ ] Environment variables used for configuration
- [ ] go.sum committed (supply chain security)
- [ ] Private modules configured correctly
- [ ] Docker image based on minimal base (Alpine)
- [ ] Docker container runs as non-root user

## Related Documentation

**Core Go Documentation**:

- **[Go Best Practices](./coding-standards.md#part-2-naming--organization-best-practices)** - General Go coding standards
- **[Go Modules and Dependencies](./dependency-standards.md)** - Dependency management deep dive
- **[Go Linting and Formatting](./code-quality-standards.md)** - Code quality automation
- **[Go Security](./security-standards.md)** - Secure build practices

**Platform Documentation**:

- **[Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)** - Reproducible builds principle
- **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)** - Build automation principle
- **[Code Quality Standards](../../../../../governance/development/quality/code.md)** - Quality enforcement

**External Resources**:

- [Go Modules Reference](https://go.dev/ref/mod) - Official module documentation
- [GoReleaser Documentation](https://goreleaser.com/) - Release automation
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/) - Docker best practices

---

**Last Updated**: 2026-02-04
**Go Version**: 1.18+ (baseline), 1.25.6 (current)
**Maintainers**: Platform Documentation Team

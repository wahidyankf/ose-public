---
title: Go Modules and Dependencies
description: Go modules system for dependency management including go.mod, go.sum, versioning, and workspace mode
category: explanation
subcategory: prog-lang
tags:
  - golang
  - modules
  - dependencies
  - go-mod
  - versioning
  - workspace
  - go-1.18
  - go-1.21
  - go-1.22
  - go-1.23
  - go-1.24
  - go-1.25
  - go-1.26
related:
  - ./coding-standards.md#part-2-naming--organization-best-practices
principles:
  - reproducibility
  - explicit-over-implicit
---

# Modules and Dependencies in Go

**Quick Reference**: [Overview](#overview) | [Go Modules Overview](#go-modules-overview) | [Module Initialization](#module-initialization) | [Dependency Management](#dependency-management) | [go.mod File](#gomod-file) | [go.sum File](#gosum-file) | [Semantic Versioning](#semantic-versioning) | [Vendoring](#vendoring) | [Private Modules](#private-modules) | [Module Proxy](#module-proxy) | [Module Compatibility](#module-compatibility) | [Workspace Mode (Go 1.18+)](#workspace-mode-go-118) | [Best Practices](#best-practices) | [Common Operations](#common-operations) | [Troubleshooting](#troubleshooting) | [Related Documentation](#related-documentation) | [Further Reading](#further-reading)

## Overview

Go modules are the official dependency management system for Go, introduced in Go 1.11 and becoming the default in Go 1.13. Modules enable versioned dependency management, reproducible builds, and streamlined package distribution.

This document covers Go modules, dependency management workflows, semantic versioning, private modules, vendoring, and best practices for managing dependencies in Go projects.

## Go Modules Overview

### Module System Architecture

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph TD
    A["Your Module<br/>#40;go.mod#41;"]:::blue --> B["Direct Dependencies<br/>#40;require#41;"]:::orange
    B --> C["Dependency A<br/>v1.2.3"]:::teal
    B --> D["Dependency B<br/>v2.0.0"]:::teal
    C --> E["Transitive Deps<br/>#40;indirect#41;"]:::purple
    D --> E

    F["go.sum<br/>#40;Checksums#41;"]:::orange --> G["Verify Integrity"]:::teal
    A --> F

    H["Module Proxy<br/>#40;proxy.golang.org#41;"]:::purple --> C
    H --> D
    H --> E

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

### What are Go Modules?

A **module** is a collection of related Go packages versioned together as a single unit. Modules provide:

- **Dependency management**: Declare and manage package dependencies
- **Version control**: Track specific versions of dependencies
- **Reproducibility**: Ensure consistent builds across environments
- **Security**: Verify dependency integrity with checksums

### Module vs Package

**Package**: A directory containing Go source files with the same `package` declaration.

**Module**: A collection of packages with a `go.mod` file at the root defining the module path and dependencies.

```
my-project/               # Module root
├── go.mod                # Module definition
├── go.sum                # Dependency checksums
├── main.go               # Package main
└── internal/
    └── auth/
        └── auth.go       # Package internal/auth
```

### go.mod and go.sum Files

**go.mod**:

- Defines module path
- Lists direct dependencies with versions
- Specifies Go version
- Contains replace/exclude directives

**go.sum**:

- Records checksums for dependencies
- Ensures dependency integrity
- Prevents tampering

## Module Initialization

### Creating a New Module

```bash
# Initialize module with module path
go mod init github.com/username/project

# Initialize in existing directory
cd myproject
go mod init example.com/myproject

# Module path can be anything (doesn't need to match repository)
go mod init myapp
```

**Generated go.mod**:

```go
module github.com/username/project

go 1.26
```

> **Go 1.26 version defaulting**: `go mod init` now defaults to a lower Go version for compatibility. Toolchain v1.N.X creates `go.mod` with `go 1.(N-1).0` (e.g., Go 1.26 creates `go 1.25.0`). This encourages compatibility with currently supported Go versions. Override by editing the `go` directive after initialization.

### Module Path

The module path serves as:

- Import prefix for packages in the module
- Identifier for dependency resolution
- Location hint (but not requirement) for source code

**Examples**:

```go
// Module path: github.com/beneficiary/repo
import "github.com/beneficiary/repo/internal/auth"

// Module path: example.com/myapp
import "example.com/myapp/pkg/database"
```

## Dependency Management

### Adding Dependencies

#### Dependency Resolution Flow

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph LR
    A["go get<br/>package"]:::blue --> B["Resolve Version<br/>#40;MVS Algorithm#41;"]:::purple
    B --> C{In go.sum?}:::orange
    C -->|Yes| D["Use Cached"]:::teal
    C -->|No| E["Download from<br/>Proxy"]:::orange
    E --> F["Verify Checksum"]:::purple
    F --> G["Update go.mod<br/>+ go.sum"]:::teal
    D --> H["Build Success"]:::blue
    G --> H

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

Dependencies are added automatically when you import and build:

```bash
# Write code with import
# import "github.com/gin-gonic/gin"

# Build adds dependency to go.mod
go build

# Or explicitly add dependency
go get github.com/gin-gonic/gin

# Add specific version
go get github.com/gin-gonic/gin@v1.9.1

# Add latest
go get github.com/gin-gonic/gin@latest

# Add specific commit
go get github.com/gin-gonic/gin@abc1234
```

### Cleaning Up Dependencies

```bash
# Remove unused dependencies and add missing ones
go mod tidy

# Download dependencies without building
go mod download

# Download specific module
go mod download github.com/gin-gonic/gin
```

### Updating Dependencies

```bash
# Update all dependencies to latest minor/patch versions
go get -u ./...

# Update all dependencies to latest major versions (may break)
go get -u=patch ./...  # Only patch versions
go get -u=minor ./...  # Only minor versions

# Update specific dependency
go get -u github.com/gin-gonic/gin

# Update to specific version
go get github.com/gin-gonic/gin@v1.10.0
```

### Downgrading Dependencies

```bash
# Downgrade to specific version
go get github.com/gin-gonic/gin@v1.8.0

# Downgrade to commit
go get github.com/gin-gonic/gin@abc1234

# Use 'none' to remove
go get github.com/unused/package@none
```

## go.mod File

### Structure

```go
module github.com/username/project

go 1.26  // Minimum Go version

require (
 github.com/gin-gonic/gin v1.9.1  // Direct dependency
 github.com/gorilla/mux v1.8.1
)

require (
 github.com/gin-contrib/sse v0.1.0 // indirect
 github.com/go-playground/validator/v10 v10.14.0 // indirect
)

replace github.com/old/module => github.com/new/module v1.2.3

exclude github.com/broken/module v1.0.0

retract v1.5.0  // Retracts buggy version
```

### Module Declaration

```go
// Standard module path
module github.com/username/project

// Local module (not hosted)
module myapp

// Versioned module (v2+)
module github.com/username/project/v2
```

### Go Version Directive

```go
// Specifies minimum Go version
go 1.26

// Toolchain directive (Go 1.21+)
toolchain go1.25.6
```

### Require Directives

```go
require (
 // Direct dependency
 github.com/gin-gonic/gin v1.9.1

 // Indirect dependency (transitive)
 github.com/golang/protobuf v1.5.3 // indirect

 // Pseudo-version (commit-based)
 github.com/beneficiary/repo v0.0.0-20231215123456-abc123def456
)
```

### Replace Directives

Used for:

- Local development
- Forked dependencies
- Fixing broken upstream

```go
// Replace with local path
replace github.com/old/module => ../local/path

// Replace with different module
replace github.com/old/module => github.com/fork/module v1.2.3

// Replace specific version
replace github.com/old/module v1.0.0 => github.com/fork/module v1.0.0
```

### Exclude Directives

```go
// Exclude broken version
exclude github.com/broken/module v1.5.0

// Multiple excludes
exclude (
 github.com/module/a v1.0.0
 github.com/module/b v2.0.0
)
```

### Retract Directives

```go
// Retract buggy version
retract v1.5.0

// Retract with reason
retract (
 v1.5.0 // Contains critical security vulnerability
 [v1.6.0, v1.6.5] // Broken builds
)
```

## go.sum File

### Purpose

go.sum contains cryptographic checksums for module content:

```
github.com/gin-gonic/gin v1.9.1 h1:4idEAncQnU5cB7BeOkPtxjfCSye0AAm1R0RVIqJ+Jmg=
github.com/gin-gonic/gin v1.9.1/go.mod h1:hPrL7YrpYKXt5YId3A/Tnip5kqbEAP+KLuI3SUcPTeU=
```

Each line contains:

- Module path and version
- Hash algorithm (`h1` = SHA-256)
- Base64-encoded checksum

### Security

go.sum ensures:

- **Integrity**: Downloaded code matches expected checksums
- **Consistency**: Same code across all environments
- **Non-repudiation**: Detects tampering or corruption

### Version Control

**Always commit go.sum**:

```bash
git add go.mod go.sum
git commit -m "update dependencies"
```

### Verifying Checksums

```bash
# Verify all dependencies
go mod verify

# Output if successful:
# all modules verified

# Output if checksum mismatch:
# github.com/beneficiary/repo v1.0.0: checksum mismatch
```

## Semantic Versioning

### Semantic Versioning Decision Tree

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph TD
    A["New Release"]:::blue --> B{Breaking<br/>Changes?}:::purple
    B -->|Yes| C["Increment MAJOR<br/>#40;v2.0.0#41;"]:::orange
    B -->|No| D{New<br/>Features?}:::purple
    D -->|Yes| E["Increment MINOR<br/>#40;v1.2.0#41;"]:::teal
    D -->|No| F["Increment PATCH<br/>#40;v1.1.1#41;"]:::teal

    C --> G["Update import paths<br/>#40;github.com/pkg/v2#41;"]:::orange
    E --> H["Backward Compatible"]:::teal
    F --> H

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

Go modules use semantic versioning (semver): `vMAJOR.MINOR.PATCH`

### Version Format

**v1.2.3**:

- **MAJOR** (1): Incompatible API changes
- **MINOR** (2): Backward-compatible functionality
- **PATCH** (3): Backward-compatible bug fixes

### Pre-release Versions

```
v1.0.0-alpha       # Alpha release
v1.0.0-beta.1      # Beta release
v1.0.0-rc.1        # Release candidate
v2.0.0-20231215    # Date-based pre-release
```

### Pseudo-versions

For commits without tags:

```
v0.0.0-20231215123456-abc123def456
  ↑     ↑           ↑
  base  timestamp   commit hash (first 12 chars)
```

### Module Version Queries

```bash
# Latest version
go get github.com/gin-gonic/gin@latest

# Specific version
go get github.com/gin-gonic/gin@v1.9.1

# Version prefix
go get github.com/gin-gonic/gin@v1.9

# Specific commit
go get github.com/gin-gonic/gin@abc1234

# Specific branch
go get github.com/gin-gonic/gin@master

# Version comparisons
go list -m -versions github.com/gin-gonic/gin
```

## Vendoring

### What is Vendoring?

Vendoring copies dependencies into a `vendor/` directory in your project for:

- **Offline builds**: No network required
- **Security**: Control exact dependency code
- **Stability**: Immune to upstream deletions

### Creating Vendor Directory

```bash
# Copy dependencies to vendor/
go mod vendor

# Directory structure:
# vendor/
# ├── github.com/
# │   └── gin-gonic/
# │       └── gin/
# └── modules.txt  # Metadata
```

### Building with Vendor

```bash
# Use vendored dependencies
go build -mod=vendor

# Or set environment variable
export GOFLAGS="-mod=vendor"
go build
```

### Updating Vendor

```bash
# Update go.mod first
go get -u ./...
go mod tidy

# Then update vendor
go mod vendor
```

### Pros and Cons

**Pros**:

- Faster builds (no downloads)
- Works offline
- Audit exact dependency code
- Protection against supply chain attacks

**Cons**:

- Larger repository size
- Must manually update vendor
- Git conflicts in vendor/
- Duplicated code across projects

## Private Modules

### GOPRIVATE Environment Variable

```bash
# Single domain
export GOPRIVATE=github.com/mycompany

# Multiple domains
export GOPRIVATE=github.com/mycompany,gitlab.com/myorg

# Wildcards
export GOPRIVATE=*.mycompany.com

# GONOPROXY and GONOSUMDB (usually same as GOPRIVATE)
export GONOPROXY=$GOPRIVATE
export GONOSUMDB=$GOPRIVATE
```

### GitHub Private Modules

**Using HTTPS with Personal Access Token**:

```bash
# Configure git to use token
git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"

# Or use netrc
cat >> ~/.netrc <<EOF
machine github.com
login ${GITHUB_USERNAME}
password ${GITHUB_TOKEN}
EOF
```

**Using SSH**:

```bash
# Configure git to use SSH
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

### GitLab Private Modules

```bash
# Use personal access token
git config --global url."https://oauth2:${GITLAB_TOKEN}@gitlab.com/".insteadOf "https://gitlab.com/"

# Or SSH
git config --global url."git@gitlab.com:".insteadOf "https://gitlab.com/"
```

### Private Module in go.mod

```go
module github.com/mycompany/private-project

go 1.26

require (
 github.com/mycompany/private-lib v1.2.3
 github.com/public/lib v2.0.0
)
```

## Module Proxy

### GOPROXY

Module proxy speeds up downloads and provides caching:

```bash
# Default proxy
GOPROXY=https://proxy.golang.org,direct

# Multiple proxies (fallback)
GOPROXY=https://proxy1.com,https://proxy2.com,direct

# Direct only (no proxy)
GOPROXY=direct

# Disable (fail if not in cache)
GOPROXY=off
```

### Module Mirrors

Popular proxies:

- **proxy.golang.org**: Official Google proxy
- **goproxy.io**: Community proxy
- **goproxy.cn**: China-based proxy
- **Athens**: Self-hosted proxy

### Checksum Database

```bash
# Default checksum database
GOSUMDB=sum.golang.org

# Disable checksum verification
GOSUMDB=off

# Custom checksum database
GOSUMDB=sum.mycompany.com
```

## Module Compatibility

### Minimal Version Selection (MVS)

Go uses MVS algorithm:

- Select the **minimum** version that satisfies all requirements
- Different from npm/pip (which select maximum)

**Example**:

```
Module A requires: B v1.2.0, C v1.0.0
Module B requires: C v1.1.0

Result: C v1.1.0 (minimum satisfying both)
```

### Major Version Suffix

Major versions v2+ require path suffix:

```go
// v0 and v1 (no suffix)
module github.com/beneficiary/repo
import "github.com/beneficiary/repo/pkg"

// v2+ (with suffix)
module github.com/beneficiary/repo/v2
import "github.com/beneficiary/repo/v2/pkg"

// Different major versions can coexist
import (
 "github.com/beneficiary/repo/pkg"    // v1
 repov2 "github.com/beneficiary/repo/v2/pkg"  // v2
)
```

### Breaking Changes

When making breaking changes:

1. Increment major version
2. Add version suffix to module path (v2+)
3. Update imports in consumers

```bash
# Create v2 branch
git checkout -b v2

# Update go.mod
# module github.com/beneficiary/repo/v2

# Tag release
git tag v2.0.0
git push origin v2.0.0
```

## Workspace Mode (Go 1.18+)

### Multi-Module Development

Workspace mode allows working on multiple modules simultaneously:

```bash
# Initialize workspace
go work init ./module1 ./module2

# Add module to workspace
go work use ./module3

# Remove module from workspace
go work edit -dropuse=./module3

# Sync workspace (update go.work.sum)
go work sync
```

### go.work File

```go
go 1.26

use (
 ./module1
 ./module2
 ./module3
)

replace example.com/foo => ./local/foo
```

### Workspace Structure

```
workspace/
├── go.work        # Workspace definition
├── go.work.sum    # Workspace checksums
├── module1/
│   ├── go.mod
│   └── main.go
├── module2/
│   ├── go.mod
│   └── lib.go
└── module3/
    ├── go.mod
    └── util.go
```

### Benefits

- Develop multiple modules together
- Test changes across modules before publishing
- No need for replace directives in go.mod

## Best Practices

### Semantic Versioning

**Follow semver strictly**:

```bash
# Bug fix (no API change)
v1.2.3 -> v1.2.4

# New feature (backward-compatible)
v1.2.3 -> v1.3.0

# Breaking change
v1.2.3 -> v2.0.0
```

### Module Structure

**Organize by concern**:

```
module github.com/beneficiary/project

/                   # Module root
├── go.mod
├── go.sum
├── cmd/            # Main applications
│   └── server/
│       └── main.go
├── pkg/            # Public libraries
│   └── api/
│       └── api.go
├── internal/       # Private code
│   └── auth/
│       └── auth.go
└── README.md
```

### Dependency Versioning

**Pin major versions, allow minor/patch**:

```go
require (
 github.com/gin-gonic/gin v1.9.1  // OK: specific version
 github.com/gorilla/mux v1.8      // OK: allows v1.8.x
)
```

**Avoid**:

- Pre-release versions in production
- Pseudo-versions (commit-based) for releases
- `@latest` in go.mod (be explicit)

### Regular Maintenance

```bash
# Monthly: update dependencies
go get -u ./...
go mod tidy
go test ./...

# Check for vulnerabilities
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...

# Review outdated dependencies
go list -u -m all
```

### Documentation

**Document dependencies**:

```markdown
# Dependencies

- **github.com/gin-gonic/gin**: HTTP web framework
- **github.com/stretchr/testify**: Testing toolkit
- **github.com/spf13/viper**: Configuration management
```

## Common Operations

### Adding Dependencies

```bash
# Import in code
import "github.com/gin-gonic/gin"

# Build (adds to go.mod automatically)
go build

# Or explicitly add
go get github.com/gin-gonic/gin
```

### Upgrading Dependencies

```bash
# Upgrade all to latest minor/patch
go get -u ./...

# Upgrade specific dependency
go get -u github.com/gin-gonic/gin

# Upgrade to specific version
go get github.com/gin-gonic/gin@v1.10.0

# View available versions
go list -m -versions github.com/gin-gonic/gin
```

### Downgrading Dependencies

```bash
# Downgrade to specific version
go get github.com/gin-gonic/gin@v1.8.0

# Clean up
go mod tidy
```

### Removing Dependencies

```bash
# Remove import from code

# Clean up go.mod
go mod tidy

# Or explicitly remove
go get github.com/unused/package@none
```

### Viewing Dependencies

```bash
# List all dependencies
go list -m all

# List direct dependencies only
go list -m -f '{{if not .Indirect}}{{.Path}}{{end}}' all

# Dependency graph
go mod graph

# Why is module included?
go mod why github.com/gin-gonic/gin
```

## Troubleshooting

### Common Errors

**"no required module provides package"**:

```bash
# Fix: add missing dependency
go mod tidy
go get github.com/missing/package
```

**"module declares its path as X but was required as Y"**:

```bash
# Fix: use correct import path
# If module path changed, update imports
```

**"go.mod file not found"**:

```bash
# Fix: initialize module
go mod init github.com/username/project
```

### Version Conflicts

**Multiple versions required**:

```bash
# View conflict
go mod graph | grep conflicting-package

# Resolution options:
# 1. Update to compatible versions
go get package@version

# 2. Use replace directive
replace github.com/old => github.com/new v1.0.0

# 3. Exclude problematic version
exclude github.com/broken v1.5.0
```

### Checksum Mismatches

**"verifying module: checksum mismatch"**:

```bash
# Causes:
# - Corrupted download
# - Changed upstream (rare, but possible)
# - go.sum out of sync

# Fix 1: Re-download
go clean -modcache
go mod download

# Fix 2: Update go.sum
go mod tidy

# Fix 3: If intentional change, update checksum
go get package@version
```

### Private Repository Access

**"cannot find module providing package"**:

```bash
# Fix: Configure private module access
export GOPRIVATE=github.com/mycompany
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

### Proxy Issues

**"timeout downloading"**:

```bash
# Fix 1: Use direct
GOPROXY=direct go get package

# Fix 2: Different proxy
GOPROXY=https://goproxy.io,direct go get package

# Fix 3: Bypass proxy for specific domain
GONOPROXY=github.com/mycompany go get package
```

## Related Documentation

- [Best Practices](./coding-standards.md#part-2-naming--organization-best-practices) - Code organization and project structure
- [Linting and Formatting](./code-quality-standards.md) - CI/CD integration with modules
- [Web Services](./api-standards.md) - Framework dependencies

## Further Reading

- [Go Modules Reference](https://go.dev/ref/mod) - Official modules documentation
- [Module Release Guide](https://go.dev/doc/modules/release-workflow) - Publishing modules
- [Module Compatibility](https://go.dev/blog/module-compatibility) - Maintaining compatibility
- [Private Modules](https://go.dev/ref/mod#private-modules) - Private module configuration
- [Semantic Versioning](https://semver.org/) - Versioning specification

---

**Go Version**: 1.21+ (baseline), 1.22+ (recommended), 1.23 (latest)
**Maintainers**: Platform Documentation Team

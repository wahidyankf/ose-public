---
title: "Go Modules"
date: 2026-02-04T00:00:00+07:00
draft: false
description: "Dependency management with go.mod, semantic versioning, and workspace mode"
weight: 1000082
tags: ["golang", "modules", "dependencies", "versioning"]
---

## Why Go Modules Matter

Go Modules is Go's dependency management system that ensures reproducible builds, semantic versioning, and explicit dependency declarations. Introduced in Go 1.11 and default since 1.13, modules eliminate GOPATH constraints and enable version pinning critical for production reliability.

**Core benefits**:

- **Reproducible builds**: Same code always pulls same dependencies
- **Semantic versioning**: Clear upgrade paths and breaking change signals
- **Version pinning**: Control exactly which dependency versions used
- **Vendoring optional**: Can commit dependencies or fetch on build

**Problem**: Without modules (legacy GOPATH), builds are non-reproducible, dependency versions implicit, and version conflicts undetectable until runtime.

**Solution**: Use go.mod for dependency declaration and go.sum for cryptographic verification, starting with basic module commands before advanced workspace features.

## Standard Library: go mod

Go's built-in `go` command manages modules without external tools.

**Initializing a module**:

```bash
go mod init github.com/myuser/myproject
# => Creates go.mod file
# => github.com/myuser/myproject is module path
# => Module path used in import statements
```

**Generated go.mod**:

```go
module github.com/myuser/myproject
// => Module declaration
// => First line of go.mod (required)

go 1.23
// => Minimum Go version required
// => go directive sets language version
```

**Adding dependencies**:

```go
// File: main.go
package main

import (
    "fmt"
    "github.com/gin-gonic/gin"
    // => External dependency
    // => go will fetch on first build
)

func main() {
    // => Entry point

    r := gin.Default()
    // => Creates Gin router
    // => gin package from external dependency

    r.GET("/ping", func(c *gin.Context) {
        c.JSON(200, gin.H{
            "message": "pong",
        })
    })

    r.Run()
    // => Starts HTTP server on :8080
}
```

```bash
go mod tidy
# => Downloads dependencies
# => Updates go.mod with required versions
# => Removes unused dependencies
# => Creates/updates go.sum
```

**Updated go.mod**:

```go
module github.com/myuser/myproject

go 1.23

require github.com/gin-gonic/gin v1.10.0
// => Direct dependency
// => v1.10.0 is semantic version

require (
    // => Indirect dependencies (transitive)
    // => Required by gin, not directly imported
    github.com/bytedance/sonic v1.11.6 // indirect
    github.com/gabriel-vasile/mimetype v1.4.3 // indirect
    github.com/gin-contrib/sse v0.1.0 // indirect
    // ... more indirect dependencies
)
```

**go.sum file** (cryptographic verification):

```
github.com/gin-gonic/gin v1.10.0 h1:abc123...
github.com/gin-gonic/gin v1.10.0/go.mod h1:xyz789...
// => First line: module content hash
// => Second line: go.mod file hash
// => Verifies integrity (prevents tampering)
```

**Common go mod commands**:

```bash
go mod tidy
# => Adds missing and removes unused dependencies
# => Run after changing imports
# => Updates go.mod and go.sum

go mod download
# => Downloads dependencies to module cache
# => Useful in CI/CD (separate download from build)
# => Cache location: $GOPATH/pkg/mod

go mod verify
# => Verifies downloaded dependencies match go.sum
# => Detects corrupted or tampered modules
# => Run in CI/CD for security

go mod graph
# => Prints module dependency graph
# => Shows all transitive dependencies
# => Useful for debugging version conflicts

go mod why github.com/some/package
# => Explains why package is needed
# => Shows dependency chain
```

**Limitations of basic go mod**:

- No workspace support (multi-module projects difficult)
- Version updates manual (must edit go.mod)
- Local development with unreleased modules complex

## Semantic Versioning in Go Modules

Go modules enforce semantic versioning (SemVer) for predictable upgrades.

**SemVer format**: `vMAJOR.MINOR.PATCH`

**Version examples**:

```
v1.2.3      => Major: 1, Minor: 2, Patch: 3
v0.1.0      => Pre-release (v0.x.x)
v2.0.0      => Major version 2 (breaking changes)
v1.2.3-rc.1 => Pre-release candidate
```

**Version semantics**:

- **PATCH (v1.2.3 → v1.2.4)**: Bug fixes, no API changes
- **MINOR (v1.2.3 → v1.3.0)**: New features, backward compatible
- **MAJOR (v1.2.3 → v2.0.0)**: Breaking changes, incompatible API

**v0 modules** (pre-release):

```go
module github.com/myuser/mylib

go 1.23
// => v0.x.x modules are pre-release
// => Breaking changes allowed in MINOR versions
// => v0.1.0 → v0.2.0 can break compatibility
```

**v1 modules** (stable):

```go
module github.com/myuser/mylib

go 1.23
// => Implies v1.x.x
// => MAJOR version 1 (no suffix needed)
// => Breaking changes require v2+
```

**v2+ modules** (major version in path):

```go
// File: go.mod
module github.com/myuser/mylib/v2
// => v2 suffix in module path (required)
// => Breaking change from v1
// => Allows v1 and v2 in same project

go 1.23
```

**Importing v2+ modules**:

```go
package main

import (
    "github.com/myuser/mylib"      // v1
    // => Imports v1 module

    v2 "github.com/myuser/mylib/v2"
    // => Imports v2 module with alias
    // => v1 and v2 can coexist
)

func main() {
    // => Can use both versions
    mylib.DoSomething()
    // => v1 API

    v2.DoSomething()
    // => v2 API (possibly different signature)
}
```

**Version selection** (Minimum Version Selection):

```go
// Project A requires:
require github.com/some/lib v1.2.0

// Project B requires:
require github.com/some/lib v1.3.0

// Go selects: v1.3.0 (highest minimum)
// => Minimum Version Selection (MVS) algorithm
// => Prefers stability over latest
```

**Upgrading dependencies**:

```bash
go get github.com/gin-gonic/gin@latest
# => Upgrades to latest version
# => Updates go.mod

go get github.com/gin-gonic/gin@v1.9.0
# => Upgrades to specific version
# => Useful for rollbacks

go get -u ./...
# => Upgrades all dependencies to latest MINOR/PATCH
# => Respects semantic versioning (no MAJOR bumps)

go get -u=patch ./...
# => Upgrades only PATCH versions
# => Safest upgrade (bug fixes only)
```

**Trade-offs**:

| Approach            | Pros                                | Cons                           |
| ------------------- | ----------------------------------- | ------------------------------ |
| Manual versioning   | Full control, no unexpected changes | Tedious, miss security patches |
| go get -u (latest)  | Always latest features              | Risk of breaking changes       |
| Dependabot/Renovate | Automated, PR-based, tested         | CI/CD cost, review overhead    |

**When to use**:

- **v0.x.x**: Experimental projects, rapid iteration
- **v1.x.x**: Stable APIs, production libraries
- **v2+**: Breaking changes unavoidable, clear migration path

## Production Feature: Workspace Mode (Go 1.18+)

Workspaces enable multi-module development without replace directives.

**Problem without workspaces**:

```
myproject/
├── service-a/
│   └── go.mod     # Module A
└── service-b/
    └── go.mod     # Module B (imports service-a)
```

```go
// File: service-b/go.mod
module github.com/myuser/service-b

require github.com/myuser/service-a v1.0.0
// => Requires published version
// => Local development difficult
// => Must publish or use replace directive
```

**Old solution** (replace directive):

```go
// File: service-b/go.mod
module github.com/myuser/service-b

require github.com/myuser/service-a v1.0.0

replace github.com/myuser/service-a => ../service-a
// => Redirects to local path
// => Must remove before commit
// => Error-prone (forget to remove)
```

**Workspace solution** (Go 1.18+):

```bash
cd myproject/
go work init
# => Creates go.work file
# => Defines workspace

go work use ./service-a
# => Adds service-a to workspace

go work use ./service-b
# => Adds service-b to workspace
```

**Generated go.work**:

```go
go 1.23
// => Workspace Go version

use (
    ./service-a
    ./service-b
)
// => Lists workspace modules
// => Both modules visible to each other
// => No replace directives needed
```

**service-b can now import local service-a**:

```go
// File: service-b/main.go
package main

import (
    "github.com/myuser/service-a/pkg/utils"
    // => Imports local service-a
    // => go.work resolves to ./service-a
    // => No replace directive needed
)

func main() {
    utils.DoSomething()
    // => Calls local service-a code
}
```

**Workspace commands**:

```bash
go work sync
# => Syncs workspace go.work with module requirements
# => Updates use directives

go work edit -use ./service-c
# => Adds service-c to workspace

go work edit -dropuse ./service-a
# => Removes service-a from workspace
```

**Go.work best practices**:

- **Don't commit go.work**: Add to .gitignore (local development only)
- **Document workspace setup**: README instructions for team
- **CI/CD ignores go.work**: Builds use published versions

**Trade-offs**:

| Approach          | Pros                                    | Cons                             |
| ----------------- | --------------------------------------- | -------------------------------- |
| Replace directive | Works in older Go, explicit             | Manual, error-prone, commit risk |
| Workspace mode    | Automatic, no commit risk, multi-module | Go 1.18+, local only             |

**When to use**:

- **Replace directives**: Go <1.18, single module override
- **Workspaces**: Go 1.18+, multi-module projects, microservices monorepo

## Vendoring Dependencies

Vendoring commits dependencies to version control for offline builds.

**Enable vendoring**:

```bash
go mod vendor
# => Copies dependencies to vendor/ directory
# => Creates vendor/modules.txt (dependency list)
# => Commit vendor/ to git
```

**Directory structure**:

```
myproject/
├── go.mod
├── go.sum
├── vendor/              # Copied dependencies
│   ├── github.com/
│   │   └── gin-gonic/
│   │       └── gin/
│   └── modules.txt      # Dependency manifest
└── main.go
```

**Building with vendor**:

```bash
go build -mod=vendor
# => Uses vendor/ instead of module cache
# => No network access needed
# => Ensures exact versions

go build
# => Auto-detects vendor/ (Go 1.14+)
# => Same as -mod=vendor if vendor/ present
```

**Updating vendored dependencies**:

```bash
go get -u ./...
# => Updates go.mod and go.sum

go mod vendor
# => Re-vendors updated dependencies
# => Commit both go.mod and vendor/
```

**Trade-offs**:

| Approach     | Pros                               | Cons                                  |
| ------------ | ---------------------------------- | ------------------------------------- |
| No vendoring | Small repo, faster CI/CD           | Requires network, proxy/registry risk |
| Vendoring    | Offline builds, audit dependencies | Large repo, merge conflicts           |

**When to vendor**:

- **High-security environments**: Air-gapped networks, no external access
- **Long-term archival**: Ensure builds work decades later
- **Compliance**: Auditing dependencies required

**When NOT to vendor**:

- **Active development**: Frequent dependency updates cause conflicts
- **Public projects**: Contributors expect standard go get workflow

## Advanced Patterns

**Private modules** (authentication):

```bash
export GOPRIVATE=github.com/mycompany/*
# => Tells go not to use public proxies
# => Direct git clone from private repos

git config --global url."https://oauth2:${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"
# => Injects GitHub token into git URLs
# => Enables private module fetching
```

**Module proxy** (caching and security):

```bash
export GOPROXY=https://proxy.golang.org,direct
# => Default: use public proxy, fallback to direct
# => Proxy caches modules for availability

export GOPROXY=https://company-proxy.internal.example,direct
# => Custom company proxy
# => Scans for vulnerabilities, caches internally
```

**Checksum database** (security):

```bash
export GOSUMDB=sum.golang.org
# => Default: public checksum database
# => Verifies module checksums globally

export GOSUMDB=off
# => Disables checksum verification
# => Only use in air-gapped environments
```

**Retract versions** (published bad version):

```go
// File: go.mod
module github.com/myuser/mylib

retract v1.2.3
// => Marks v1.2.3 as retracted
// => Users warned not to use this version
// => Useful for security issues or broken releases
```

**Exclude versions** (force avoid specific version):

```go
// File: go.mod
module github.com/myuser/myproject

exclude github.com/some/lib v1.5.0
// => Prevents using v1.5.0
// => Go selects different version
// => Useful for known-vulnerable versions
```

## Best Practices

**Commit policy**:

- **Always commit**: go.mod, go.sum
- **Never commit**: go.work (local development only)
- **Optionally commit**: vendor/ (depends on policy)

**Version pinning**:

```bash
go get github.com/gin-gonic/gin@v1.10.0
# => Pin to exact version in production
# => Prevents unexpected updates

go get github.com/gin-gonic/gin@latest
# => Use latest in development
# => Test before pinning
```

**Security scanning**:

```bash
go list -m -json all | docker run --rm -i sonatypeoss/nancy:latest sleuth
# => Scans dependencies for vulnerabilities
# => Run in CI/CD pipeline

go mod verify
# => Verifies checksums match go.sum
# => Detects tampered dependencies
```

**Dependency updates**:

- Schedule regular update cycles (monthly/quarterly)
- Test thoroughly before merging
- Use Dependabot or Renovate for automation
- Monitor security advisories

**Module organization** (mono-repo):

```
myproject/
├── go.work          # Workspace definition (not committed)
├── service-a/
│   └── go.mod       # Independent module
├── service-b/
│   └── go.mod       # Independent module
└── shared/
    └── go.mod       # Shared library module
```

## Common Issues

**Problem**: "module not found" error

```bash
go mod tidy
# => Downloads missing dependencies

go clean -modcache
# => Clears module cache (nuclear option)
# => Re-downloads all dependencies
```

**Problem**: Version conflicts

```bash
go mod graph | grep github.com/conflict/lib
# => Shows dependency chain causing conflict

go get github.com/conflict/lib@v1.2.3
# => Manually resolve by pinning version
```

**Problem**: Private module authentication fails

```bash
export GOPRIVATE=github.com/mycompany/*
# => Disables proxy for private modules

git config --global url."git@github.com:".insteadOf "https://github.com/"
# => Use SSH instead of HTTPS
# => Assumes SSH key configured
```

## Summary

Go modules best practices:

- **go.mod and go.sum**: Always commit, version control
- **Semantic versioning**: v0.x.x (unstable), v1.x.x (stable), v2+ (breaking changes)
- **go mod tidy**: Run after changing imports
- **Workspace mode**: Multi-module local development (Go 1.18+)
- **Vendoring**: Optional, useful for security/offline builds
- **Security**: go mod verify, vulnerability scanning

**Progressive adoption**:

1. Start with `go mod init` and `go mod tidy`
2. Learn semantic versioning (v1 vs v2+)
3. Use `go get` for upgrades (`-u`, `-u=patch`)
4. Adopt workspaces for multi-module projects
5. Consider vendoring for security-critical environments

**Command reference**:

```bash
go mod init <module>      # Initialize module
go mod tidy               # Add/remove dependencies
go get <pkg>@<version>    # Upgrade/downgrade
go mod download           # Pre-download dependencies
go mod verify             # Verify checksums
go mod vendor             # Create vendor directory
go work init              # Initialize workspace
go work use <dir>         # Add module to workspace
```

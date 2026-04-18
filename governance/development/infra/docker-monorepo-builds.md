---
title: Docker Monorepo Build Patterns
description: Patterns and pitfalls for building Docker images in an npm workspace monorepo
category: explanation
subcategory: development/infra
tags:
  - docker
  - monorepo
  - npm-workspaces
  - build
  - node_modules
created: 2026-03-28
updated: 2026-03-28
---

# Docker Monorepo Build Patterns

Patterns and pitfalls for building Docker images for individual apps in an npm workspace monorepo.
Workspace symlinks do not survive Docker builds. This document explains why, and shows the
canonical workaround.

## The Problem: Workspace Symlinks Break Inside Docker

npm workspaces install shared packages (e.g., `@open-sharia-enterprise/ts-ui-tokens`) as symlinks
in the root `node_modules/`. When `npm ci` runs inside a Docker build context that only contains
an app directory — or even the full repo root without the `libs/` tree — npm creates those symlinks
pointing to paths that do not exist inside the container. The build fails with errors such as:

```
Module not found: Can't resolve '@open-sharia-enterprise/ts-ui-tokens/src/tokens.css'
```

The root cause: npm workspace symlinks resolve to sibling directories on the host filesystem (e.g.,
`libs/ts-ui-tokens/`). Those directories are only present if they are explicitly copied into the
Docker build context. A naive `COPY . .` from the repo root is insufficient because the symlinks
are created by `npm ci`, which runs after `COPY` — and `npm ci` in a standalone container does not
know about the workspace siblings.

## The Pattern: Direct node_modules Injection

Instead of relying on workspace symlinks, copy shared library source files directly into
`node_modules/@scope/package/` in the Docker build stage **after** `npm install` or `npm ci`. This
bypasses symlink resolution entirely and makes the packages directly resolvable by Node.js.

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY apps/organiclever-fe/package.json ./apps/organiclever-fe/

# Install dependencies (workspace-aware, but symlinks will be replaced below)
RUN npm ci --workspace=apps/organiclever-fe --include-workspace-root

# Copy app source
COPY apps/organiclever-fe/ ./apps/organiclever-fe/

# Inject shared library source directly into node_modules — bypasses symlinks
COPY libs/ts-ui/src/ ./node_modules/@open-sharia-enterprise/ts-ui/src/
COPY libs/ts-ui/package.json ./node_modules/@open-sharia-enterprise/ts-ui/
COPY libs/ts-ui-tokens/src/ ./node_modules/@open-sharia-enterprise/ts-ui-tokens/src/
COPY libs/ts-ui-tokens/package.json ./node_modules/@open-sharia-enterprise/ts-ui-tokens/

RUN npm run build --workspace=apps/organiclever-fe
```

The key insight: Node.js module resolution searches `node_modules/@scope/package/` directly. Once
the source files are in place, imports such as
`@open-sharia-enterprise/ts-ui-tokens/src/tokens.css` resolve without any symlink involvement.

## Build Context Must Be Repo Root

All docker-compose files that build frontend apps must set `context: ../../..` (three levels up
from `infra/dev/<app>/`) so that `COPY libs/...` instructions in the Dockerfile can reach the
`libs/` tree. The `dockerfile` key provides the Dockerfile path relative to the context.

```yaml
# infra/dev/organiclever-fe/docker-compose.yml
services:
  organiclever-fe:
    build:
      context: ../../.. # repo root — required for COPY libs/...
      dockerfile: apps/organiclever-fe/Dockerfile
```

A build context scoped to the app directory (e.g., `context: .`) cannot access `libs/` and will
fail at the `COPY libs/...` step with "path not found" errors.

Verify the context is correct for every docker-compose file that builds an app depending on shared
libraries:

```bash
# List all docker-compose CI overlays and check their context values
grep -r "context:" infra/dev/*/docker-compose*.yml
```

## Transitive Dependency Hoisting

In the full monorepo, npm hoists transitive dependencies to the root `node_modules/`. A Docker
build that runs `npm ci` for a single app only installs the dependencies declared in that app's
`package.json`. Transitive dependencies that exist in the monorepo root — but are not explicitly
listed in the app — will be missing inside the container.

**Example**: `@tanstack/react-router` depends on `tiny-warning`. In the monorepo, npm hoists
`tiny-warning` to the root `node_modules/`. A Docker build for the app installs only the app's
direct deps. Because `tiny-warning` is not listed in the app's `package.json`, it is absent, and
the build fails.

**Fix**: Add the missing transitive dependency as an explicit entry in the app's `package.json`:

```json
{
  "dependencies": {
    "@tanstack/react-router": "^1.x.x",
    "tiny-warning": "^1.x.x"
  }
}
```

When a Docker build fails with "module not found" for a package that is not a direct dependency,
check whether that package exists in the root `node_modules/` of the monorepo. If it does, it is a
hoisted transitive dependency that must be pinned explicitly in the app.

## Checklist: When an App Gains a New `libs/*` Dependency

When an app adds an import from a shared library (e.g., `@open-sharia-enterprise/ts-new-lib`):

- [ ] Add `COPY libs/ts-new-lib/src/ ./node_modules/@open-sharia-enterprise/ts-new-lib/src/` to the
      app's Dockerfile (after `npm ci`)
- [ ] Add `COPY libs/ts-new-lib/package.json ./node_modules/@open-sharia-enterprise/ts-new-lib/`
      to the app's Dockerfile
- [ ] Update all docker-compose CI overlays that build that app — check
      `infra/dev/<app>/docker-compose.ci.yml`
- [ ] Confirm the build context in every affected docker-compose file is repo root
- [ ] Run a local Docker build to verify: `docker compose -f infra/dev/<app>/docker-compose.yml build`
- [ ] Run the app's E2E CI workflow to confirm the Docker build succeeds end-to-end

## Checklist: When Creating a New Shared Library

When a new package is added under `libs/`:

- [ ] Identify every app that will import the new library
- [ ] Update each app's Dockerfile with the `COPY libs/<new-lib>/...` injection pattern
- [ ] Update every docker-compose CI overlay that builds those apps
- [ ] Confirm or set build context to repo root for each affected docker-compose file
- [ ] Test locally: `docker compose -f infra/dev/<app>/docker-compose.yml build`

## Common Pitfalls

### Pitfall 1: Build context scoped to the app directory

**Scenario**: `docker-compose.yml` sets `context: .` pointing at the app directory. The Dockerfile
`COPY libs/...` instruction fails because `libs/` is not inside the app directory.

**Fix**: Set `context: ../../..` (repo root) in every docker-compose file that builds an app with
shared library dependencies.

### Pitfall 2: Forgetting to update docker-compose CI overlays

**Scenario**: The main `docker-compose.yml` is updated with the correct context, but the CI
overlay (`docker-compose.ci.yml`) still has the old context or is missing the shared lib
injection. Builds pass locally but fail in CI.

**Fix**: Keep `docker-compose.ci.yml` in sync with `docker-compose.yml`. After every Dockerfile
change, check all CI overlays for that app.

### Pitfall 3: Injecting source but omitting `package.json`

**Scenario**: The Dockerfile copies `libs/ts-ui-tokens/src/` but not
`libs/ts-ui-tokens/package.json`. Node.js resolves files successfully, but tools that read
`package.json` (type declarations, `exports` field resolution) fail.

**Fix**: Always copy both `src/` and `package.json` for each injected library.

### Pitfall 4: Missing hoisted transitive dependency

**Scenario**: A Docker build fails on a module that is not a direct dependency of the app. The
package exists in the monorepo root `node_modules/` because npm hoisted it from a transitive
dependency.

**Fix**: Add the transitive dependency explicitly to the app's `package.json` so `npm ci` installs
it in the container.

## Validation

Verify that Docker builds work correctly before pushing:

```bash
# Build the Docker image locally
docker compose -f infra/dev/<app>/docker-compose.yml build

# Check that the build context resolves libs/ correctly
docker compose -f infra/dev/<app>/docker-compose.ci.yml config | grep context
```

The E2E CI workflow for each frontend app runs a full Docker build as part of its pipeline.
A green CI run on the app's E2E workflow confirms the Docker build and the injected libraries are
both working.

## References

**Related Development Standards:**

- [Nx Target Standards](./nx-targets.md) - Canonical target names and build dependency patterns
- [Vercel Deployment Convention](./vercel-deployment.md) - Related build context and dependency
  chain considerations

**Agents:**

- `repo-rules-checker` - Can validate docker-compose context settings
- `repo-rules-fixer` - Corrects docker-compose context misconfigurations

## Principles Implemented/Respected

This convention implements/respects the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**:
  Shared library source must be explicitly injected into `node_modules/` inside the Docker build
  stage. Relying on npm workspace symlink resolution inside Docker is implicit and will fail. Every
  `COPY libs/...` line is a deliberate, visible declaration of the dependency.

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**:
  The Docker image build must produce the same result locally and in CI. Explicit `COPY` injection
  and repo-root build context ensure the build is deterministic regardless of environment.

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**:
  The root cause of module-not-found errors in Docker is symlink resolution failure, not a missing
  package. This pattern fixes the root cause by injecting source directly rather than patching
  around broken symlinks with workarounds like `--legacy-peer-deps` or volume mounts.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**:
  Checklists for adding new library dependencies and creating new shared libraries ensure that
  Docker build maintenance is systematic rather than ad hoc, reducing the chance of build failures
  discovered only in CI.

## Conventions Implemented/Respected

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Dockerfile and
  docker-compose filenames follow kebab-case consistent with repository naming conventions.
- **[Indentation Convention](../../conventions/formatting/indentation.md)**: All YAML and
  Dockerfile examples in this document use 2-space indentation per the project standard.
- **[Content Quality Principles](../../conventions/writing/quality.md)**: Documentation uses
  active voice, proper heading hierarchy, and code blocks with language specifiers throughout.

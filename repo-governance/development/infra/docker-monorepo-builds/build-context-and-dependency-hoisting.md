---
description: Covers the repo-root build context requirement for docker-compose files run with Podman Compose, and how to handle npm's transitive dependency hoisting in container builds.
when_to_use: Use when a Podman Compose build fails to find libs/ files, or when a container build fails on a module that is not a direct dependency of the app.
---

# Build Context and Transitive Dependency Hoisting

## Build Context Must Be Repo Root

All docker-compose files that build frontend apps must set `context: ../../..` (three levels up
from `infra/dev/<app>/`) so that `COPY libs/...` instructions in the Dockerfile can reach the
`libs/` tree. The `dockerfile` key provides the Dockerfile path relative to the context. Native
`podman build` runs use the same repo root as their final context argument.

```yaml
# infra/dev/organiclever-app-web/docker-compose.yml
services:
  organiclever-app-web:
    build:
      context: ../../.. # repo root — required for COPY libs/...
      dockerfile: apps/organiclever-app-web/Dockerfile
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

In the full monorepo, npm hoists transitive dependencies to the root `node_modules/`. A container
build that runs `npm ci` for a single app only installs the dependencies declared in that app's
`package.json`. Transitive dependencies that exist in the monorepo root — but are not explicitly
listed in the app — will be missing inside the container.

**Example**: `@tanstack/react-router` depends on `tiny-warning`. In the monorepo, npm hoists
`tiny-warning` to the root `node_modules/`. A container build for the app installs only the app's
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

When a container build fails with "module not found" for a package that is not a direct dependency,
check whether that package exists in the root `node_modules/` of the monorepo. If it does, it is a
hoisted transitive dependency that must be pinned explicitly in the app.

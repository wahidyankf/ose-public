---
description: Explains why npm workspace symlinks break inside container builds and the direct node_modules injection pattern that fixes it.
when_to_use: Use when a container build (Podman) inside this monorepo fails to resolve a workspace symlink or reports a shared library module not found.
---

# Workspace Symlinks and the Direct Injection Pattern

## The Problem: Workspace Symlinks Break Inside Containers

npm workspaces install shared packages (e.g., `@open-sharia-enterprise/web-ui-token`) as symlinks
in the root `node_modules/`. When `npm ci` runs inside a container build context that only contains
an app directory — or even the full repo root without the `libs/` tree — npm creates those symlinks
pointing to paths that do not exist inside the container. The build fails with errors such as:

```
Module not found: Can't resolve '@open-sharia-enterprise/web-ui-token/src/tokens.css'
```

The root cause: npm workspace symlinks resolve to sibling directories on the host filesystem (e.g.,
`libs/web-ui-token/`). Those directories are only present if they are explicitly copied into the
container build context. A naive `COPY . .` from the repo root is insufficient because the symlinks
are created by `npm ci`, which runs after `COPY` — and `npm ci` in a standalone container does not
know about the workspace siblings.

## The Pattern: Direct node_modules Injection

Instead of relying on workspace symlinks, copy shared library source files directly into
`node_modules/@scope/package/` in the container build stage **after** `npm install` or `npm ci`. This
bypasses symlink resolution entirely and makes the packages directly resolvable by Node.js.

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY apps/organiclever-app-web/package.json ./apps/organiclever-app-web/

# Install dependencies (workspace-aware, but symlinks will be replaced below)
RUN npm ci --workspace=apps/organiclever-app-web --include-workspace-root

# Copy app source
COPY apps/organiclever-app-web/ ./apps/organiclever-app-web/

# Inject shared library source directly into node_modules — bypasses symlinks
COPY libs/web-ui/src/ ./node_modules/@open-sharia-enterprise/web-ui/src/
COPY libs/web-ui/package.json ./node_modules/@open-sharia-enterprise/web-ui/
COPY libs/web-ui-token/src/ ./node_modules/@open-sharia-enterprise/web-ui-token/src/
COPY libs/web-ui-token/package.json ./node_modules/@open-sharia-enterprise/web-ui-token/

RUN npm run build --workspace=apps/organiclever-app-web
```

The key insight: Node.js module resolution searches `node_modules/@scope/package/` directly. Once
the source files are in place, imports such as
`@open-sharia-enterprise/web-ui-token/src/tokens.css` resolve without any symlink involvement.

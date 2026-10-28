---
description: Patterns and pitfalls for building container images with Podman in an npm workspace monorepo
when_to_use: Use when building or debugging a container image with Podman for an app inside this npm workspace monorepo, or when a build fails to resolve a shared `libs/` package.
---

# Podman Monorepo Build Patterns

Patterns and pitfalls for building container images for individual apps in an npm workspace monorepo.
Workspace symlinks do not survive container builds. The pages below explain why, and show the
canonical workaround, build-context requirements, maintenance checklists, and validation steps.

The build contract is native rootless Podman. Image builds run `podman build --layers --format docker`
with an explicit build context, Dockerfile path, build arguments, and content-derived tags. Compose builds
run through `podman compose` with the `podman-compose` provider. Derived images and the runs that use them
share one Podman store. Dockerfile syntax is unchanged; Docker Buildx and BuildKit cache flags are not used.

## In This Section

- [Workspace Symlinks and the Direct Injection Pattern](./docker-monorepo-builds/workspace-symlinks-and-direct-injection-pattern.md) — Explains why npm workspace symlinks break inside container builds and the direct node_modules injection pattern that fixes it. Use when a container build (Podman) inside this monorepo fails to resolve a workspace symlink or reports a shared library module not found.
- [Build Context and Transitive Dependency Hoisting](./docker-monorepo-builds/build-context-and-dependency-hoisting.md) — Covers the repo-root build context requirement for docker-compose files run with Podman Compose, and how to handle npm's transitive dependency hoisting in container builds. Use when a Compose build fails to find libs/ files, or when a container build fails on a module that is not a direct dependency of the app.
- [Checklists and Common Pitfalls](./docker-monorepo-builds/checklists-and-common-pitfalls.md) — Checklists for adding a new libs/\* dependency or shared library, plus the four most common container monorepo build pitfalls and their fixes. Use when adding a new shared library dependency to an app's Dockerfile, creating a new shared library, or diagnosing a recurring container build failure.
- [Validation, References, and Principles](./docker-monorepo-builds/validation-references-and-principles.md) — How to validate a Podman monorepo build locally and in CI, related references, and the principles and conventions this pattern implements. Use when verifying a container build with Podman before pushing, or when tracing this convention back to the principles and conventions it implements.

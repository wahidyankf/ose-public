---
description: "Patterns and pitfalls for building container images with Podman in an npm workspace monorepo"
when_to_use: "Read this index to find the right Podman Monorepo Build Patterns child document."
---

# Podman Monorepo Build Patterns

- [Workspace Symlinks and the Direct Injection Pattern](./workspace-symlinks-and-direct-injection-pattern.md) — Explains why npm workspace symlinks break inside container builds and the direct node_modules injection pattern that fixes it. Use when a container build inside this monorepo fails to resolve a workspace symlink or reports a shared library module not found.
- [Build Context and Transitive Dependency Hoisting](./build-context-and-dependency-hoisting.md) — Covers the repo-root build context requirement for docker-compose files run with Podman Compose, and how to handle npm's transitive dependency hoisting in container builds. Use when a Compose build fails to find libs/ files, or when a container build fails on a module that is not a direct dependency of the app.
- [Checklists and Common Pitfalls](./checklists-and-common-pitfalls.md) — Checklists for adding a new libs/\* dependency or shared library, plus the four most common container monorepo build pitfalls and their fixes. Use when adding a new shared library dependency to an app's Dockerfile, creating a new shared library, or diagnosing a recurring container build failure.
- [Validation, References, and Principles](./validation-references-and-principles.md) — How to validate a Podman monorepo build locally and in CI, related references, and the principles and conventions this pattern implements. Use when verifying a container build with Podman before pushing, or when tracing this convention back to the principles and conventions it implements.

---
description: How to validate a Podman monorepo build locally and in CI, related references, and the principles and conventions this pattern implements.
when_to_use: Use when verifying a container build with Podman before pushing, or when tracing this convention back to the principles and conventions it implements.
---

# Validation, References, and Principles

## Validation

Verify that container builds work correctly with rootless Podman before pushing:

```bash
# Build the image natively from the repository root (the build context)
podman build --layers --format docker --file apps/<app>/Dockerfile --tag <app>:local .

# Build the Compose service locally
podman compose -f infra/dev/<app>/docker-compose.yml build

# Check that the build context resolves libs/ correctly
podman compose -f infra/dev/<app>/docker-compose.ci.yml config | grep context
```

The E2E CI workflow for each frontend app runs a full container build as part of its pipeline.
A green CI run on the app's E2E workflow confirms the container build and the injected libraries are
both working.

## References

**Related Development Standards:**

- [Nx Target Standards](../nx-targets.md) - Canonical target names and build dependency patterns
- [Vercel Deployment Convention](../vercel-deployment.md) - Related build context and dependency
  chain considerations

**Agents:**

- `rules-checker` - Can validate docker-compose context settings
- `repo-workflow-fixer` - Corrects docker-compose context misconfigurations

## Principles Implemented/Respected

This convention implements/respects the following core principles:

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**:
  Shared library source must be explicitly injected into `node_modules/` inside the container build
  stage. Relying on npm workspace symlink resolution inside containers is implicit and will fail. Every
  `COPY libs/...` line is a deliberate, visible declaration of the dependency.

- **[Reproducibility First](../../../principles/software-engineering/reproducibility.md)**:
  The container image build must produce the same result locally and in CI. Explicit `COPY` injection
  and repo-root build context ensure the build is deterministic regardless of environment.

- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**:
  The root cause of module-not-found errors in container builds is symlink resolution failure, not a missing
  package. This pattern fixes the root cause by injecting source directly rather than patching
  around broken symlinks with workarounds like `--legacy-peer-deps` or volume mounts.

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**:
  Checklists for adding new library dependencies and creating new shared libraries ensure that
  container build maintenance is systematic rather than ad hoc, reducing the chance of build failures
  discovered only in CI.

## Conventions Implemented/Respected

- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: Dockerfile and
  docker-compose filenames follow kebab-case consistent with repository naming conventions.
- **[Indentation Convention](../../../conventions/formatting/indentation.md)**: All YAML and
  Dockerfile examples in this document use 2-space indentation per the project standard.
- **[Content Quality Principles](../../../conventions/writing/quality.md)**: Documentation uses
  active voice, proper heading hierarchy, and code blocks with language specifiers throughout.

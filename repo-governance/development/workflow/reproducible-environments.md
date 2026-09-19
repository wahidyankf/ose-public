---
description: Practices for creating consistent, reproducible development and build environments
when_to_use: Use when setting up, documenting, or troubleshooting Node.js/npm pinning, lockfiles, container-based local services, or the shared cargo target-directory cache.
---

# Reproducible Environments

Practices for creating consistent, reproducible development and build environments. This document defines HOW to implement reproducibility across runtime versions, dependencies, configuration, and infrastructure.

## Contents

- [Principles, Conventions, and Overview](./reproducible-environments/principles-conventions-and-overview.md) — Why this practice exists, and the five areas it covers.
- [Runtime Version Management with Volta](./reproducible-environments/runtime-version-management-with-volta.md) — Pinning, installing, updating, and CI integration.
- [Dependency Locking](./reproducible-environments/dependency-locking.md) — `npm ci`, lockfile freshness, and PR review.
- [Shared Cargo Target Directories](./reproducible-environments/shared-cargo-target-directories.md) — The `doctor --fix` symlink cache and its pruning.
- [Containerization for Complex Environments](./reproducible-environments/containerization-for-complex-environments.md) — Docker Compose and a development Dockerfile.
- [Documentation](./reproducible-environments/documentation.md) — README setup-instruction and common-tasks templates.
- [Testing Reproducibility](./reproducible-environments/testing-reproducibility.md) — A CI-runnable environment-verification script.
- [Troubleshooting](./reproducible-environments/troubleshooting.md) — Common drift symptoms and a workspace-hoisting gotcha.
- [Migration Guide](./reproducible-environments/migration-guide.md) — Adding Volta or Docker to an existing project.
- [Git Identity Guardrail](./reproducible-environments/git-identity-guardrail.md) — No AI agent sets git identity; the human `includeIf` pattern and CI exemption.

## Related Documentation

- [Reproducibility First](../../principles/software-engineering/reproducibility.md) — WHY reproducibility matters.
- [Worktree Toolchain Initialization](../workflow/worktree-setup.md) — the `doctor -- --fix` invocation.
- [Native-First Toolchain Management](../workflow/native-first-toolchain.md) — native package managers over IaC tools.
- [Code Quality Convention](../quality/code.md) — automated quality in reproducible environments.
- [No Machine-Specific Information in Commits](../quality/no-machine-specific-commits.md) — no machine-specific paths/credentials.
- [Trunk Based Development](../workflow/trunk-based-development.md) — reproducible CI/CD for `main`.

## References

- **Version Management**: [Volta](https://volta.sh/), [volta-cli/action](https://github.com/volta-cli/action)
- **Dependency Management**: [npm ci](https://docs.npmjs.com/cli/v10/commands/npm-ci), [package-lock.json](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json)
- **Containerization**: [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/)
- **Build Reproducibility**: [Nx Caching](https://nx.dev/concepts/how-caching-works), [Reproducible Builds](https://reproducible-builds.org/)

## Environment Configuration

> **Stub.** The full env/secrets standards — naming convention, annotation format, `.env.example`
> layout, startup validation, `./rhino env` toolchain, and drift guard — live in
> [`secrets-and-env-standards.md`](../../conventions/security/secrets-and-env-standards.md).

### .env Files (summary)

**Pattern**: Committed template (`apps/<app>/.env.example`), gitignored real file (`.env.local`).

**Hard iron rule**: Real secret values never enter git. `.env.example` (committed template) contains
placeholders only. See:
[`secrets-and-env-standards.md` § 1](../../conventions/security/secrets-and-env-standards/hard-iron-rule-no-secrets-in-committed-files.md#hard-iron-rule--no-secrets-in-committed-files).

**Backup and restore**: Use `./rhino env backup / restore`. See:
[`secrets-and-env-standards.md` § 6](../../conventions/security/secrets-and-env-standards/Rhino-env-toolchain.md#Rhino-env-toolchain).

## Monorepo Considerations

### Nx Cache Configuration

**nx.json** (committed to git):

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  }
}
```

**Why this matters**:

- Nx caching is deterministic (same inputs = cache hit)
- Reproducible builds enable reliable caching
- Cache hits speed up CI/CD

### Workspace Dependencies

**Ensure consistent workspace configuration**:

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@open-sharia-enterprise/ts-validation": ["libs/ts-validation/src/index.ts"],
      "@open-sharia-enterprise/ts-auth": ["libs/ts-auth/src/index.ts"]
    }
  }
}
```

**Reproducibility benefit**:

- Path mappings explicit in tsconfig
- All developers resolve imports identically
- TypeScript compilation deterministic

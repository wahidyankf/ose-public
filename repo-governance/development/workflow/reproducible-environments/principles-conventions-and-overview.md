---
description: The principles and conventions reproducible environments respect, and the five-part overview of what reproducibility requires.
when_to_use: Use when tracing why reproducible-environment practices exist, or when orienting to the five areas this document covers.
---

# Principles, Conventions, and Overview

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Reproducibility First](../../../principles/software-engineering/reproducibility.md)**: All environment configuration is explicit, version-controlled, and reproducible. Eliminates "works on my machine" problems through deterministic setup.

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: Environment setup automated through version managers (Volta), lockfiles, scripts, and containers. Manual setup steps eliminated or documented.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Runtime versions pinned explicitly (package.json volta field). Dependencies locked with exact versions (package-lock.json). No implicit system dependencies.

- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**: Use simple, proven tools (Volta, npm lockfiles, Podman) instead of complex custom solutions. Minimum configuration for maximum reproducibility.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Code Quality Convention](../../quality/code.md)**: Reproducible environments enable consistent automated quality checks. Same Node.js/npm versions mean same Prettier, ESLint, and test results across machines.

- **[Trunk Based Development](../trunk-based-development.md)**: Reproducible CI/CD environments ensure consistent validation of commits to main branch. No environment-specific failures.

- **[No Secrets in Git Convention](../../../conventions/security/no-secrets-in-committed-files.md)**: The `.env.example` template carries placeholders only; real secret values stay in uncommitted `.env*` files, keeping secrets out of version control while configuration shape remains reproducible.

## Overview

Reproducible environments require:

1. **Runtime version management**: Volta for Node.js/npm pinning
2. **Dependency locking**: package-lock.json for deterministic installs
3. **Configuration management**: .env.example for required environment variables
4. **Container definitions**: Podman and `podman compose` (with the `podman-compose` provider) for complex setups
5. **Documentation**: Clear setup instructions for onboarding

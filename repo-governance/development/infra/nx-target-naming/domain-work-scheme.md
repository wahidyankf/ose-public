---
description: Derivation rule and the canonical target table for the `{domain}:{work}` naming scheme used by governance, validation, lint, and format Nx targets.
when_to_use: Use when naming a new governance, validation, lint, or format Nx target, or checking an existing `{domain}:{work}` target name against the canonical list.
---

# Scheme 2 — `{domain}:{work}` for Governance and Validation Targets

Governance, validation, lint, and format targets use `{domain}:{work}` where:

- **domain**: lowercase noun naming the subject or scope of the check (e.g., `compat`, `deps`).
- **work**: lowercase verb phrase naming the operation. Pure checks end in `-validation`.
  Bare operations use a single verb (`check`).

**Rule**: do not invent `validate:{thing}` prefixes. The old `validate:*` naming scheme was
retired in P10 (2026-06-12); any `validate:` target in `project.json` or a caller script
is a bug.

## Canonical Governance and Validation Targets

Behaviour coverage is project-local: every owner and dedicated E2E project exposes the applicable
static `test:coverage:*` targets instead of calling a central registry.

| Target               | Subject              | Operation                                               |
| -------------------- | -------------------- | ------------------------------------------------------- |
| `compat:min-version` | Project toolchain    | Verify the declared minimum supported toolchain version |
| `deps:audit`         | Project dependencies | Audit dependencies for known vulnerabilities            |

Repository-wide validators are not Nx targets: they run as pinned `./rhino` commands, declared as
registry gates in `repo-config.yml` where the lifecycle requires them. Formatting and the
file-type linters are registry gates too. See
[Markdown Quality Gates](../../quality/repository-validation/markdown-quality-gates.md) and the
[SDLC Gate Standard](../../../../docs/reference/sdlc-gate-standard.md).

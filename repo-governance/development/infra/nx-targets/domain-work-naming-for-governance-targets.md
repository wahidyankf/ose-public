---
description: Defines the {domain}:{work} naming scheme for governance, validation, lint, and format targets, with the canonical target list.
when_to_use: Use when adding a new governance or validation Nx target and deciding its key name.
---

# `{domain}:{work}` Naming for Governance and Validation Targets

Governance, validation, lint, and format targets use the `{domain}:{work}` scheme rather than the
`validate:*` prefix. The domain names the scope or subject of the check; the work names the
operation. This distinguishes governance targets from language-level lifecycle targets
(`test:quick`, `build`, etc.) and makes the Nx target list self-describing.

**Canonical governance and validation Nx targets** (project-local, declared in `project.json`):

| Target               | What it validates                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `compat:min-version` | The project's declared minimum supported toolchain version                                 |
| `deps:audit`         | The project's dependencies against the language's vulnerability audit (scheduled, no gate) |

**Repository-wide validators are not Nx targets.** Link, Mermaid, heading-hierarchy, vendor, word-budget,
adapter-parity, and env checks are `./rhino` commands. Those the lifecycle requires are registry
gates in `repo-config.yml` (list them with `./rhino gate list`); the rest run on demand. Commands and
gate ids live in [Markdown Quality Gates](../../quality/repository-validation/markdown-quality-gates.md)
and the [SDLC Gate Standard](../../../../docs/reference/sdlc-gate-standard.md).

**Rule**: governance/validation target keys are `{domain}:{work}` where both parts are lowercase
kebab-case. The domain must be a recognizable noun (the scope); the work must be a verb phrase
ending in `-validation` (for pure checks) or a bare verb (`check`). Do not invent `validate:*`
prefixes — use the canonical list above or follow the `{domain}:{work}` pattern.

Project-local static `test:coverage` and `test:coverage:*` belong to the testing lifecycle family,
not this governance target list.

See [nx-target-naming.md](../nx-target-naming.md) for the full derivation rule and examples.

---
description: Derivation rules for Nx target names, covering the {domain}:{work} scheme for governance and validation targets and the lifecycle naming scheme for build/test targets
when_to_use: Use when naming a new Nx target or Rhino subcommand, or deciding whether a check belongs in a staged-path registry gate.
---

# Nx Target Naming Convention

Defines how Nx target names are derived for all projects in the workspace. Two naming schemes
apply, depending on the target's purpose: the **lifecycle scheme** for build, test, and
runtime targets, and the **`{domain}:{work}` scheme** for governance, validation, lint, and
format targets.

## Documents

- [Principles, Conventions, and Lifecycle Targets](./nx-target-naming/principles-conventions-and-lifecycle-targets.md) — The engineering principles behind Nx target naming, the related Nx Target Standards convention, and the lifecycle naming scheme for build, test, and runtime targets. Use when naming a lifecycle target such as a build, test, dev, or start script, or when checking which principles and conventions this naming scheme implements.
- [Scheme 2 — `{domain}:{work}` for Governance and Validation Targets](./nx-target-naming/domain-work-scheme.md) — Derivation rule and the canonical target table for the `{domain}:{work}` naming scheme used by governance, validation, lint, and format Nx targets. Use when naming a new governance, validation, lint, or format Nx target, or checking an existing `{domain}:{work}` target name against the canonical list.
- [Derivation Examples and Anti-Patterns for the `{domain}:{work}` Scheme](./nx-target-naming/domain-work-scheme-examples-and-anti-patterns.md) — Worked derivation examples and forbidden-vs-correct anti-pattern pairs for the `{domain}:{work}` governance and validation Nx target naming scheme. Use when deriving a new `{domain}:{work}` target name from a subject and operation, or checking a proposed name against known anti-patterns.
- [Staged-Path Gate Membership Rule](./nx-target-naming/staged-path-gate-membership-rule.md) — The two-part criteria for whether a check belongs in a staged-path registry gate, the qualifying and non-qualifying check lists, resulting Nx target removals, and the public-safety carve-out. Use when deciding whether a new check belongs in a staged-path registry gate or should instead be a dedicated Nx target or repository-wide gate.
- [Enforcement](./nx-target-naming/enforcement.md) — How the retired `validate:*` naming scheme is caught by the plan delivery gate via a grep across project.json, hook, workflow, and package.json files. Use when checking how the old `validate:*` naming scheme is enforced, or writing a similar grep-based delivery gate.

**See also**: [Nx Target Standards](../infra/nx-targets.md) for the full required target set
per project type and caching rules, and [CI/CD Conventions](../infra/ci-conventions.md) for
the Invariant E description.

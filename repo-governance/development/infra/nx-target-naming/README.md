---
description: "Derivation rules for Nx target names, covering the {domain}:{work} scheme for governance and validation targets and the lifecycle naming scheme for build/test targets"
when_to_use: "Read this index to find the right Nx Target Naming Convention child document."
---

# Nx Target Naming Convention

- [Principles, Conventions, and Lifecycle Targets](./principles-conventions-and-lifecycle-targets.md) — The engineering principles behind Nx target naming, the related Nx Target Standards convention, and the lifecycle naming scheme for build, test, and runtime targets. Use when naming a lifecycle target such as a build, test, dev, or start script, or when checking which principles and conventions this naming scheme implements.
- [Scheme 2 — `{domain}:{work}` for Governance and Validation Targets](./domain-work-scheme.md) — Derivation rule and the canonical target table for the `{domain}:{work}` naming scheme used by governance, validation, lint, and format Nx targets. Use when naming a new governance, validation, lint, or format Nx target, or checking an existing `{domain}:{work}` target name against the canonical list.
- [Derivation Examples and Anti-Patterns for the `{domain}:{work}` Scheme](./domain-work-scheme-examples-and-anti-patterns.md) — Worked derivation examples and forbidden-vs-correct anti-pattern pairs for the `{domain}:{work}` governance and validation Nx target naming scheme. Use when deriving a new `{domain}:{work}` target name from a subject and operation, or checking a proposed name against known anti-patterns.
- [Lint-Staged Membership Rule](./lint-staged-membership-rule.md) — The two-part criteria for whether a check belongs in lint-staged, the qualifying and non-qualifying check lists, resulting Nx target removals, and the staged-guard carve-out. Use when deciding whether a new check belongs in lint-staged or should instead be a dedicated Nx target or hook step.
- [Enforcement](./enforcement.md) — How the retired `validate:*` naming scheme is caught by the plan delivery gate via a grep across project.json, hook, workflow, and package.json files. Use when checking how the old `validate:*` naming scheme is enforced, or writing a similar grep-based delivery gate.

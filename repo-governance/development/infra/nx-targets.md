---
description: Standardized Nx target definitions for apps and libs in the monorepo
when_to_use: Use when defining, naming, or auditing Nx targets in a project's project.json.
---

# Nx Target Standards

Standard Nx targets for apps and libs, and the naming rules that keep them consistent.

## Execution, Naming, and Foundations

- [Execution Model](./nx-targets/execution-model.md) — Pre-push/PR gate flow and CRON tiers. Use to trace execution order.
- [Principles and Conventions Implemented/Respected](./nx-targets/principles-and-conventions.md) — Principles the scheme implements. Use to cite a rule's rationale.
- [Canonical Target Reference (Lifecycle Targets)](./nx-targets/target-naming-canonical-names.md) — build–test:e2e reference table. Use before adding a lifecycle target.
- [Canonical Target Reference (E2E and Utility Targets)](./nx-targets/target-naming-canonical-names-e2e-and-utility.md) — test:e2e:ui–clean reference table. Use before adding an E2E/utility target.
- [Naming Rules](./nx-targets/target-naming-rules.md) — dev/start/test:\* naming rules. Use when naming a target.
- [`{domain}:{work}` Naming for Governance and Validation Targets](./nx-targets/domain-work-naming-for-governance-targets.md) — Naming scheme for governance targets. Use when adding one.
- [Formatting and File-Type Linting (Registry Gates, Not Nx Targets)](./nx-targets/formatting-and-file-type-linting.md) — Why these are staged-path gates, not targets. Use when adding a file check.

## Tag Convention

- [Tag Convention — Four-Dimension Scheme](./nx-targets/tag-convention-four-dimension-scheme.md) — Four tag dimensions and special rules. Use when tagging a new project.
- [Tag Convention — Tags, Examples, and Anti-Patterns](./nx-targets/tag-convention-current-tags-and-examples.md) — Per-project tags, examples, anti-patterns. Use to copy an existing tag set.

## Mandatory Targets by Project Type

- [Applicable Testing Targets — Summary Matrix](./nx-targets/mandatory-targets-summary-matrix.md) — Real targets by project role. Use for a quick applicability check.
- [Mandatory and Applicable Nx Targets](./nx-targets/mandatory-targets-all-projects-six-and-required.md) — Capability-based target rules. Use when scaffolding project.json.
- [Mandatory test:quick Composition and Gate Surfaces](./nx-targets/mandatory-targets-all-projects-quick-and-gate.md) — Static coverage and fast-runtime composition. Use when wiring test:quick.
- [Mandatory Targets — Type, Build, Server, and Unit-Test Requirements](./nx-targets/mandatory-targets-type-build-server-unit.md) — typecheck/build/dev/start/unit conditions. Use to check which apply.
- [Projects with Integration Tests](./nx-targets/mandatory-targets-integration-tests.md) — Isolated real local-resource boundaries with no external network reach. Use when writing test:integration.
- [Mandatory Targets — CLI and E2E Test Projects](./nx-targets/mandatory-targets-cli-e2e.md) — run/install and E2E-runner requirements. For CLI or \*-e2e projects.
- [Mandatory Static Behaviour Coverage](./nx-targets/mandatory-targets-behaviour-coverage.md) — Static corpus and adapter validation. Use when debugging coverage targets.
- [Accessibility Testing](./nx-targets/mandatory-targets-accessibility-testing.md) — Static a11y lint plus axe-core E2E. Use when adding a11y coverage.

## Caching, Build Output, and Codegen

- [Workspace Defaults, Caching, and Build Output](./nx-targets/workspace-defaults-caching-build-output.md) — targetDefaults, caching table, output dirs. Use when setting cache/output config.
- [Cache and Inputs Convention — Canonical Inputs](./nx-targets/cache-and-inputs-convention-canonical.md) — Why explicit inputs matter, per language. Use when declaring a target's inputs.
- [Codegen Dependency Chain](./nx-targets/codegen-dependency-chain.md) — codegen → typecheck/build dependsOn chain. Use when wiring contract codegen.

## Anti-Patterns and Traceability

- [Anti-Pattern — Echo and No-Op Test Targets](./nx-targets/anti-patterns-echo-placeholders.md) — Omit inapplicable boundaries. Use when a project lacks real Integration/E2E tests.
- [Target Anti-Patterns](./nx-targets/target-anti-patterns.md) — Catalog of target-definition mistakes. Use when reviewing a project.json.
- [Principles Traceability](./nx-targets/principles-traceability.md) — Maps decisions to principles. Use to cite a principle in a rationale.

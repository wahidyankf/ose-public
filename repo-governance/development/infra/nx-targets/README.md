---
description: "Standardized Nx target definitions for apps and libs in the monorepo"
when_to_use: "Read this index to find the right Nx Target Standards child document."
---

# Nx Target Standards

- [Execution Model](./execution-model.md) — Explains the mermaid-diagrammed pre-push/PR quality-gate flow and the scheduled/on-demand testing tiers that Nx targets execute.
- [Principles and Conventions Implemented/Respected](./principles-and-conventions.md) — Lists the software-engineering principles and repo conventions that the Nx target scheme implements.
- [Target Naming Standards — Canonical Target Reference (Lifecycle Targets)](./target-naming-canonical-names.md) — The canonical target-name reference table for the core lifecycle and quality-gate targets (build through test:e2e), with purpose and when-required columns.
- [Target Naming Standards — Canonical Target Reference (E2E and Utility Targets)](./target-naming-canonical-names-e2e-and-utility.md) — The canonical target-name reference table for the remaining targets — E2E UI/report variants, dev/start/run, and codegen/docs/install/clean — with purpose and when-required columns.
- [Naming Rules](./target-naming-rules.md) — The naming rules governing dev/start/test:\* target names and the colon-versus-hyphen separator convention.
- [`{domain}:{work}` Naming for Governance and Validation Targets](./domain-work-naming-for-governance-targets.md) — Defines the {domain}:{work} naming scheme for governance, validation, lint, and format targets, with the canonical target list.
- [Formatting and File-Type Linting (lint-staged, not Nx targets)](./formatting-and-file-type-linting.md) — Explains why formatting and several file-type lint checks run as lint-staged entries instead of Nx targets, with the glob-to-tool tables.
- [Tag Convention — Four-Dimension Scheme](./tag-convention-four-dimension-scheme.md) — Defines the four required project.json tag dimensions (type, platform, language, domain) and the special-case rules for Rust libs and tooling projects.
- [Tag Convention — Tags, Examples, and Anti-Patterns](./tag-convention-current-tags-and-examples.md) — The current per-project tag table, two worked tag-declaration examples, and the tag anti-patterns to avoid.
- [Mandatory Targets — Summary Matrix](./mandatory-targets-summary-matrix.md) — The per-project-type summary matrix of which mandatory targets are real versus echo, plus backend typecheck examples and CI schedules.
- [Mandatory and Applicable Nx Targets](./mandatory-targets-all-projects-six-and-required.md) — Real targets required by project role and boundary.
- [Mandatory Targets — test:quick Composition and Gate-Surface Rule](./mandatory-targets-all-projects-quick-and-gate.md) — The canonical five-step test:quick composition with a worked rhino-cli example, and the gate-surface / scheduled-tier rule.
- [Mandatory Targets — Type, Build, Server, and Unit-Test Requirements](./mandatory-targets-type-build-server-unit.md) — Requirements for typecheck on statically typed projects, build on compiled/bundled projects, dev/start on server apps, and test:unit.
- [Projects with Integration Tests](./mandatory-targets-integration-tests.md) — Applicability and
  runtime rules for deterministic local-resource tests, including the owned-loopback boundary and
  its `repo-config.yml` allowlist.
- [Mandatory Targets — CLI and E2E Test Projects](./mandatory-targets-cli-e2e.md) — The run/install targets required on CLI applications and the install/test:e2e/test:e2e:ui/test:e2e:report targets required on \*-e2e projects.
- [Mandatory Static Behaviour Coverage](./mandatory-targets-behaviour-coverage.md) — Canonical corpus, adapter, and exemption validation without test execution.
- [Accessibility Testing](./mandatory-targets-accessibility-testing.md) — The two-level accessibility testing requirement (static a11y linting and runtime axe-core E2E tests) for UI projects.
- [Workspace Defaults, Caching, and Build Output](./workspace-defaults-caching-build-output.md) — The nx.json targetDefaults block, the per-target caching-rules table, and the build output directory conventions.
- [Cache and Inputs Convention — Canonical Inputs](./cache-and-inputs-convention-canonical.md) — Why explicit inputs are required for correct cache invalidation, with canonical Rust/Go input examples for CLI apps and API backends.
- [Codegen Dependency Chain](./codegen-dependency-chain.md) — The codegen -> typecheck / codegen -> build dependency chain for apps with OpenAPI contract specs.
- [Anti-Pattern — Echo and No-Op Test Targets](./anti-patterns-echo-placeholders.md) — Omit inapplicable boundaries instead of claiming false proof.
- [Target Anti-Patterns](./target-anti-patterns.md) — The catalog of Nx target anti-patterns to avoid -- non-standard names, omitted mandatory targets, heavy test:quick, and more.
- [Principles Traceability](./principles-traceability.md) — Maps each major Nx target design decision to the software-engineering principle it implements.

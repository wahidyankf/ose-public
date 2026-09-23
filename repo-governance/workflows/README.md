---
description: Orchestrated multi-step processes that compose agents, procedures, and/or other workflows to achieve specific goals
when_to_use: Use when routing to the workflow that orchestrates a specific multi-step task, or when deciding whether a task should become a new workflow.
---

# Workflows Index

**Purpose**: Repeatable paths for multi-step work, with explicit goals, evidence, and stopping points.

**Layer**: 5th layer in the repository hierarchy. Workflows compose agents, tools, and other
workflows. See [Repository Governance Architecture](../repository-governance-architecture.md) for
the full model.

```
Layer 0: Vision (WHY WE EXIST)     → Foundational purpose
Layer 1: Principles (WHY)          → Foundational values
Layer 2: Conventions (WHAT)        → Documentation rules
Layer 3: Development (HOW)         → Software practices
Layer 4: AI Agents (WHO)           → Atomic task executors
Layer 5: Workflows (WHEN)          → Multi-step processes ← YOU ARE HERE
```

## Using Workflows

```
User: "Run [workflow-name] workflow for [scope] in [mode] mode"
```

Workflows support two execution modes and standard inputs (`mode`, `max-concurrency`,
`min-iterations`/`max-iterations`). See Workflow Meta Documentation below for details.

## Workflow Directories

- [Dev Artifact Clean-Up](./dev-artifact-clean-up.md) — Sequences a repository's teardown:
  pre-removal checks, dev containers, worktree, branches, build output, then the `main` reconcile.
  Use when a plan has finished with a repository worktree and its artifacts must come down.
- [Gherkin Implementation Review](./gherkin-implementation-review.md) — Semantically inspects every
  applicable scenario adapter for real production invocation and independent evidence; static
  binding counts cannot replace it.
- [API Workflows](api/README.md) — Orchestrated processes for live REST and GraphQL API quality validation and remediation. Use when routing to a workflow that exercises a running REST or GraphQL API against its contract and specs.
- [AyoKoding Web Workflows](ayokoding-web/README.md) — Workflows for keeping AyoKoding learning content accurate, useful, and well structured. Use when routing to a workflow that validates a specific AyoKoding tutorial type's quality.
- [CI Workflows](ci/README.md) — Workflows for checking that repository CI setup follows its documented standards. Use when routing to a workflow that validates or fixes CI/CD standards compliance.
- [Content Workflows](content/README.md) — Workflows for creating, converting, and validating content in various formats. Use when routing to a workflow that converts a source document to Markdown or validates conversion fidelity.
- [Dependency Workflows](dependencies/README.md) — Workflows for dependency inventory, security and compatibility clearance, and upgrade planning. Use when routing to a workflow that surveys or plans dependency changes across the monorepo.
- [Documentation Workflows](docs/README.md) — Workflows for keeping reader-facing documentation true, reachable, and readable, and for auditing it on request. Use when routing to the workflow that carries a change into the documents it affects, audits documentation, or validates style-guide separation.
- [Harness Workflows](harness/README.md) — Workflows for coding-agent harness compatibility, binding parity, and upstream conformance. Use when routing to a workflow that validates coding-agent bindings or current harness conventions.
- [Infrastructure Workflows](infra/README.md) — Workflows for development environment and infrastructure setup. Use when routing to a workflow that sets up or verifies a development environment's toolchains.
- [Workflow Meta Documentation](meta/README.md) — Reference material for designing workflows that are understandable and reusable. Use when routing to reference material about how workflows are structured or executed.
- [Plan Workflows](plan/README.md) — Orchestrated workflows for plan creation, quality validation, and execution — from idea to archived delivery. Use when routing to a workflow that authors, validates, executes, or takes over a project plan.
- [PR Review Workflows](pr/README.md) — One mandatory focused leak review plus optional semantic review workflows. Route ordinary PRs to `pr-leak-review`; use `pr-review` or `pr-review-cycle` only after an explicit user request.
- [Rules Workflows](rules/README.md) — Orchestrated workflows for propagating and validating repository rules. Use when routing newly decided rules or running repository-wide rule validation.
- [Specs Workflows](specs/README.md) — Workflows for checking that specifications remain coherent, complete, and actionable. Use when routing to a workflow that validates specs/ structural completeness, accuracy, or cross-spec coherence.
- [UI Workflows](ui/README.md) — Orchestrated processes for UI component quality validation and remediation. Use when routing to a workflow that audits or fixes UI component quality.
- [Web Workflows](web/README.md) — Orchestrated workflows that test a live running website and turn the findings into a fix plan. Use when routing to a workflow that tests a live running site and turns findings into a fix plan.

All `*-quality-gate` workflows except the
[governance gates](meta/workflow-identifier/governance-gate-class.md) follow the check-fix pattern
and its
[lifecycle validation ownership](meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md)
Step 0, which delegates registry-owned checks before domain validation.

## Naming

Workflow filenames use lowercase kebab-case, per
[File Naming](../conventions/structure/file-naming.md). The suffix table is descriptive, not
mandatory. The former type-suffix rule and validator were withdrawn — see
[Withdrawn Rules](../conventions/structure/file-naming.md#withdrawn-rules). Unlisted workflow
shapes need neither new tokens nor exceptions.

| Type           | Semantics                                                                                       | Example                         |
| -------------- | ----------------------------------------------------------------------------------------------- | ------------------------------- |
| `quality-gate` | Iterative maker → checker → fixer loop until zero findings                                      | `ci-quality-gate`               |
| `execution`    | Executes a defined procedure or plan against inputs                                             | `plan-execution`                |
| `setup`        | One-time environment or resource provisioning                                                   | `development-environment-setup` |
| `planning`     | Surveys/analyzes state and produces a plan as its terminal deliverable                          | `dependency-bump-planning`      |
| `grooming`     | Recurring sweep/reorganization over existing state; no zero-findings convergence or plan output | `plan-ideas-grooming`           |

**Workflow vs Plans**: a plan is strategic (WHAT to build), free-form, human-authored, and archived once delivered; a workflow is tactical (HOW to build), structured Markdown with YAML, and executed repeatedly. Plans can reference workflows; workflows can be generated from plan checklists.

## Related Documentation

- [Workflow Meta Documentation](meta/README.md) — How workflows are structured and executed
- [Maker-Checker-Fixer Pattern](../development/pattern/maker-checker-fixer.md) — Core workflow pattern
- [Plans Organization](../conventions/structure/plans.md) — How plans relate to workflows
- [Repository Governance Architecture](../repository-governance-architecture.md) — Complete six-layer model

---
description: Orchestrated multi-step processes that compose agents, procedures, and/or other workflows to achieve specific goals
when_to_use: Use when routing to the workflow that orchestrates a specific multi-step task, or when deciding whether a task should become a new workflow.
---

# Workflows Index

**Purpose**: Repeatable paths for multi-step work, with explicit goals, evidence, and stopping points.

**Layer**: 5th layer in the repository hierarchy. Workflows compose agents, tools, and other
workflows. See [Repository Governance Architecture](../repository-governance-architecture.md) for
the full model.

```text
Layer 0: Vision (WHY WE EXIST)     → Foundational purpose
Layer 1: Principles (WHY)          → Foundational values
Layer 2: Conventions (WHAT)        → Documentation rules
Layer 3: Development (HOW)         → Software practices
Layer 4: AI Agents (WHO)           → Atomic task executors
Layer 5: Workflows (WHEN)          → Multi-step processes ← YOU ARE HERE
```

## Using Workflows

```text
User: "Run [workflow-name] workflow for [scope] in [mode] mode"
```

A workflow starts only on an explicit request or from a caller its own text lists. Every quality gate takes the inputs
`subject`, `mode` (`lax`, `normal`, `strict`, `all`; default `normal`), and `max-cycles` (1–3; default 3), per the
[Quality Gate Contract](../development/workflow/quality-gate-contract.md).

## Workflow Groups

This directory holds only this index and three groups, per the
[Workflow Pattern Convention](../conventions/structure/workflow-pattern.md#layout):

- [Plan Workflows](plan/README.md) — The plan lifecycle: planning, parity planning, execution, execution checks,
  grooming, and handover. Use when routing to a workflow that authors, executes, or takes over a project plan.
- [Quality Workflows](quality/README.md) — Every bounded, advisory quality gate with the one propagation that writes for
  its family, plus the single-pass reviews. Use when a review, a quality gate, or its propagation applies.
- [Maintenance Workflows](maintenance/README.md) — Upkeep and delivery: clean-up, dependency bump planning, environment
  set-up, rules grooming, and the AyoKoding benchmark refresh. Use when routing to recurring upkeep work.

## Naming

Workflow filenames use lowercase kebab-case, per [File Naming](../conventions/structure/file-naming.md). A gate is
`<family>-quality-gate.md`, its writer `<family>-propagation.md`, and its agents `<family>-checker` and
`<family>-fixer`. A split workflow keeps `NNN-<topic>.md` modules in a sibling folder of the same name.

| Type           | Semantics                                                                                      | Example                         |
| -------------- | ---------------------------------------------------------------------------------------------- | ------------------------------- |
| `quality-gate` | Read-only audit, frozen ledger, one propagation writer, at most three cycles, advisory verdict | `ci-quality-gate`               |
| `propagation`  | The sole writer that repairs a frozen ledger's rows for one gate family                        | `ci-propagation`                |
| `execution`    | Executes a defined procedure or plan against inputs                                            | `plan-execution`                |
| `setup`        | One-time environment or resource provisioning                                                  | `development-environment-setup` |
| `planning`     | Surveys/analyzes state and produces a plan as its terminal deliverable                         | `dependency-bump-planning`      |
| `grooming`     | Recurring sweep/reorganization over existing state; produces no verdict and no plan            | `plan-ideas-grooming`           |

**Workflow vs Plans**: a plan is strategic (WHAT to build), free-form, human-authored, and archived once delivered; a
workflow is tactical (HOW to build), structured Markdown with YAML, and executed repeatedly. Plans can reference
workflows; workflows can be generated from plan checklists.

## Related Documentation

- [Workflow Pattern Convention](../conventions/structure/workflow-pattern.md) — How workflows are structured and executed
- [Quality Gate Contract](../development/workflow/quality-gate-contract.md) — The contract every quality gate follows
- [Maker-Checker-Fixer Pattern](../development/pattern/maker-checker-fixer.md) — Core workflow pattern
- [Plans Organization](../conventions/structure/plans.md) — How plans relate to workflows
- [Repository Governance Architecture](../repository-governance-architecture.md) — Complete six-layer model

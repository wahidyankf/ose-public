---
description: Standards for creating orchestrated multi-step processes that compose agents, procedures, and/or other workflows
when_to_use: Use when defining, structuring, or validating a new workflow document, or when deciding whether a task should become a workflow at all.
---

# Workflow Pattern Convention

Workflows are **composed multi-step processes** that orchestrate agents, procedures, and/or
other workflows to achieve specific goals with clear termination criteria — the fifth layer in
the repository's governance hierarchy. Covers what workflows are (and aren't), the frontmatter
and body structure, step execution patterns, state/error handling, composability, and where
workflows live.

## Contents

- [Repository Hierarchy](./workflow-pattern/repository-hierarchy.md) — where workflows sit.
- [What Workflows Are](./workflow-pattern/what-workflows-are.md) — the seven properties.
- [What Workflows Are NOT](./workflow-pattern/what-workflows-are-not.md) — boundary cases.
- [When to Create a Workflow](./workflow-pattern/when-to-create-a-workflow.md) — the signals.
- [Workflow Structure](./workflow-pattern/workflow-structure.md) — the frontmatter/body template.
- [YAML Syntax Requirements](./workflow-pattern/yaml-syntax-requirements.md) — quoting rules.
- [File Naming Convention](./workflow-pattern/file-naming-convention.md) — plain kebab-case.
- [Step Execution Patterns](./workflow-pattern/step-execution-patterns.md) — sequential/parallel/conditional.
- [State Management](./workflow-pattern/state-management.md) — passing data between steps.
- [Human Checkpoints](./workflow-pattern/human-checkpoints.md) — pausing for approval.
- [Error Handling](./workflow-pattern/error-handling.md) — per-step failure behaviour.
- [Validation](./workflow-pattern/validation.md) — pre-execution checks.
- [Relationship to Other Layers](./workflow-pattern/relationship-to-other-layers.md) — principles through plans.
- [Composability](./workflow-pattern/composability.md) — nesting workflows/agents/procedures.
- [Quality Gate Contract](../../development/workflow/quality-gate-contract.md) — every `*-quality-gate` and its
  `*-propagation` writer.
- [Execution Modes](./workflow-pattern/execution-modes.md) — agent delegation versus manual orchestration.
- [Documentation Requirements](./workflow-pattern/documentation-requirements.md) — the required sections.
- [Future Enhancements](./workflow-pattern/future-enhancements.md) — not-yet-implemented features.
- [Token Budget Philosophy](./workflow-pattern/token-budget-philosophy.md) — don't economize tokens.
- [Principles Implemented/Respected](./workflow-pattern/principles-implemented-respected.md) — traceability.
- [Conventions Implemented/Respected](./workflow-pattern/conventions-implemented-respected.md) — traceability.

## Layout

`repo-governance/workflows/` holds only `README.md` and the groups `plan/` (the plan lifecycle), `quality/` (every
quality gate with its propagation, and every single-pass review), and `maintenance/` (upkeep, set-up, release, and
grooming). A group exists only while it holds a workflow. A workflow is one file unless its entrypoint would exceed the
word budget; a split workflow keeps its modules in a sibling `<name>/` folder holding a listing `README.md` and
`NNN-<topic>.md` modules numbered in reading order from `001`. A split workflow whose entrypoint and modules fit the
budget together merges back into one file. Every quality gate follows the
[Quality Gate Contract](../../development/workflow/quality-gate-contract.md): a read-only checker, a frozen ledger, one
`<family>-propagation` writer run by `<family>-fixer`, at most three cycles, and an advisory verdict.

## Overview

Workflows are **composed multi-step processes** that orchestrate agents, procedures, and/or other workflows to achieve specific goals with clear termination criteria. They represent the fifth layer in the repository's governance hierarchy, sitting above individual agents to coordinate complex tasks.

## Related Documentation

- [AI Agents Convention](../../development/agents/ai-agents.md) - How agents work
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core workflow pattern
- [Plans Organization](plans.md) - How plans relate to workflows
- [Implementation Workflow](../../development/workflow/implementation.md) - Development process workflow
- [Workflows Index](../../workflows/README.md) - All available workflows

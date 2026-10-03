---
description: "Standards for selecting the appropriate model grade (ultra, planning-grade, execution-grade, fast) for AI agents based on task complexity"
when_to_use: Use when deciding which model tier a new or existing agent should declare, or translating a tier to a concrete model ID.
---

# AI Agent Model Selection Convention

This document defines the standards for selecting the appropriate model tier when creating or updating AI agents. The governing principle is **match model capability to task complexity** -- use the most capable model only when the task demands it, and use lighter models for structured or mechanical work.

## Foundations

- [Principles Implemented/Respected](./model-selection/principles-implemented-respected.md) — principle list.

## Model Tiers

Four grades, cheapest first: **fast**, **execution-grade**, **planning-grade**, **ultra**.

A canonical agent names a `tier`, never a model. The Tier Registry, the `tiers` map of each
`harness.profiles[]` entry in `repo-config.yml`, maps each tier per harness.

- [Ultra](./model-selection/model-tiers-ultra.md) — `ultra`, unpinned; defined, currently unpopulated.
- [Planning-Grade](./model-selection/model-tiers-planning-grade.md) — `plan`, unpinned.
- [Execution-Grade](./model-selection/model-tiers-execution-grade.md) — `execution`, `sonnet` in `.claude/agents/`.
- [Fast](./model-selection/model-tiers-fast.md) — `fast`, `haiku` in `.claude/agents/`, the newest luna model on Codex.
- [Model Selection Decision Tree](./model-selection/model-selection-decision-tree.md) — the decision tree.
- [Justification Requirement](./model-selection/justification-requirement.md) — the required block.

## Comparisons and Mistakes

- [Tier Comparison Summary](./model-selection/tier-comparison-summary.md) — side-by-side table.
- [Common Mistakes](./model-selection/common-mistakes.md) — mistakes to avoid.
- [Current Model Versions (September 2026)](./model-selection/current-model-versions.md) — version strings.

## Platform Bindings and Special Cases

- [Platform Binding Examples](./model-selection/platform-binding-examples.md) — per-harness grade-to-model-ID mappings.
- [Special Considerations — Borderline Cases and Tier Assignments](./model-selection/special-considerations-borderline-and-tier-cases.md) — edge cases.
- [Special Considerations — Link Fixer as Fast-Tier](./model-selection/special-considerations-link-fixer.md) — link-fixer case.
- [Tools and Automation](./model-selection/tools-and-automation.md) — validation tools.
- [References](./model-selection/references.md) — further reading.

## Conventions Implemented/Respected

This practice respects the following conventions:

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Agent frontmatter and model justification comments follow active voice and clarity standards.

## Purpose

Model selection directly affects agent quality, latency, and resource efficiency. Selecting too powerful a model wastes resources on simple tasks; selecting too weak a model produces poor results on complex work. This convention establishes clear criteria for matching model grades to task types, ensuring consistent and justified model assignments across all agents and across every harness binding.

## Scope

### What This Convention Covers

- Model grade definitions and their cognitive capabilities
- Decision criteria for selecting each grade
- Task-to-grade mapping with concrete examples
- Per-harness translation of a grade to a concrete model ID
- Justification requirements for model selection

### What This Convention Does NOT Cover

- Tool permission selection (see [AI Agents Convention](./ai-agents.md))
- Agent color categorization (see [AI Agents Convention](./ai-agents.md))
- Agent naming and file structure (see [AI Agents Convention](./ai-agents.md))
- Workflow orchestration (see [Agent Workflow Orchestration](./agent-workflow-orchestration.md))

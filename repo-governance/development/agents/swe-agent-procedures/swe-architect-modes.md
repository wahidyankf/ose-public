---
description: >-
  Holds the Design steps and Lens mode detail of the swe-architect agent, moved verbatim from its adopted definition
  so the definition fits its word budget.
when_to_use: >-
  Use when swe-architect runs Design or Lens mode and its definition points here.
---

# SWE Architect Modes

Moved verbatim from [swe-architect](../../../../.agents/agents/swe-architect.md), which links each section here, per
[Governance Word-Budget Remediation](../../../conventions/structure/governance-word-budget-remediation.md).

## Design

1. Read the requirement, the affected modules, and the recorded decisions, and place each new piece by what it decides
   or does, as [Developing Applications](../../../../.agents/skills/developing-applications/SKILL.md) teaches.
2. Name the assets, trust boundaries, and entry points the design creates or changes, and the threats each choice opens
   or closes, as [Modeling Threats](../../../../.agents/skills/modeling-threats/SKILL.md) teaches.
3. Where the design changes a stored schema or a migration, load
   [Evolving Database Schemas](../../../../.agents/skills/evolving-database-schemas/SKILL.md) on demand and state the expand, migrate,
   verify, and contract steps.
4. Return the decisions, the boundaries, and the deterministic tests the work must add: each a failing test, a lint or
   type rule, an end-to-end assertion, or a threshold a command checks. A design whose success no command can check is
   not finished.
5. Write one decision record when the choice meets the test in
   [Architecture Decision Records](https://github.com/wahidyankf/ose-rules/blob/18760a44f7ae4d88e89c0aa79349297f55bb9d9c/repo-governance/conventions/writing/repository-documentation-files/003-architecture-decision-records.md),
   at the location below, with the threat notes beside it.

## Lens

Beyond the shared list in
[Cost and Noise Controls](https://github.com/wahidyankf/ose-rules/blob/18760a44f7ae4d88e89c0aa79349297f55bb9d9c/repo-governance/development/agents/review-disciplines/004-cost-and-noise-controls.md),
it never raises a structural preference with no consequence for blast radius, reversibility, or a quality attribute; an
alternative design for scope the change does not touch; further isolation of a boundary already contained; or a tradeoff
the change's plan or decision record ratified, unless it is practically irreversible, which is raised at `HIGH`.

[Criticality Levels](../../quality/criticality-levels.md)
decides every level: `CRITICAL` for broken containment of a live system, `HIGH` for a practically irreversible decision
or an unrecorded new tradeoff or dependency, `MEDIUM` for a real but bounded blast radius, and `LOW` for a boundary that
makes a foreseeable change costlier. It reads the brief and the linked plan before the pinned diff, per
[PR Review](../../../workflows/quality/pr-review.md), judges each candidate with
[Producing Review Findings](../../../../.agents/skills/producing-review-findings/SKILL.md), gives each finding what
[Finding Requirements](https://github.com/wahidyankf/ose-rules/blob/18760a44f7ae4d88e89c0aa79349297f55bb9d9c/repo-governance/development/agents/review-disciplines/003-finding-requirements.md) lists,
and returns them to the coordinator. In this mode it writes nothing.

---
description: Validates all projects conform to CI/CD standards and iteratively fixes non-compliance until zero findings are confirmed twice.
when_to_use: Use after adding a new app, modifying CI/CD infrastructure, as a periodic compliance check, or before major releases.
---

# CI Quality Gate Workflow

**Purpose**: Automatically validate all projects in the repository conform to CI/CD standards
defined in `repo-governance/development/infra/ci-conventions.md`, then iteratively fix non-compliance
until zero findings are achieved.

## Goal and Termination

**Goal**: Validate all projects conform to CI/CD standards and fix non-compliance iteratively

**Termination**: Zero findings on two consecutive validations (max-iterations defaults to 7, escalation warning at 5)

## Inputs

- **`scope`** (string, optional, default `all`) — Scope of validation - "all" for all projects, or specific project name
- **`mode`** (enum: lax, normal, strict, ocd, optional, default `strict`) — Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)
- **`max-iterations`** (number, optional, default `7`) — Maximum number of check-fix cycles

## Outputs

- **`final-status`** (enum: pass, partial, fail) — Final validation status
- **`lifecycle-status`** (enum: verified, pending, not-applicable) — Lifecycle evidence state, separate from final-status
- **`iterations-completed`** (number) — Number of check-fix cycles performed
- **`final-report`** (file, pattern `local-tmp/ci/ci__*__audit.md`) — Final audit report from ci-checker

## Contents

- [Lifecycle validation ownership](../meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md) — shared Step 0.
- [Steps](./ci-quality-gate/steps.md) — the five-step check-fix-recheck loop.

## Agents

- [ci-checker](../../../.agents/agents/ci-checker.md) — validates all projects against CI/CD standards
- [ci-fixer](../../../.agents/agents/ci-fixer.md) — applies validated CI/CD compliance fixes

## Conventions Implemented/Respected

- **[CI/CD Conventions](../../development/infra/ci-conventions.md)**: The standards being validated
- **[Workflow Identifier Convention](../meta/workflow-identifier.md)**: Follows standard workflow structure

## Related Workflows

- [Plan Execution](../plan/plan-execution.md) -- Uses similar iterative check-fix pattern
- [Plan Quality Gate](../plan/plan-quality-gate.md) -- Analogous quality gate for plans

## When to Use

- After adding a new app to the repository
- After modifying CI/CD infrastructure (workflows, composite actions, Docker files)
- As a periodic compliance check
- Before major releases to ensure CI consistency

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `ci-checker` and `ci-fixer` via the Agent tool
with `subagent_type` (see [Workflow Execution Modes Convention](../meta/execution-modes.md)).

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using
Read/Write/Edit tools when Agent Delegation is unavailable.

## Principles Implemented/Respected

- **Explicit Over Implicit**: All CI standards are documented in governance docs, not implicit conventions
- **Automation Over Manual**: Automated checking and fixing reduces manual compliance burden
- **Simplicity Over Complexity**: Simple iterative check-fix loop with bounded iterations

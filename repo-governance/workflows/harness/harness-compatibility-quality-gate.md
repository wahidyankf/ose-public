---
description: "Validates internal cross-vendor parity and external harness-conformance drift, then fixes iteratively until zero findings."
when_to_use: "Use after modifying agents, governance prose, or binding-sync logic; after a harness breaking change; or as a scheduled hygiene audit."
---

# Repository Harness Compatibility Quality Gate Workflow

**Purpose**: Validate two dimensions of binding-file health, then fix iteratively until zero
findings: **internal cross-vendor parity** (five deterministic invariants keeping `.claude/` and
its generated mirrors consistent) and **external harness conformance** (web-research-backed checks that
the platform-bindings catalog and binding files match each harness's upstream conventions).

**Distinct from the pre-push guard**: `harness bindings validate` checks byte-drift; this
workflow's Phase 0 checks parity semantically, Phase 1 checks drift via web research.

**When to use**: after modifying agents/governance prose/binding-sync logic, after a harness
breaking change, as a scheduled hygiene audit, or when onboarding a new harness.

## Goal and Termination

**Goal**: Validate internal cross-vendor parity invariants and external harness-conformance drift, then fix iteratively until zero findings achieved

**Termination**: Zero findings on two consecutive validations (max-iterations defaults to 7, escalation warning at 5)

## Inputs

- **`scope`** (string, optional, default `all`) — Subset of harnesses to validate: "all", or one of "claude-code", "opencode", "codex".
- **`mode`** (enum: lax, normal, strict, ocd, optional, default `strict`) — Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)
- **`min-iterations`** (number, optional) — Minimum check-fix cycles before allowing zero-finding termination
- **`max-iterations`** (number, optional, default `7`) — Maximum check-fix cycles to prevent infinite loops
- **`max-concurrency`** (number, optional, default `3`) — N+1 background-agent cap. Raise only for independent work with capacity and budget; lower under pressure; never self-promote.

## Outputs

- **`final-status`** (enum: pass, partial, fail) — Final validation status
- **`lifecycle-status`** (enum: verified, pending, not-applicable) — Lifecycle evidence state, separate from final-status
- **`iterations-completed`** (number) — Number of check-fix cycles executed
- **`final-report`** (file, pattern `local-tmp/harness-compat/harness-compat__*__*__audit.md`) — Final audit report (4-part format with UUID chain)

## Contents

- [Lifecycle validation ownership](../meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md) — shared Step 0.
- [Execution Mode](./harness-compatibility-quality-gate/execution-mode.md) — invocation.
- [Complementary Anti-Drift Gates](./harness-compatibility-quality-gate/complementary-anti-drift-gates.md) — gates vs. workflow.
- [Research Delegation](./harness-compatibility-quality-gate/research-delegation.md) — web-researcher use.
- [Step 1: Initial Validation](./harness-compatibility-quality-gate/step-1-initial-validation.md) — Phase 0/1 checks.
- [Step 2: Check for Findings](./harness-compatibility-quality-gate/step-2-check-for-findings.md) — threshold counting.
- [Step 3: Apply Fixes](./harness-compatibility-quality-gate/step-3-apply-fixes.md) — auto vs. human scope.
- [Step 4: Re-Validate](./harness-compatibility-quality-gate/step-4-re-validate.md) — confirms fixes.
- [Step 5: Iteration Control](./harness-compatibility-quality-gate/step-5-iteration-control.md) — loop logic.
- [Step 6: Finalization](./harness-compatibility-quality-gate/step-6-finalization.md) — status reporting.
- [Termination Criteria](./harness-compatibility-quality-gate/termination-criteria.md) — pass/partial/fail.
- [Success Criteria — Part 1](./harness-compatibility-quality-gate/success-criteria-gherkin.md) — Phase 0/1, sync fix.
- [Success Criteria — Part 2](./harness-compatibility-quality-gate/success-criteria-gherkin-escalation-scenarios.md) — escalation, budget.
- [Example Usage](./harness-compatibility-quality-gate/example-usage.md) — invocation examples.
- [Iteration Example](./harness-compatibility-quality-gate/iteration-example.md) — worked traces.
- [Safety Features](./harness-compatibility-quality-gate/safety-features.md) — loop and fix safeguards.
- [Related Workflows](./harness-compatibility-quality-gate/related-workflows.md) — Repository Rules Validation.
- [Notes](./harness-compatibility-quality-gate/notes.md) — cadence, guard distinction.
- [Principles Implemented/Respected](./harness-compatibility-quality-gate/principles-implemented-respected.md) — traceability.
- [Conventions Implemented/Respected](./harness-compatibility-quality-gate/conventions-implemented-respected.md) — traceability.
- [Agents](./harness-compatibility-quality-gate/agents.md) — checker and fixer definitions.

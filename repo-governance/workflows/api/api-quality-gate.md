---
description: Exercises a running REST or GraphQL API through one discovery pass, an optional fix pass, and one scoped live verification.
when_to_use: Use when a plan ships an API/backend surface needing contract, functional, and security validation against a live deployment.
---

# API Quality Gate Workflow

**Purpose**: Use
[`api-exploratory-tester`](../../../.agents/agents/api-exploratory-tester.md) to exercise a
**running** REST or GraphQL API against its contract and `specs/**` Gherkin, apply at most one fix,
rebuild/redeploy once, then verify original findings and affected behaviour.

This gate is the API counterpart of the [UI Quality Gate](../ui/ui-quality-gate.md): the UI gate
checks component source, while this gate uses tester-driven evidence from actual HTTP responses.

## Goal and Termination

**Goal**: Validate a live API against its contract and Gherkin specs, apply one bounded fix pass, and verify original findings without regressions

**Termination**: Pass after a clean discovery or successful scoped verification; partial for unresolved findings or regressions; fail for technical, contract-resolution, or deployment errors

## Inputs

- **`scope`** (string, required) — Base URL or endpoint set to exercise, plus the contract to test against (e.g., "http://localhost:8302 with apps/ose-be/openapi.yaml")
- **`mode`** (enum: lax, normal, strict, ocd, optional, default `strict`) — Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)
- **`max-concurrency`** (number, optional, default `3`) — N+1 background-agent cap. Raise only for independent work with capacity and budget; lower under pressure; never self-promote.

## Outputs

- **`final-status`** (enum: pass, partial, fail) — Final validation status
- **`lifecycle-status`** (enum: verified, pending, not-applicable) — Lifecycle evidence state, separate from final-status
- **`final-report`** (file, pattern `the destination selected by the tester's output-mode: the plan folder (plan), the plan's delivery.md (delivery), or local-tmp/<slug>/findings.md (local-tmp)`) — Final findings record, written wherever the invoked output-mode directs

## Contents

- [Lifecycle validation ownership](../meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md) — shared Step 0.
- [Shape: Tester-Driven, Not Checker/Fixer](./api-quality-gate/shape-tester-driven-not-checker-fixer.md) — no checker/fixer pair; the bounded run and its agents.
- [Execution Mode](./api-quality-gate/execution-mode.md) — preferred/fallback execution, how to invoke.
- [Preconditions](./api-quality-gate/preconditions.md) — reachability, contract, non-destructive scope.
- [Step 1: Discovery](./api-quality-gate/step-1-discovery.md) — invoke the tester for one full API sweep.
- [Step 2: Triage Against Mode](./api-quality-gate/step-2-triage-against-mode.md) — severity-to-threshold mapping.
- [Step 3: Fix](./api-quality-gate/step-3-fix.md) — route findings to the matching `swe-*-dev` agent.
- [Step 4: Verification](./api-quality-gate/step-4-verification.md) — rebuild and redeploy once, then verify original findings and affected behaviour.
- [Step 5: Finalization](./api-quality-gate/step-5-finalization.md) — pass, partial, fail, and lifecycle outcomes.
- [Success Criteria](./api-quality-gate/success-criteria.md) — clean-discovery, verified-fix,
  partial, and lifecycle scenarios.
- [Relationship to Other Gates](./api-quality-gate/relationship-to-other-gates.md) — surface-conditional applicability, merge precondition.
- [Related Documentation](./api-quality-gate/related-documentation.md) — links to the workflows index, related conventions.

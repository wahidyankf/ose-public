---
description: "Validates separation between OSE Platform style guides and AyoKoding educational content, then fixes violations iteratively."
when_to_use: "Use after adding/updating prerequisite relationships or style-guide/AyoKoding content, or periodically for compliance."
---

# Software Engineering Documentation Separation Quality Gate Workflow

**Purpose**: Automatically validate separation between OSE Platform style guides
(docs/explanation/software-engineering/) and AyoKoding educational content (apps/ayokoding-www/),
then apply fixes iteratively until all separation violations are resolved.

**IMPORTANT — Validation Scope**: this workflow validates **ONLY** explicit relationships listed
in the Software Design Reference prerequisite table (currently Java, Golang, Elixir, JVM Spring,
JVM Spring Boot). Languages/frameworks not in that table (TypeScript, Python, etc.) are skipped,
enabling incremental migration.

**When to use**: after adding prerequisite relationships to the Software Design Reference, after
updating style guide or AyoKoding content, before major releases, or periodically for compliance.

## Goal and Termination

**Goal**: Validate software engineering documentation separation between OSE Platform style guides and AyoKoding educational content, apply fixes iteratively until zero findings achieved

**Termination**: Zero findings on two consecutive validations (max-iterations defaults to 7, escalation warning at 5)

## Inputs

- **`scope`** (string, optional, default `all`) — Documentation scope to validate (e.g., "all", "programming-languages/java", "platform-web/tools/jvm-spring")
- **`mode`** (enum: lax, normal, strict, ocd, optional, default `strict`) — Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)
- **`min-iterations`** (number, optional) — Minimum check-fix cycles before allowing zero-finding termination (prevents premature success)
- **`max-iterations`** (number, optional, default `7`) — Maximum check-fix cycles to prevent infinite loops
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the N in the N+1 model (1 main thread + N background agents = N+1 total). Raise only when independent work, machine capacity, and budget headroom all allow; lower under budget, runner, or disk pressure. Never self-promoted beyond the declared value.

## Outputs

- **`final-status`** (enum: pass, partial, fail) — Final validation status
- **`lifecycle-status`** (enum: verified, pending, not-applicable) — Lifecycle evidence state, separate from final-status
- **`iterations-completed`** (number) — Number of check-fix cycles executed
- **`final-report`** (file, pattern `local-tmp/docs-swe-sep/docs-swe-sep__*__audit.md`) — Final audit report

## Contents

- [Lifecycle validation ownership](../meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md) — shared Step 0.
- [Execution Mode](./docs-software-engineering-separation-quality-gate/execution-mode.md) — delegation vs. manual mode.

### Steps

- [Step 1: Initial Validation](./docs-software-engineering-separation-quality-gate/step-1-initial-validation.md) — checker run.
- [Step 2: Check for Findings](./docs-software-engineering-separation-quality-gate/step-2-check-for-findings.md) — threshold decision.
- [Step 3: Apply Fixes](./docs-software-engineering-separation-quality-gate/step-3-apply-fixes.md) — fixer run.
- [Step 4: Re-validate](./docs-software-engineering-separation-quality-gate/step-4-revalidate.md) — confirmation check.
- [Step 5: Iteration Control](./docs-software-engineering-separation-quality-gate/step-5-iteration-control.md) — loop logic.
- [Step 6: Finalization](./docs-software-engineering-separation-quality-gate/step-6-finalization.md) — final status.

### Criteria and Examples

- [Termination Criteria](./docs-software-engineering-separation-quality-gate/termination-criteria.md) — pass/partial/fail rules.
- [Example Usage](./docs-software-engineering-separation-quality-gate/example-usage.md) — invocation scenarios.
- [Iteration Example](./docs-software-engineering-separation-quality-gate/iteration-example.md) — worked trace.

### Reference

- [Safety Features](./docs-software-engineering-separation-quality-gate/safety-features.md) — convergence safeguards.
- [Validation Focus](./docs-software-engineering-separation-quality-gate/validation-focus.md) — what the checker validates.
- [Related Workflows](./docs-software-engineering-separation-quality-gate/related-workflows.md) — composable workflows.
- [Success Metrics](./docs-software-engineering-separation-quality-gate/success-metrics.md) — operational tracking.
- [Notes](./docs-software-engineering-separation-quality-gate/notes.md) — key operating characteristics.
- [Principles Respected](./docs-software-engineering-separation-quality-gate/principles-implemented-respected.md) — governance.
- [Conventions Respected](./docs-software-engineering-separation-quality-gate/conventions-implemented-respected.md) — governance.
- [Related Agents](./docs-software-engineering-separation-quality-gate/related-agents.md) — checker/fixer agent links.

---
description: Fully automated quality gate that validates ayokoding-web content quality, factual accuracy, and links in parallel, then applies fixes iteratively until zero findings.
when_to_use: Use after creating or updating ayokoding-web content, before deploying to production, or periodically to confirm content quality and accuracy.
---

# AyoKoding Content General Quality Gate Workflow

Fully automated workflow that validates all ayokoding-web content (quality, facts, links) and iteratively fixes findings.

## Goal and Termination

**Goal**: Validate all ayokoding-web content quality, apply fixes iteratively until zero findings

**Termination**: Zero findings across all validators on two consecutive validations (max-iterations defaults to 7, escalation warning at 5)

## Inputs

- **`scope`** (string, optional, default `all`) — Content to validate (e.g., "all", "ayokoding-web/content/en/", "specific-file.md")
- **`mode`** (enum: lax, normal, strict, ocd, optional, default `strict`) — Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)
- **`min-iterations`** (number, optional) — Minimum check-fix cycles before allowing zero-finding termination (prevents premature success)
- **`max-iterations`** (number, optional, default `7`) — Maximum check-fix cycles to prevent infinite loops
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the N in the N+1 model (1 main thread + N background agents = N+1 total). Raise only when independent work, machine capacity, and budget headroom all allow; lower under budget, runner, or disk pressure. Never self-promoted beyond the declared value.

## Outputs

- **`final-status`** (enum: pass, partial, fail) — Final validation status
- **`lifecycle-status`** (enum: verified, pending, not-applicable) — Lifecycle evidence state, separate from final-status
- **`iterations-completed`** (number) — Number of check-fix cycles executed
- **`content-report`** (file, pattern `local-tmp/ayokoding-web-general/ayokoding-web-general__*__audit.md`) — Final content validation report
- **`facts-report`** (file, pattern `local-tmp/ayokoding-web-facts/ayokoding-web-facts__*__audit.md`) — Final facts validation report
- **`links-report`** (file, pattern `local-tmp/ayokoding-web-link/ayokoding-web-link__*__audit.md`) — Final links validation report

## Contents

- [Lifecycle validation ownership](../meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md) — shared Step 0.
- [Execution Mode and Research Delegation](./ayokoding-web-general-quality-gate/execution-mode-and-research-delegation.md) — Agent Delegation vs. manual, research delegation.
- [Steps 1-2: Parallel Validation and Aggregate Findings](./ayokoding-web-general-quality-gate/step-1-and-2-parallel-validation-and-aggregate-findings.md) — run checkers, count findings.
- [Steps 3-4: Apply Content and Facts Fixes](./ayokoding-web-general-quality-gate/003-apply-fixes.md) — the two fixer steps.
- [Steps 5-7: Iteration Control, Final Validation, and Finalization](./ayokoding-web-general-quality-gate/step-5-to-7-iteration-final-validation-finalization.md) — continue, confirm, report.
- [Termination Criteria and Example Usage](./ayokoding-web-general-quality-gate/termination-criteria-and-example-usage.md) — pass/partial/fail, invocation examples.
- [Iteration Example and Safety Features](./ayokoding-web-general-quality-gate/iteration-example-and-safety-features.md) — worked flow, loop safeguards.
- [Validation Dimensions, Related Workflows, and Success Metrics](./ayokoding-web-general-quality-gate/validation-dimensions-related-workflows-and-success-metrics.md) — what each validator checks.
- [Notes, Principles, and Conventions Implemented](./ayokoding-web-general-quality-gate/notes-principles-and-conventions.md) — operational notes, principles, conventions.

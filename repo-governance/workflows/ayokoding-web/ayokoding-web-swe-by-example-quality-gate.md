---
description: Iterative Maker-Checker-Fixer quality gate for by-example tutorials, validating coverage, example count, annotation density, and the mandatory Examples-by-Level section.
when_to_use: Use after creating or updating by-example tutorials, before publishing them, or periodically to confirm tutorial quality remains high.
---

# AyoKoding Content By-Example Quality Gate Workflow

Iterative Maker-Checker-Fixer quality gate for by-example tutorials.

## Goal and Termination

**Goal**: Validate by-example tutorial quality and apply fixes iteratively until EXCELLENT status achieved with zero mechanical issues

**Termination**: Tutorial achieves EXCELLENT status with 75-85 examples, 95% coverage, and zero mechanical issues on two consecutive validations (max-iterations defaults to 7, escalation warning at 5)

## Inputs

- **`tutorial-path`** (string, required) — Path to by-example tutorial (e.g., "golang/tutorials/by-example/", "elixir/tutorials/by-example/")
- **`mode`** (enum: lax, normal, strict, ocd, optional, default `strict`) — Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)
- **`min-iterations`** (number, optional) — Minimum check-fix cycles before allowing zero-finding termination (prevents premature success)
- **`max-iterations`** (number, optional, default `7`) — Maximum check-fix cycles to prevent infinite loops
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the N in the N+1 model (1 main thread + N background agents = N+1 total). Raise only when independent work, machine capacity, and budget headroom all allow; lower under budget, runner, or disk pressure. Never self-promoted beyond the declared value.
- **`auto-fix-level`** (enum: high-only, high-and-medium, all, optional, default `high-only`) — Which confidence levels to auto-fix without user approval

## Outputs

- **`final-status`** (enum: excellent, needs-improvement, failing) — Final tutorial quality status
- **`lifecycle-status`** (enum: verified, pending, not-applicable) — Lifecycle evidence state, separate from final-status
- **`iterations-completed`** (number) — Number of check-fix cycles executed
- **`checker-report`** (file, pattern `local-tmp/ayokoding-web-by-example/ayokoding-web-by-example__*__*__audit.md`) — Final validation report from apps-ayokoding-www-by-example-checker (4-part format with UUID chain)
- **`fixer-report`** (file, pattern `local-tmp/ayokoding-web-by-example/ayokoding-web-by-example__*__*__fix.md`) — Final fixes report from apps-ayokoding-www-by-example-fixer (4-part format with UUID chain)
- **`execution-scope`** (string) — Scope identifier for UUID chain tracking (derived from tutorial-path, e.g., "golang" for golang tutorials)
- **`examples-count`** (number) — Total number of examples in tutorial
- **`coverage-percentage`** (number) — Estimated coverage percentage achieved

## Contents

- [Lifecycle validation ownership](../meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md) — shared Step 0.
- [Execution Mode, Workflow Overview, and Research Delegation](./ayokoding-web-swe-by-example-quality-gate/execution-mode-workflow-overview-and-research-delegation.md) — how to run, flow diagram.
- [Steps 1-2: Maker and Checker](./ayokoding-web-swe-by-example-quality-gate/step-1-and-2-maker-and-checker.md) — create examples, validate quality.
- [Step 3: User Review](./ayokoding-web-swe-by-example-quality-gate/003-user-review.md) — human decision point.
- [Step 4: Fixer](./ayokoding-web-swe-by-example-quality-gate/004-fixer.md) — apply validated fixes.
- [Steps 5-6: Iteration Control and Finalization](./ayokoding-web-swe-by-example-quality-gate/005-iteration-control-and-finalization.md) — continue or finalize.
- [Termination Criteria](./ayokoding-web-swe-by-example-quality-gate/termination-criteria.md) — success/partial/failure conditions.
- [Iteration Examples 1-2](./ayokoding-web-swe-by-example-quality-gate/iteration-examples-1-and-2.md) — clean-path and issue-path walkthroughs.
- [Iteration Example 3](./ayokoding-web-swe-by-example-quality-gate/iteration-example-3.md) — major-rework failing-path walkthrough.
- [Strictness Examples 4-6](./ayokoding-web-swe-by-example-quality-gate/strictness-examples.md) — normal, strict, and ocd modes.
- [Workflow Invocation and Safety Features](./ayokoding-web-swe-by-example-quality-gate/workflow-invocation-and-safety-features.md) — how to trigger, loop safeguards.
- [Workflow Metadata and References](./ayokoding-web-swe-by-example-quality-gate/workflow-metadata-and-references.md) — metrics, related workflows, principles.

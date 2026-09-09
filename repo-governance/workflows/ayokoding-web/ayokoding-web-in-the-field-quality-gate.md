---
description: Iterative Maker-Checker-Fixer quality gate for in-the-field production guides, validating guide count, standard-library-first ordering, annotation density, and production code quality.
when_to_use: Use after creating or updating in-the-field production guides, before publishing them, or periodically to confirm production code quality.
---

# AyoKoding Content In-the-Field Quality Gate Workflow

Iterative Maker-Checker-Fixer quality gate for in-the-field production guides.

## Goal and Termination

**Goal**: Validate in-the-field production guide quality and apply fixes iteratively until EXCELLENT status achieved with zero mechanical issues

**Termination**: Tutorial achieves EXCELLENT status with 20-40 guides, production code quality, and zero mechanical issues on two consecutive validations (max-iterations defaults to 7, escalation warning at 5)

## Inputs

- **`tutorial-path`** (string, required) — Path to in-the-field tutorials (e.g., "java/in-the-field/", "golang/in-the-field/")
- **`mode`** (enum: lax, normal, strict, ocd, optional, default `strict`) — Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)
- **`min-iterations`** (number, optional) — Minimum check-fix cycles before allowing zero-finding termination (prevents premature success)
- **`max-iterations`** (number, optional, default `7`) — Maximum check-fix cycles to prevent infinite loops
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the N in the N+1 model (1 main thread + N background agents = N+1 total). Raise only when independent work, machine capacity, and budget headroom all allow; lower under budget, runner, or disk pressure. Never self-promoted beyond the declared value.
- **`auto-fix-level`** (enum: high-only, high-and-medium, all, optional, default `high-only`) — Which confidence levels to auto-fix without user approval

## Outputs

- **`final-status`** (enum: excellent, needs-improvement, failing) — Final tutorial quality status
- **`lifecycle-status`** (enum: verified, pending, not-applicable) — Lifecycle evidence state, separate from final-status
- **`iterations-completed`** (number) — Number of check-fix cycles executed
- **`checker-report`** (file, pattern `local-tmp/ayokoding-web-in-the-field/ayokoding-web-in-the-field__*__*__audit.md`) — Final validation report from apps-ayokoding-www-in-the-field-checker (4-part format with UUID chain)
- **`fixer-report`** (file, pattern `local-tmp/ayokoding-web-in-the-field/ayokoding-web-in-the-field__*__*__fix.md`) — Final fixes report from apps-ayokoding-www-in-the-field-fixer (4-part format with UUID chain)
- **`execution-scope`** (string) — Scope identifier for UUID chain tracking (derived from tutorial-path, e.g., "java" for Java tutorials)
- **`guides-count`** (number) — Total number of production guides
- **`production-coverage`** (string) — Production scenarios covered

## Contents

- [Lifecycle validation ownership](../meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md) — shared Step 0.
- [Execution Mode, Workflow Overview, and Research Delegation](./ayokoding-web-in-the-field-quality-gate/execution-mode-workflow-overview-and-research-delegation.md) — how to run, flow diagram.
- [Steps 1-2: Maker and Checker](./ayokoding-web-in-the-field-quality-gate/step-1-and-2-maker-and-checker.md) — create guides, validate quality.
- [Step 3: User Review](./ayokoding-web-in-the-field-quality-gate/003-user-review.md) — human decision point.
- [Step 4: Fixer](./ayokoding-web-in-the-field-quality-gate/004-fixer.md) — apply validated fixes.
- [Steps 5-6: Iteration Control and Finalization](./ayokoding-web-in-the-field-quality-gate/005-iteration-control-and-finalization.md) — continue or finalize.
- [Termination Criteria and Safety Features](./ayokoding-web-in-the-field-quality-gate/termination-criteria-and-safety-features.md) — success conditions, loop safeguards.
- [Related Workflows, Principles, Conventions, and Documentation](./ayokoding-web-in-the-field-quality-gate/related-workflows-principles-conventions-and-documentation.md) — cross-references.

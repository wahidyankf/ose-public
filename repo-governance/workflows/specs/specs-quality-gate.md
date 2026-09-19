---
description: "Validate explicitly listed specs/ folders for structural completeness, content accuracy, internal consistency, and cross-folder coherence, then apply fixes iteratively until zero findings."
when_to_use: "Use after creating or restructuring spec areas, before major spec refactors, after bulk feature-file changes, or after adding a new app/library to the monorepo."
---

# Specs Validation Workflow

**Purpose**: Validate **explicitly listed** specs/ folders (and their subfolders) for structural
completeness, content accuracy, internal consistency, and cross-folder coherence, then apply
fixes iteratively until all issues are resolved.

**When to use**:

- After creating or restructuring spec areas (e.g., adding demo-fe, consolidating demo specs)
- Before major spec refactors or migrations
- After bulk feature file additions or modifications
- To verify consistency between related spec areas (e.g., demo-be and demo-fe)
- After adding a new app or library to the monorepo

## Goal and Termination

**Goal**: Validate explicitly listed specs/ folders for structural completeness, content accuracy, internal consistency, and cross-folder coherence, then apply fixes iteratively until zero findings achieved

**Termination**: Zero findings at the configured mode threshold on two consecutive validations (max-iterations defaults to 7, escalation warning at 5)

## Inputs

- **`folders`** (file-list, required) — Explicit list of spec folders to validate (e.g., [specs/apps/organiclever-be, specs/apps/organiclever]). Each folder and its subfolders are validated. Cross-folder consistency is checked between listed folders.
- **`mode`** (enum: lax, normal, strict, ocd, optional, default `strict`) — Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)
- **`min-iterations`** (number, optional) — Minimum check-fix cycles before allowing zero-finding termination (prevents premature success)
- **`max-iterations`** (number, optional, default `7`) — Maximum check-fix cycles to prevent infinite loops
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the N in the N+1 model (1 main thread + N background agents = N+1 total). Raise only when independent work, machine capacity, and budget headroom all allow; lower under budget, runner, or disk pressure. Never self-promoted beyond the declared value.

## Outputs

- **`final-status`** (enum: pass, partial, fail) — Final validation status
- **`lifecycle-status`** (enum: verified, pending, not-applicable) — Lifecycle evidence state, separate from final-status
- **`iterations-completed`** (number) — Number of check-fix cycles executed
- **`final-report`** (file, pattern `local-tmp/specs/specs__*__*__audit.md`) — Final audit report (4-part format with UUID chain)
- **`execution-scope`** (string) — Scope identifier for UUID chain tracking (default 'specs')

## Contents

- [Lifecycle validation ownership](../meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md) — shared Step 0.
- [Execution Mode and Scope](./specs-quality-gate/execution-mode-and-scope.md) — agent delegation, how to invoke, and what this workflow does/doesn't validate.
- [Validation Dimensions](./specs-quality-gate/validation-dimensions.md) — the nine categories and deterministic Rhino offload.
- [Steps — Initial Validation and Fixes](./specs-quality-gate/steps-initial-validation-and-fixes.md) — steps 1-3 of the check-fix loop.
- [Steps — Re-validate Through Termination](./specs-quality-gate/steps-revalidate-through-termination.md) — steps 4-6 and termination criteria.
- [Example and Iteration Usage](./specs-quality-gate/example-and-iteration-usage.md) — worked usage examples and a traced iteration.
- [Safety, Related Workflows, and Conventions](./specs-quality-gate/safety-related-and-conventions.md) — safeguards, related workflows, notes, principles, conventions, and agents.

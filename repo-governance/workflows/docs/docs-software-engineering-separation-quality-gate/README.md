---
description: "Validates separation between OSE Platform style guides and AyoKoding educational content, then fixes violations iteratively."
when_to_use: "Read this index to find the right Software Engineering Documentation Separation Quality Gate Workflow child document."
---

# Software Engineering Documentation Separation Quality Gate Workflow

- [Execution Mode](./execution-mode.md) — Describes Agent Delegation (preferred, invoking docs-software-engineering-separation-checker/fixer) versus Manual Orchestration (fallback), and how a user invokes each. Use when deciding whether to run this workflow via delegated agents or manual tool orchestration.
- [1. Initial Validation (Sequential)](./step-1-initial-validation.md) — Step 1: invokes docs-software-engineering-separation-checker to identify separation violations and write the initial audit report. Use when implementing or debugging the initial-validation step of the quality gate.
- [2. Check for Findings (Sequential)](./step-2-check-for-findings.md) — Step 2: counts all findings in the audit report and decides whether to proceed to fixing or a confirmation re-check. Use when implementing or debugging the findings-threshold decision step.
- [3. Apply Fixes (Sequential, Conditional)](./step-3-apply-fixes.md) — Step 3: invokes docs-software-engineering-separation-fixer to add missing prerequisite statements and remove duplicated educational content. Use when implementing or debugging the fix-application step.
- [4. Re-validate (Sequential)](./step-4-revalidate.md) — Step 4: re-runs the checker to verify fixes resolved issues and no new issues were introduced. Use when implementing or debugging the re-validation step.
- [5. Iteration Control (Sequential)](./step-5-iteration-control.md) — Step 5: the iteration-control logic tracking consecutive-zero counts to decide pass, partial, or loop back. Use when implementing or debugging the loop/termination decision logic between checker and fixer iterations.
- [6. Finalization (Sequential)](./step-6-finalization.md) — Step 6: reports the final status (pass/partial/fail), iteration count, and summary report. Use when implementing or debugging the workflow's final reporting step.
- [Termination Criteria](./termination-criteria.md) — Defines pass, partial, and fail termination criteria, requiring zero findings on two consecutive validations. Use when determining what condition ends the workflow.
- [Example Usage](./example-usage.md) — Worked example invocations covering all-relationships validation, a single language, a single framework, and iteration bounds. Use when looking for a concrete invocation pattern to copy for a specific scenario.
- [Iteration Example](./iteration-example.md) — A worked three-iteration trace showing findings dropping from 8 to 3 to 0, with the double-zero confirmation. Use when you need to see how consecutive_zero_count evolves across a realistic multi-iteration run.
- [Safety Features](./safety-features.md) — Documents infinite-loop prevention, convergence safeguards, false-positive protection, and error recovery. Use when verifying the workflow's safety guarantees or diagnosing a stuck/non-converging run.
- [Validation Focus](./validation-focus.md) — Lists what the checker validates: no duplication, prerequisite statements, style guide focus, learning path completeness, and cross-reference links. Use when you need to know exactly what the separation checker looks for.
- [Related Workflows](./related-workflows.md) — Lists workflows this one composes with: content creation, release, and repository rules validation workflows. Use when looking for a workflow to run before or after this one.
- [Success Metrics](./success-metrics.md) — Metrics to track across executions: average iterations, success rate, common finding categories, and fix success rate. Use when instrumenting or reviewing this workflow's operational health over time.
- [Notes](./notes.md) — Summary notes: fully automated, idempotent, conservative fixer behaviour, observable, bounded, scope-aware, and incremental migration support. Use for a quick-reference summary of the workflow's key operating characteristics.
- [Principles Implemented/Respected](./principles-implemented-respected.md) — Lists the governance principles this workflow implements (explicit over implicit, automation, simplicity, accessibility, progressive disclosure, no time estimates). Use when auditing this workflow against repository-wide governance principles.
- [Conventions Implemented/Respected](./conventions-implemented-respected.md) — Lists the file-naming, linking, and content-quality conventions this workflow follows. Use when auditing this workflow against repository-wide structural conventions.
- [Related Agents](./related-agents.md) — Links to the docs-software-engineering-separation-checker and -fixer agent definitions this workflow invokes. Use when looking up the exact agent definition backing a step in this workflow.

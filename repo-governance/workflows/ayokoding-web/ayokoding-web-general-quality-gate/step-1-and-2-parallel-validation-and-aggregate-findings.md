---
description: Documents the parallel checker invocation (general, facts, links) and the aggregation logic that decides whether fixes are needed.
when_to_use: Use when running or interpreting the first two steps of the general quality gate.
---

# Steps 1-2: Parallel Validation and Aggregate Findings

## 0. Lifecycle Validation Filter

Apply [Lifecycle Validation Ownership](../../meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md)
before composing checker prompts. Pass Step 0's `delegated-gate-ids` and `lifecycle-evidence` to
every checker and fixer; exact delegated predicates cannot become findings or enter the fix loop.
No lifecycle gate owns internal links, so link checking keeps internal path and fragment resolution
as well as external HTTP/cache validation.

## 1. Parallel Validation (Parallel)

Run all ayokoding validators concurrently to identify all issues across different quality dimensions.

**Agent 1a**: `apps-ayokoding-www-general-checker`

- **Args**: `scope: {input.scope}, delegated-gate-ids: {step0.outputs.delegated-gate-ids},
lifecycle-evidence: {step0.outputs.lifecycle-evidence}`
- **Output**: `{content-report-N}` - Content quality, bilingual consistency

**Agent 1b**: `apps-ayokoding-www-facts-checker`

- **Args**: `scope: {input.scope}, delegated-gate-ids: {step0.outputs.delegated-gate-ids},
lifecycle-evidence: {step0.outputs.lifecycle-evidence}`
- **Output**: `{facts-report-N}` - Factual accuracy, code examples, tutorial sequences

**Agent 1c**: `apps-ayokoding-www-link-checker`

- **Args**: `scope: {input.scope}, delegated-gate-ids: {step0.outputs.delegated-gate-ids},
lifecycle-evidence: {step0.outputs.lifecycle-evidence}`
- **Output**: `{links-report-N}` - Internal/external link validation

**Success criteria**: All checkers complete and generate audit reports.

**On failure**: Terminate workflow with status `fail`.

**Notes**:

- All checkers run in parallel for efficiency
- Each generates independent audit report in `local-tmp/<agent-family>/`
- Reports use progressive writing to survive context compaction

## 2. Aggregate Findings (Sequential)

Analyze all audit reports to determine if fixes are needed.

**Condition Check**: Count ALL findings (CRITICAL, HIGH, MEDIUM, and LOW) across all four reports

- If total findings > 0: Proceed to step 3 (reset `consecutive_zero_count` to 0)
- If total findings = 0: Initialize `consecutive_zero_count` to 1 (this check is the first zero),
  proceed to step 1 for confirmation re-check (consecutive pass requirement)

**Depends on**: Step 1 completion

**Notes**:

- Considers ALL findings from all four validation dimensions
- Fixes everything: HIGH (objective), MEDIUM (structural), LOW (style/formatting)
- Tracks findings by category for observability
- Achieves perfect content quality state

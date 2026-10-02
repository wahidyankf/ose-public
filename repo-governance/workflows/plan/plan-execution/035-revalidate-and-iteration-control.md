---
description: Defines the re-validation step and the iteration-control logic that loops execution or proceeds to finalization.
when_to_use: Use when deciding whether to loop back into execution again or proceed to finalization, based on remaining findings and iteration count.
---

# 6. Re-validate (Sequential)

Run validation again to verify findings resolved and no new issues introduced.

**Agent**: `plan-execution-checker`

- **Args**: `plan: {input.plan-path}`
- **Output**: `{audit-report-N}` — Verification validation report
- **Depends on**: Step 5 completion

**Success criteria**: Checker completes validation.

**On failure**: Terminate workflow with status `fail`.

**Notes**:

- Verifies all findings from previous report are resolved
- Checks no new issues were introduced during fixes
- Generates fresh validation report with current status

## 7. Iteration Control (Sequential)

Determine whether to continue execution or terminate.

**Logic**:

- Count blocking findings in `{step6.outputs.audit-report-N}` (CRITICAL, HIGH, or an unproven acceptance criterion)
- If blocking findings = 0: Proceed to the ordered finalization gates: applicable surface retests,
  Knowledge Capture, end-to-end delivery completeness audit, exact-head/base PR CI where
  applicable, status/infra resolution, delivery-mode archival, merge, and cleanup
- If blocking findings > 0 AND cycles < max-cycles: Loop back to step 5 with new report
- If blocking findings > 0 AND cycles >= max-cycles: Proceed to step 8 (Finalization - Partial)

**Depends on**: Step 6 completion

**Notes**:

- Bounded by `max-cycles`, never more than three
- Stops when no blocking finding remains
- Each iteration uses the latest validation report
- Tracks cycle count for observability
- A gap found by any finalization gate reopens the earliest affected outcome section/action, rebuilds the
  task mapping, and returns to execution and validation within the same cycle budget; a clean checker report does not
  bypass that loop.

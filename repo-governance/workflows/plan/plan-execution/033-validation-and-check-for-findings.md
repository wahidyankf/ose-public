---
description: Defines the plan-execution-checker validation step and how its findings count determines whether execution continues.
when_to_use: Use when running independent validation after execution, or deciding whether a blocking finding remains.
---

# 3. Validation (Sequential)

Validate the implementation against plan requirements.

**Agent**: `plan-execution-checker`

- **Args**: `plan: {input.plan-path}`
- **Output**: `{audit-report-1}` — Initial validation report in `local-tmp/plan-execution/`
- **Depends on**: Step 2 completion

**Success criteria**: Checker completes and generates validation report.

**On failure**: Terminate workflow with status `fail`.

**Notes**:

- Validates implementation against plan requirements
- Checks all deliverables meet quality standards
- Verifies delivery checklist completion
- Generates progressive report with all findings (CRITICAL, HIGH, MEDIUM, LOW)

## 4. Check for Findings (Sequential)

Analyze validation report to determine if further execution is needed.

**Condition Check**: Count ALL findings (CRITICAL, HIGH, MEDIUM, and LOW) in `{step3.outputs.audit-report-1}`

- If findings > 0: Proceed to step 5 (Continue Execution)
- If findings = 0: Skip to step 8 (Finalization - Success)

**Depends on**: Step 3 completion

**Notes**:

- Includes all finding levels — missing requirements, incomplete deliverables, quality issues
- A finding blocks when it is CRITICAL or HIGH, or leaves an acceptance criterion unproven; success needs none
- Every MEDIUM or LOW finding is fixed or recorded with its reason in `learnings.md`
- Reports which requirements still need work

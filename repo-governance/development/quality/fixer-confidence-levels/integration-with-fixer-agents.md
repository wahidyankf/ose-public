---
description: "How fixer agents integrate confidence assessment."
when_to_use: "Use when wiring confidence levels into a fixer agent."
---

# Integration with Fixer Agents

## How Each Fixer Uses This System

All fixer agents follow the same workflow:

### 1. Report Discovery

- Auto-detect latest audit report in `local-tmp/<agent-family>/`
- Allow manual override if user specifies specific report
- Verify report exists and is readable

### 2. Findings Parsing

- Extract findings from audit report sections
- Identify file path, issue type, line numbers
- Group by issue category

### 3. Re-validation Loop

For each finding:

```python
def process_finding(finding):
    # Re-execute validation check
    validation_result = revalidate_finding(finding)

    # Assess confidence
    if validation_result.is_objective and validation_result.confirmed:
        confidence = "HIGH"
        apply_fix(finding)
    elif validation_result.is_subjective or validation_result.ambiguous:
        confidence = "MEDIUM"
        flag_for_manual_review(finding)
    elif validation_result.disproved:
        confidence = "FALSE_POSITIVE"
        report_to_user(finding, improvement_suggestion)

    # Document decision
    log_to_fix_report(finding, confidence, validation_result)
```

### 4. Fix Application

- Apply ALL HIGH confidence fixes automatically
- Skip MEDIUM and FALSE_POSITIVE findings
- NO confirmation prompts (no gate cycle waits for a person, per the
  [Quality Gate Contract](../../workflow/quality-gate-contract.md))

### 5. Fix Report Generation

Create comprehensive report in `local-tmp/<agent-family>/`:

- Validation summary (HIGH/MEDIUM/FALSE_POSITIVE counts)
- Fixes applied section (what changed)
- False positives detected (detailed analysis)
- Needs manual review (subjective items)
- Recommendations for checker improvement

**File naming:** Replace `__audit` suffix with `__fix` (same timestamp)

## Consistency Across Agents

All fixer agents MUST:

- Use the same three confidence levels
- Apply the same universal criteria
- Generate fix reports in the same format
- Report false positives with improvement suggestions
- Document all confidence assessments
- Never skip re-validation

---
name: ui-quality-gate
goal: Validate UI component quality against frontend conventions, apply fixes iteratively until zero findings achieved
termination: "Zero findings on two consecutive validations (max-iterations defaults to 10, escalation warning at 7)"
inputs:
  - name: scope
    type: string
    description: Files or directories to validate (e.g., "libs/ts-ui/", "apps/organiclever-fe/src/components/")
    required: false
    default: all frontend components
  - name: min-iterations
    type: number
    description: Minimum check-fix cycles before allowing zero-finding termination
    required: false
  - name: max-iterations
    type: number
    description: Maximum check-fix cycles to prevent infinite loops
    required: false
    default: 10
  - name: max-concurrency
    type: number
    description: Maximum number of agents/tasks that can run concurrently
    required: false
    default: 2
outputs:
  - name: final-status
    type: enum
    values: [pass, partial, fail]
    description: Final validation status
  - name: iterations-completed
    type: number
    description: Number of check-fix cycles executed
  - name: final-report
    type: file
    pattern: generated-reports/swe-ui__*__audit.md
    description: Final audit report
---

# UI Quality Gate Workflow

**Purpose**: Validate UI component quality (token compliance, accessibility, component patterns, dark mode, responsive design), then apply fixes iteratively until all issues are resolved.

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `swe-ui-checker` and `swe-ui-fixer` via the Agent tool with `subagent_type` (see [Workflow Execution Modes Convention](../meta/execution-modes.md)).

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using Read/Write/Edit tools when Agent Delegation is unavailable.

**How to Execute**:

```
User: "Run UI quality gate workflow for libs/ts-ui/"
User: "Run UI quality gate for apps/organiclever-fe/src/components/ui/"
```

## Steps

### Step 1: Initial Validation

**Agent**: `swe-ui-checker`

**Action**: Run full validation against all seven check dimensions (token compliance, accessibility, color contrast, component patterns, dark mode, responsive, anti-patterns).

**Output**: Audit report in `generated-reports/swe-ui__{uuid}__{timestamp}__audit.md`

### Step 2: Check for Findings

**Action**: Count all findings from Step 1 report.

**Routing**:

- Zero findings → Go to Step 5 (Confirmation Check)
- Findings exist → Go to Step 3

### Step 3: Apply Fixes

**Agent**: `swe-ui-fixer`

**Action**: Process audit report, re-validate each finding, apply fixes where confidence is HIGH.

**Rules**:

- Re-read each file before fixing (may have changed)
- Skip FALSE_POSITIVE findings
- Skip MEDIUM confidence findings (flag for manual review)
- Apply fixes in priority order: P0 first, then P1, P2, P3, P4

### Step 4: Re-validate

**Agent**: `swe-ui-checker`

**Action**: Re-run validation scoped to files changed by Step 3.

**Routing**:

- Zero findings → Go to Step 5 (Confirmation Check)
- Findings remain → Check iteration count
  - Below max-iterations → Go to Step 3
  - At max-iterations → Go to Step 6 (Finalization) with status "partial"

### Step 5: Confirmation Check

**Action**: Run one more validation to confirm zero findings (double-zero confirmation).

**Routing**:

- Still zero → Go to Step 6 with status "pass"
- Findings appeared → Go to Step 3

### Step 6: Finalization

**Action**: Report final status.

| Status  | Meaning                                           |
| ------- | ------------------------------------------------- |
| pass    | Zero findings confirmed on two consecutive checks |
| partial | Some findings remain after max-iterations         |
| fail    | Critical errors that could not be resolved        |

## Safety Features

- **Max iterations**: Default 10, prevents infinite loops
- **Escalation**: Warning at iteration 7 — suggests manual review
- **Convergence monitoring**: If finding count increases between iterations, pause and flag
- **False-positive persistence**: Findings marked FALSE_POSITIVE are tracked and skipped in subsequent iterations

## Example Usage

```
User: "Run UI quality gate for libs/ts-ui/ in strict mode"

AI: Invoking swe-ui-checker for libs/ts-ui/...
    Found 12 findings (3 HIGH, 5 MEDIUM, 4 LOW)
    Invoking swe-ui-fixer with audit report...
    Fixed 10 findings, 2 remaining (1 MEDIUM confidence, 1 FALSE_POSITIVE)
    Re-validating...
    Found 0 findings
    Confirmation check: 0 findings
    Status: PASS (2 iterations)
```

## Related Documentation

- [swe-ui-checker](../../../.claude/agents/swe-ui-checker.md) — Validation agent
- [swe-ui-fixer](../../../.claude/agents/swe-ui-fixer.md) — Fix application agent
- [swe-ui-maker](../../../.claude/agents/swe-ui-maker.md) — Component creation agent
- [Frontend Conventions](../../development/frontend/README.md) — Standards enforced by this workflow

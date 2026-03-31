---
name: ci-quality-gate
goal: Validate all projects conform to CI/CD standards and fix non-compliance iteratively
termination: Zero findings remain after validation or max-iterations reached
inputs:
  - name: scope
    type: string
    description: Scope of validation - "all" for all projects, or specific project name
    required: false
    default: all
  - name: max-iterations
    type: number
    description: Maximum number of check-fix cycles
    required: false
    default: 5
outputs:
  - name: final-status
    type: enum
    values: [pass, partial, fail]
    description: Final validation status
  - name: iterations-completed
    type: number
    description: Number of check-fix cycles performed
  - name: final-report
    type: file
    pattern: generated-reports/ci__*__audit.md
    description: Final audit report from ci-checker
---

# CI Quality Gate Workflow

**Purpose**: Automatically validate all projects in the repository conform to CI/CD standards
defined in `governance/development/infra/ci-conventions.md`, then iteratively fix non-compliance
until zero findings are achieved.

**When to use**:

- After adding a new app to the repository
- After modifying CI/CD infrastructure (workflows, composite actions, Docker files)
- As a periodic compliance check
- Before major releases to ensure CI consistency

## Execution Mode

**Preferred Mode**: Agent Delegation -- invoke `ci-checker` and `ci-fixer` via the Agent tool.

## Steps

### 1. Initial Check (Sequential)

Run `ci-checker` to validate all projects against CI standards.

**Agent**: `ci-checker`
**Output**: Audit report in `generated-reports/`

### 2. Analyze Findings (Sequential)

Count findings by criticality level.

- If findings = 0: Skip to step 5 (Success)
- If findings > 0: Proceed to step 3

### 3. Apply Fixes (Sequential)

Run `ci-fixer` to address findings from the latest audit report.

**Agent**: `ci-fixer`
**Output**: Fixed files, updated configurations

### 4. Re-check and Iterate (Sequential)

Run `ci-checker` again to verify fixes and check for new issues.

- If findings = 0: Proceed to step 5 (Success)
- If findings > 0 AND iterations < max-iterations: Loop back to step 3
- If findings > 0 AND iterations >= max-iterations: Proceed to step 5 (Partial)

### 5. Finalization (Sequential)

Report final status.

- **pass**: Zero findings after validation
- **partial**: Findings remain after max-iterations
- **fail**: Technical errors during checking or fixing

## Related Workflows

- [Plan Execution](../../workflows/plan/plan-execution.md) -- Uses similar iterative check-fix pattern
- [Plan Quality Gate](../../workflows/plan/plan-quality-gate.md) -- Analogous quality gate for plans

## Principles Implemented/Respected

- **Explicit Over Implicit**: All CI standards are documented in governance docs, not implicit conventions
- **Automation Over Manual**: Automated checking and fixing reduces manual compliance burden
- **Simplicity Over Complexity**: Simple iterative check-fix loop with bounded iterations

## Conventions Implemented/Respected

- **[CI/CD Conventions](../../development/infra/ci-conventions.md)**: The standards being validated
- **[Workflow Identifier Convention](../meta/workflow-identifier.md)**: Follows standard workflow structure

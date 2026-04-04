---
name: plan-quality-gate
goal: Validate plan completeness and technical accuracy, apply fixes iteratively until zero findings achieved
termination: "Zero findings on two consecutive validations (max-iterations defaults to 10, escalation warning at 7)"
inputs:
  - name: scope
    type: string
    description: Plan files to validate (e.g., "all", "plans/in-progress/", "specific-plan.md")
    required: false
    default: all
  - name: min-iterations
    type: number
    description: Minimum check-fix cycles before allowing zero-finding termination (prevents premature success)
    required: false
  - name: max-iterations
    type: number
    description: Maximum check-fix cycles to prevent infinite loops
    required: false
    default: 10
  - name: max-concurrency
    type: number
    description: Maximum number of agents/tasks that can run concurrently during workflow execution
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
    pattern: generated-reports/plan__*__audit.md
    description: Final audit report
---

# Plan Quality Gate Workflow

**Purpose**: Automatically validate plan completeness, technical accuracy, and implementation readiness, then apply fixes iteratively until all issues are resolved.

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `plan-checker` and `plan-fixer` via the Agent
tool with `subagent_type` (see [Workflow Execution Modes Convention](../meta/execution-modes.md)).

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using
Read/Write/Edit tools when Agent Delegation is unavailable.

The Agent tool runs subagents that persist file changes to the actual filesystem, making it
the preferred approach when these agents exist as defined subagent types.

**How to Execute**:

```
User: "Run plan quality gate workflow for plans/backlog/my-plan/"
```

The AI will:

1. Invoke `plan-checker` via the Agent tool (reads plan files, writes audit report)
2. Invoke `plan-fixer` via the Agent tool (reads audit, applies fixes, writes fix report)
3. Iterate until zero findings achieved
4. Show git status with modified files
5. Wait for user commit approval

**Fallback (Manual Mode)**:

```
User: "Run plan quality gate workflow for plans/backlog/my-plan/ in manual mode"
```

The AI executes checker and fixer logic directly using Read/Write/Edit tools in the main
context — use this when agent delegation is unavailable.

**When to use**:

- After creating new project plans
- Before starting plan execution
- When updating existing plans with new requirements
- Periodically to ensure plan quality and accuracy

## Steps

### 1. Initial Validation (Sequential)

Run plan validation to identify completeness and accuracy issues.

**Agent**: `plan-checker`

- **Args**: `scope: {input.scope}`
- **Output**: `{audit-report-1}` - Initial audit report in `generated-reports/`

**Success criteria**: Checker completes and generates audit report.

**On failure**: Terminate workflow with status `fail`.

### 2. Check for Findings (Sequential)

Analyze audit report to determine if fixes are needed.

**Condition Check**: Count ALL findings (HIGH, MEDIUM, and MINOR) in `{step1.outputs.audit-report-1}`

- If findings > 0: Proceed to step 3 (reset `consecutive_zero_count` to 0)
- If findings = 0: Initialize `consecutive_zero_count` to 1 (this check is the first zero),
  proceed to step 4 for confirmation re-check (consecutive pass requirement)

**Depends on**: Step 1 completion

**Notes**:

- Fixes ALL findings, not just critical ones
- Includes minor issues like formatting, style improvements
- Ensures plans achieve perfect quality state

### 3. Apply Fixes (Sequential, Conditional)

Apply all validated fixes from the audit report.

**Agent**: `plan-fixer`

- **Args**: `report: {step1.outputs.audit-report-1}, approved: all`
- **Output**: `{fixes-applied}`
- **Condition**: Findings exist from step 2
- **Depends on**: Step 2 completion

**Success criteria**: Fixer successfully applies all fixes without errors.

**On failure**: Log errors, proceed to step 4 for verification.

**Notes**:

- Fixer re-validates findings before applying (prevents false positives)
- Fixes ALL confidence levels: HIGH (objective), MEDIUM (structural), MINOR (style/formatting)
- Achieves perfect plan quality with zero findings

### 4. Re-validate (Sequential)

Run checker again to verify fixes resolved issues and no new issues introduced.

**Agent**: `plan-checker`

- **Args**: `scope: {input.scope}, uuid-chain: {previous-uuid-chain}, fix-report: {step3.outputs.fix-report}`
- **Output**: `{audit-report-N}` - Verification audit report
- **Depends on**: Step 3 completion

**Re-validation mode**: The UUID chain signals re-validation mode to the checker. The fix report provides the changed files list for scoped re-validation. The checker validates only changed plan files and reuses iteration 1's codebase inspection scope.

**Success criteria**: Checker completes validation.

**On failure**: Terminate workflow with status `fail`.

### 5. Iteration Control (Sequential)

Determine whether to continue fixing or terminate.

**Logic**:

- Count ALL findings in `{step4.outputs.audit-report-N}` (HIGH, MEDIUM, MINOR)
- Track `consecutive_zero_count` across iterations (resets to 0 when findings > 0, increments when findings = 0)
- If consecutive_zero_count >= 2 AND iterations >= min-iterations (or min not provided): Proceed to step 6 (Success — double-zero confirmed)
- If consecutive_zero_count >= 2 AND iterations < min-iterations: Loop back to step 4 (re-validate)
- If consecutive_zero_count < 2 AND findings = 0: Loop back to step 4 (confirmation check — no fix needed, just re-verify)
- If findings > 0 AND max-iterations provided AND iterations >= max-iterations: Proceed to step 6 (Partial)
- If findings > 0 AND (max-iterations not provided OR iterations < max-iterations): Loop back to step 3

**Depends on**: Step 4 completion

**Notes**:

- **Default behavior**: Runs up to 10 iterations (default max-iterations). Override with higher value for more attempts
- **Consecutive pass requirement**: Zero findings must be confirmed by a second independent check before declaring success
- **Convergence target**: Workflow should stabilize in 3-5 iterations with convergence safeguards (scoped re-validation, cached verification, false positive tracking)
- **Escalation threshold**: If findings count is not monotonically decreasing after iteration 7, log a warning: "Convergence not achieved — likely non-deterministic findings or scope expansion"
- **Optional min-iterations**: Prevents premature termination before sufficient iterations
- Each iteration uses the latest audit report
- Tracks iteration count for observability

### 6. Finalization (Sequential)

Report final status and summary.

**Output**: `{final-status}`, `{iterations-completed}`, `{final-report}`

**Status determination**:

- **Success** (`pass`): Zero findings after validation
- **Partial** (`partial`): Findings remain after max-iterations
- **Failure** (`fail`): Technical errors during check or fix

**Depends on**: Reaching this step from step 2, 4, or 5

## Termination Criteria

- PASS: **Success** (`pass`): Zero findings of ANY confidence level (HIGH, MEDIUM, MINOR) on **two consecutive** validations (consecutive pass requirement)
- **Partial** (`partial`): Any findings remain after max-iterations cycles
- FAIL: **Failure** (`fail`): Checker or fixer encountered technical errors

## Example Usage

### Validate All Plans

```
User: "Run plan quality gate workflow for all plans"
```

The AI will invoke `plan-checker` and `plan-fixer` via the Agent tool:

- Validate all plan files (`plan-checker` subagent)
- Apply all fixes (`plan-fixer` subagent)
- Iterate until zero findings achieved

### Validate Specific Plan Folder

```
User: "Run plan quality gate workflow for plans/in-progress/"
```

The AI will invoke agents with scoped validation:

- Validate only in-progress plans
- Fix issues in those plans only
- Iterate until zero findings in scope

### Validate Single Plan

```
User: "Run plan quality gate workflow for plans/in-progress/2025-01-15__new-feature/plan.md"
```

The AI will invoke agents with single-file scope:

- Validate specific plan file only
- Fix issues in that file
- Iterate until plan is clean

### With Iteration Bounds

```
User: "Run plan quality gate workflow for all plans with min-iterations=2 and max-iterations=10"
```

The AI will invoke agents with iteration controls:

- Require at least 2 check-fix cycles
- Cap at maximum 10 iterations
- Report final status after completion

## Iteration Example

Typical execution flow:

```
Iteration 1:
  Check (full scan + comprehensive codebase inspection) → 12 findings → Fix → captures changed files

Iteration 2:
  Check (scoped to changed files, cached verification) → 3 findings → Fix → captures changed files

Iteration 3:
  Check (scoped) → 0 findings (consecutive_zero: 1)

Iteration 4 (confirmation):
  Re-check (scoped) → 0 findings (consecutive_zero: 2 — double-zero confirmed)

Result: SUCCESS (4 iterations)
```

## Safety Features

**Infinite Loop Prevention**:

- max-iterations defaults to 10 (override with higher value for more attempts)
- When provided, workflow terminates with `partial` if limit reached
- Tracks iteration count for monitoring
- Escalation warning at iteration 7 if not converging

**Convergence Safeguards**:

- Checker loads `.known-false-positives.md` skip list at start of each iteration
- Fixer persists new FALSE_POSITIVEs to skip list after each run
- Re-validation uses scoped scan (changed files only) to prevent scope expansion
- Comprehensive codebase inspection on iteration 1 with locked scope on iterations 2+
- Factual claims verified in iteration 1 are cached, not re-verified with WebSearch
- Escalation after repeated checker-fixer disagreements on the same finding

**False Positive Protection**:

- Fixer re-validates each finding before applying
- Skips FALSE_POSITIVE findings automatically
- Progressive writing ensures audit history survives

**Error Recovery**:

- Continues to verification even if some fixes fail
- Reports which fixes succeeded/failed
- Generates final report regardless of status

## Plan-Specific Validation

The plan-checker validates:

- **Completeness**: All required sections present (requirements, deliverables, checklists)
- **Technical Accuracy**: Commands, versions, tool names verified via web search
- **Implementation Readiness**: Plans are actionable and executable
- **Codebase Alignment**: References to existing files, patterns, and conventions
- **Clarity**: Clear problem statements, well-defined scope, unambiguous requirements
- **Operational Readiness** (CRITICAL): Plans must include all of the following:
  - **Local quality gates**: Steps to run affected tests, linting, typecheck locally before pushing (`nx affected -t typecheck lint test:quick spec-coverage`)
  - **Post-push CI verification**: Steps to monitor and verify GitHub Actions/workflows pass after pushing to main, with instructions to fix failures immediately
  - **Development environment setup**: Steps to set up the dev environment for the features being built (dependencies, env vars, DB, dev server)
  - **Fix-all-issues instruction**: Explicit instruction to fix ALL failures found during quality gates — including preexisting issues not caused by the current changes (root cause orientation principle)
  - **Thematic commit guidance**: Instruction to commit changes thematically with Conventional Commits format, splitting different domains/concerns into separate commits
  - **Manual behavioral assertions**: Steps to use Playwright MCP for web UI verification (navigate, snapshot, click, check console errors) and curl for API verification (hit endpoints, check responses, test error cases) — applicable when the plan touches UI or API code

## Related Workflows

This workflow can be composed with:

- Content creation workflows (validate plans before creating content)
- Execution workflows (validate before starting implementation)
- Release workflows (validate plan completeness before release planning)

## Success Metrics

Track across executions:

- **Average iterations to completion**: How many cycles typically needed
- **Success rate**: Percentage reaching zero findings
- **Common finding categories**: What issues appear most often in plans
- **Fix success rate**: Percentage of fixes applied without errors

## Notes

- **Fully automated**: No human checkpoints, runs to completion
- **Idempotent**: Safe to run multiple times, won't break working plans
- **Conservative**: Fixer skips uncertain changes (preserves plan intent)
- **Observable**: Generates audit reports for every iteration
- **Bounded**: Max-iterations prevents runaway execution
- **Scope-aware**: Can validate all plans or specific subsets

This workflow ensures plan quality and implementation readiness through iterative validation and fixing, making it ideal for maintaining high-quality project planning.

## Principles Implemented/Respected

- PASS: **Explicit Over Implicit**: All steps, conditions, and termination criteria are explicit
- PASS: **Automation Over Manual**: Fully automated validation and fixing without human intervention
- PASS: **Simplicity Over Complexity**: Clear linear flow with loop control
- PASS: **Accessibility First**: Generates human-readable audit reports
- PASS: **Progressive Disclosure**: Can run with different scopes and iteration limits
- PASS: **No Time Estimates**: Focus on quality outcomes, not duration

## Conventions Implemented/Respected

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Workflow file follows plain name convention for workflows
- **[Linking Convention](../../conventions/formatting/linking.md)**: All cross-references use GitHub-compatible markdown with `.md` extensions
- **[Content Quality Principles](../../conventions/writing/quality.md)**: Active voice, proper heading hierarchy, single H1

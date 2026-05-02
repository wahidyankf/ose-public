---
name: docs-software-engineering-separation-quality-gate
goal: Validate software engineering documentation separation between OSE Platform style guides and AyoKoding educational content, apply fixes iteratively until zero findings achieved
termination: "Zero findings on two consecutive validations (max-iterations defaults to 7, escalation warning at 5)"
inputs:
  - name: scope
    type: string
    description: Documentation scope to validate (e.g., "all", "programming-languages/java", "platform-web/tools/jvm-spring")
    required: false
    default: all
  - name: mode
    type: enum
    values: [lax, normal, strict, ocd]
    description: "Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)"
    required: false
    default: strict
  - name: min-iterations
    type: number
    description: Minimum check-fix cycles before allowing zero-finding termination (prevents premature success)
    required: false
  - name: max-iterations
    type: number
    description: Maximum check-fix cycles to prevent infinite loops
    required: false
    default: 7
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
    pattern: generated-reports/docs-swe-sep__*__audit.md
    description: Final audit report
---

# Software Engineering Documentation Separation Quality Gate Workflow

**Purpose**: Automatically validate separation between OSE Platform style guides (docs/explanation/software-engineering/) and AyoKoding educational content (apps/ayokoding-web/), then apply fixes iteratively until all separation violations are resolved.

**IMPORTANT - Validation Scope**:

This workflow validates **ONLY** explicit relationships listed in the Software Design Reference prerequisite table:

- **Validates**: Relationships explicitly opted-in (Java, Golang, Elixir, JVM Spring, JVM Spring Boot)
- **Skips**: Languages/frameworks not in prerequisite table (TypeScript, Python, etc.)
- **Why**: Enables incremental migration - validate only explicitly defined relationships

**When to use**:

- After adding new prerequisite relationships to Software Design Reference
- After updating docs/explanation style guide content
- After updating AyoKoding educational content
- Before major releases to ensure no educational content duplicated in style guides
- Periodically to ensure separation compliance

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `docs-software-engineering-separation-checker`
and `docs-software-engineering-separation-fixer` via the Agent tool with `subagent_type`
(see [Workflow Execution Modes Convention](../meta/execution-modes.md)).

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using
Read/Write/Edit tools when Agent Delegation is unavailable.

The Agent tool runs delegated agents that persist file changes to the actual filesystem, making it
the preferred approach when these agents exist as defined delegated agent types.

**How to Execute**:

```
User: "Run docs software engineering separation quality gate workflow"
```

The AI will:

1. Invoke `docs-software-engineering-separation-checker` via the Agent tool (reads files, writes audit)
2. Invoke `docs-software-engineering-separation-fixer` via the Agent tool (reads audit, applies fixes, writes fix report)
3. Iterate until zero findings achieved
4. Show git status with modified files
5. Wait for user commit approval

**Fallback (Manual Mode)**:

```
User: "Run docs software engineering separation quality gate workflow in manual mode"
```

The AI executes checker and fixer logic directly using Read/Write/Edit tools in the main
context — use this when agent delegation is unavailable.

## Steps

### 1. Initial Validation (Sequential)

Run software engineering documentation separation check to identify violations.

**Agent**: `docs-software-engineering-separation-checker`

- **Args**: `scope: {input.scope}`
- **Output**: `{audit-report-1}` - Initial audit report in `generated-reports/` (4-part format: `docs-swe-sep__{uuid-chain}__{timestamp}__audit.md`)

**Success criteria**: Checker completes and generates audit report.

**On failure**: Terminate workflow with status `fail`.

### 2. Check for Findings (Sequential)

Analyze audit report to determine if fixes are needed.

**Condition Check**: Count ALL findings (CRITICAL, HIGH, MEDIUM) in `{step1.outputs.audit-report-1}`

- If findings > 0: Proceed to step 3 (reset `consecutive_zero_count` to 0)
- If findings = 0: Initialize `consecutive_zero_count` to 1 (this check is the first zero),
  proceed to step 4 for confirmation re-check (consecutive pass requirement)

**Depends on**: Step 1 completion

**Notes**:

- Validates NO DUPLICATION between docs/explanation and AyoKoding
- Checks prerequisite statements exist and reference AyoKoding correctly
- Validates style guide focus on repository-specific conventions only

### 3. Apply Fixes (Sequential, Conditional)

Apply all validated fixes from the audit report.

**Agent**: `docs-software-engineering-separation-fixer`

- **Args**: `report: {step1.outputs.audit-report-1}, approved: all`
- **Output**: `{fixes-applied}`
- **Condition**: Findings exist from step 2
- **Depends on**: Step 2 completion

**Success criteria**: Fixer successfully applies all fixes without errors.

**On failure**: Log errors, proceed to step 4 for verification.

**Notes**:

- Fixer re-validates findings before applying (prevents false positives)
- Adds missing prerequisite statements
- Removes duplicated educational content from style guides
- Ensures docs/explanation focuses on repository-specific conventions

### 4. Re-validate (Sequential)

Run checker again to verify fixes resolved issues and no new issues introduced.

**Agent**: `docs-software-engineering-separation-checker`

- **Args**: `scope: {input.scope}`
- **Output**: `{audit-report-N}` - Verification audit report
- **Depends on**: Step 3 completion

**Success criteria**: Checker completes validation.

**On failure**: Terminate workflow with status `fail`.

### 5. Iteration Control (Sequential)

Determine whether to continue fixing or terminate.

**Logic**:

- Count ALL findings in `{step4.outputs.audit-report-N}` (CRITICAL, HIGH, MEDIUM)
- Track `consecutive_zero_count` across iterations (resets to 0 when findings > 0, increments when findings = 0)
- If consecutive_zero_count >= 2 AND iterations >= min-iterations (or min not provided): Proceed to step 6 (Success — double-zero confirmed)
- If consecutive_zero_count >= 2 AND iterations < min-iterations: Loop back to step 4 (re-validate)
- If consecutive_zero_count < 2 AND findings = 0: Loop back to step 4 (confirmation check — no fix needed, just re-verify)
- If findings > 0 AND max-iterations provided AND iterations >= max-iterations: Proceed to step 6 (Partial)
- If findings > 0 AND (max-iterations not provided OR iterations < max-iterations): Loop back to step 3

**Depends on**: Step 4 completion

**Notes**:

- **Default behavior**: Runs up to 7 iterations (default max-iterations). Override with higher value for more attempts
- **Consecutive pass requirement**: Zero findings must be confirmed by a second independent check before declaring success
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

- PASS: **Success** (`pass`): Zero findings of ANY level (CRITICAL, HIGH, MEDIUM) on **two consecutive** validations (consecutive pass requirement)
- **Partial** (`partial`): Any findings remain after max-iterations cycles
- FAIL: **Failure** (`fail`): Checker or fixer encountered technical errors

## Example Usage

### Validate All Explicit Relationships

```
User: "Run docs software engineering separation quality gate workflow for all"
```

The AI will invoke specialized agents via the Agent tool:

- Validate all explicit relationships (Java, Golang, Elixir, Spring, Spring Boot) (`docs-software-engineering-separation-checker` delegated agent)
- Apply separation fixes (`docs-software-engineering-separation-fixer` delegated agent)
- Iterate until zero findings achieved

### Validate Specific Language

```
User: "Run docs software engineering separation quality gate workflow for programming-languages/java"
```

The AI will invoke agents with scoped validation:

- Validate only Java documentation separation
- Fix issues in Java docs only
- Iterate until zero findings in scope

### Validate Specific Framework

```
User: "Run docs software engineering separation quality gate workflow for platform-web/tools/jvm-spring-boot"
```

The AI will invoke agents with framework scope:

- Validate only Spring Boot documentation separation
- Fix issues in Spring Boot docs
- Iterate until clean

### With Iteration Bounds

```
User: "Run docs software engineering separation quality gate workflow with min-iterations=2 and max-iterations=10"
```

The AI will invoke agents with iteration controls:

- Require at least 2 check-fix cycles
- Cap at maximum 10 iterations
- Report final status after completion

## Iteration Example

Typical execution flow:

```
Iteration 1:
  Check → 8 findings (missing prerequisites, duplicated content) → Fix → Re-check → 3 findings

Iteration 2:
  Check (reuse) → 3 findings (style guide lacks OSE Platform context) → Fix → Re-check → 0 findings (consecutive_zero: 1)

Iteration 3 (confirmation):
  Re-check → 0 findings (consecutive_zero: 2 — double-zero confirmed)

Result: SUCCESS (3 iterations)
```

## Safety Features

**Infinite Loop Prevention**:

- max-iterations defaults to 7 (override with higher value for more attempts)
- When provided, workflow terminates with `partial` if limit reached
- Tracks iteration count for monitoring
- Escalation warning at iteration 5 if not converging

**Convergence Safeguards**:

- Checker loads `.known-false-positives.md` skip list at start of each iteration
- Fixer persists new FALSE_POSITIVEs to skip list after each run
- Re-validation uses scoped scan (changed files only) to prevent scope expansion
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

## Validation Focus

The docs-software-engineering-separation-checker validates:

- **No Duplication**: docs/explanation MUST NOT duplicate AyoKoding educational content
- **Prerequisite Statements**: docs/explanation READMEs MUST reference AyoKoding learning paths
- **Style Guide Focus**: docs/explanation MUST focus on repository-specific conventions only
- **Learning Path Completeness**: AyoKoding MUST have required content (by-example, in-the-field)
- **Cross-Reference Links**: Links between platforms MUST be correct and functional

## Related Workflows

This workflow can be composed with:

- Content creation workflows (validate after creating style guides or tutorials)
- Release workflows (validate before version bump)
- Repository rules validation (comprehensive quality gate)

## Success Metrics

Track across executions:

- **Average iterations to completion**: How many cycles typically needed
- **Success rate**: Percentage reaching zero findings
- **Common finding categories**: What violations appear most often
- **Fix success rate**: Percentage of fixes applied without errors

## Notes

- **Fully automated**: No human checkpoints, runs to completion
- **Idempotent**: Safe to run multiple times, won't break working state
- **Conservative**: Fixer skips uncertain changes (preserves correctness)
- **Observable**: Generates audit reports for every iteration
- **Bounded**: Max-iterations prevents runaway execution
- **Scope-aware**: Validates only explicit relationships in prerequisite table
- **Incremental**: Enables gradual migration of content to separation model

This workflow ensures documentation separation compliance through iterative validation and fixing, supporting the transition from duplicated content to a clean separation between educational (AyoKoding) and style guide (docs/explanation) content.

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

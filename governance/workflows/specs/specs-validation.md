---
name: specs-validation
goal: "Validate explicitly listed specs/ folders for structural completeness, content accuracy, internal consistency, and cross-folder coherence, then apply fixes iteratively until zero findings achieved"
termination: "Zero findings remain after validation at the configured mode threshold (runs indefinitely until achieved unless max-iterations provided)"
inputs:
  - name: folders
    type: file-list
    description: "Explicit list of spec folders to validate (e.g., [specs/apps/demo/be, specs/apps/demo/fe]). Each folder and its subfolders are validated. Cross-folder consistency is checked between listed folders."
    required: true
  - name: mode
    type: enum
    values: [lax, normal, strict, ocd]
    description: "Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)"
    required: false
    default: normal
  - name: min-iterations
    type: number
    description: "Minimum check-fix cycles before allowing zero-finding termination (prevents premature success)"
    required: false
  - name: max-iterations
    type: number
    description: "Maximum check-fix cycles to prevent infinite loops (if not provided, runs until zero findings)"
    required: false
  - name: max-concurrency
    type: number
    description: "Maximum number of agents/tasks that can run concurrently during workflow execution"
    required: false
    default: 2
outputs:
  - name: final-status
    type: enum
    values: [pass, partial, fail]
    description: "Final validation status"
  - name: iterations-completed
    type: number
    description: "Number of check-fix cycles executed"
  - name: final-report
    type: file
    pattern: "generated-reports/specs__*__*__audit.md"
    description: "Final audit report (4-part format with UUID chain)"
  - name: execution-scope
    type: string
    description: "Scope identifier for UUID chain tracking (default 'specs')"
    required: false
---

# Specs Validation Workflow

**Purpose**: Validate **explicitly listed** specs/ folders (and their subfolders) for structural
completeness, content accuracy, internal consistency, and cross-folder coherence, then apply
fixes iteratively until all issues are resolved.

**Key Design Principle**: This workflow only validates folders you explicitly list. It does not
discover or scan the entire specs/ tree. Subfolders are included automatically — listing
`specs/apps/demo/be` includes `specs/apps/demo/be/gherkin/`, `specs/apps/demo/c4/`, etc.
When multiple folders are listed, cross-folder consistency is checked between them (contradictions,
coverage gaps, terminology drift).

**Scope Clarification**:

This workflow validates **specification files only** in listed folders. It does NOT validate:

- Implementation code in `apps/` (that's per-language developer agents and CI)
- Test code or step definitions (that's `rhino-cli spec-coverage validate`)
- Governance docs (that's `repo-governance-checker`)
- Spec folders NOT in the explicit list

**When to use**:

- After creating or restructuring spec areas (e.g., adding demo-fe, consolidating demo specs)
- Before major spec refactors or migrations
- After bulk feature file additions or modifications
- To verify consistency between related spec areas (e.g., demo-be and demo-fe)
- After adding a new app or library to the monorepo

## Execution Mode

**Current Mode**: Manual Orchestration (see [Workflow Execution Modes Convention](../meta/execution-modes.md))

This workflow is executed through **manual orchestration** where the AI assistant follows
workflow steps directly using Read/Write/Edit tools. File changes persist to the actual filesystem.

**How to Execute**:

```
User: "Run specs validation for specs/apps/demo/be"
User: "Run specs validation for specs/apps/demo/be and specs/apps/demo/fe in strict mode"
User: "Run specs validation for specs/apps/demo/be, specs/apps/demo/fe, specs/apps/organiclever-be with max-iterations=5"
```

The AI will:

1. Execute specs-checker logic for the listed folders (read, validate, write audit)
2. Check cross-folder consistency if 2+ folders listed
3. Execute specs-fixer logic (read audit, apply fixes within listed folders only)
4. Iterate until zero findings achieved at the configured threshold
5. Show git status with modified files
6. Wait for user commit approval

**Why Manual Mode?**: Task tool runs agents in isolated contexts where file changes don't
persist. Manual orchestration ensures audit reports and fixes are written to the filesystem.

## Validation Dimensions

The checker validates seven categories across all spec areas:

| #   | Category                         | What It Checks                                                 |
| --- | -------------------------------- | -------------------------------------------------------------- |
| 1   | Structural Completeness          | Every directory has README.md                                  |
| 2   | Feature File Inventory           | README counts match actual .feature files and scenarios        |
| 3   | Gherkin Format Compliance        | Feature headers, user stories, Background steps, naming        |
| 4   | Cross-Spec Consistency           | Shared domains align between related specs (demo-be ↔ demo-fe) |
| 5   | C4 Diagram Consistency           | Accessible colors, actor consistency, file references          |
| 6   | Cross-Reference Integrity        | All markdown links resolve to existing files                   |
| 7   | Spec-to-Implementation Alignment | Spec READMEs reference implementations that exist              |

## Steps

### 1. Initial Validation (Sequential)

Run specs-wide consistency check to identify all issues.

**Agent**: `specs-checker`

- **Args**: `folders: {input.folders}, EXECUTION_SCOPE: specs`
- **Output**: `{audit-report-1}` — Initial audit report in `generated-reports/`
  (4-part format: `specs__{uuid-chain}__{timestamp}__audit.md`)

**UUID Chain Tracking**: Checker generates 6-char UUID and writes to
`generated-reports/.execution-chain-specs` before validation.
See [Temporary Files Convention](../../development/infra/temporary-files.md#uuid-generation).

**Success criteria**: Checker completes and generates audit report.

**On failure**: Terminate workflow with status `fail`.

### 2. Check for Findings (Sequential)

Analyze audit report to determine if fixes are needed.

**Condition Check**: Count findings based on mode level in `{step1.outputs.audit-report-1}`

- **lax**: Count CRITICAL only
- **normal**: Count CRITICAL + HIGH
- **strict**: Count CRITICAL + HIGH + MEDIUM
- **ocd**: Count all levels (CRITICAL, HIGH, MEDIUM, LOW)

**Below-threshold findings**: Report but don't block success

- **lax**: HIGH/MEDIUM/LOW reported, not counted
- **normal**: MEDIUM/LOW reported, not counted
- **strict**: LOW reported, not counted
- **ocd**: All findings counted

**Decision**:

- If threshold-level findings > 0: Proceed to step 3
- If threshold-level findings = 0: Skip to step 6 (Success)

**Depends on**: Step 1 completion

### 3. Apply Fixes (Sequential, Conditional)

Apply validated fixes from the audit report based on mode level.

**Agent**: `specs-fixer`

- **Args**: `report: {step1.outputs.audit-report-1}, folders: {input.folders}, approved: all, mode: {input.mode}, EXECUTION_SCOPE: specs`
- **Output**: `{fixes-applied}` — Fix report with same UUID chain as source audit
- **Condition**: Threshold-level findings exist from step 2
- **Depends on**: Step 2 completion

**Success criteria**: Fixer successfully applies all threshold-level fixes without errors.

**On failure**: Log errors, proceed to step 4 for verification.

**Notes**:

- Fixer re-validates findings before applying (prevents false positives)
- **Fix scope based on mode**:
  - **lax**: Fix CRITICAL only (skip HIGH/MEDIUM/LOW)
  - **normal**: Fix CRITICAL + HIGH (skip MEDIUM/LOW)
  - **strict**: Fix CRITICAL + HIGH + MEDIUM (skip LOW)
  - **ocd**: Fix all levels (CRITICAL, HIGH, MEDIUM, LOW)
- Below-threshold findings remain untouched

### 4. Re-validate (Sequential)

Run checker again to verify fixes resolved issues and no new issues introduced.

**Agent**: `specs-checker`

- **Args**: `folders: {input.folders}`
- **Output**: `{audit-report-N}` — Verification audit report
- **Depends on**: Step 3 completion

**Success criteria**: Checker completes validation.

**On failure**: Terminate workflow with status `fail`.

### 5. Iteration Control (Sequential)

Determine whether to continue fixing or terminate.

**Logic**:

- Count findings based on mode level in `{step4.outputs.audit-report-N}` (same as Step 2):
  - **lax**: Count CRITICAL only
  - **normal**: Count CRITICAL + HIGH
  - **strict**: Count CRITICAL + HIGH + MEDIUM
  - **ocd**: Count all levels
- If threshold-level findings = 0 AND iterations >= min-iterations (or min not provided):
  Proceed to step 6 (Success)
- If threshold-level findings = 0 AND iterations < min-iterations:
  Loop back to step 3 (need more iterations)
- If threshold-level findings > 0 AND max-iterations provided AND iterations >= max-iterations:
  Proceed to step 6 (Partial)
- If threshold-level findings > 0 AND (max-iterations not provided OR iterations < max-iterations):
  Loop back to step 3

**Below-threshold findings**: Continue to be reported in audit but don't affect iteration logic

**Depends on**: Step 4 completion

### 6. Finalization (Sequential)

Report final status and summary.

**Output**: `{final-status}`, `{iterations-completed}`, `{final-report}`

**Status determination**:

- **Success** (`pass`): Zero threshold-level findings after validation
- **Partial** (`partial`): Findings remain after max-iterations
- **Failure** (`fail`): Technical errors during check or fix

**Depends on**: Reaching this step from step 2, 4, or 5

## Termination Criteria

**Success** (`pass`):

- **lax**: Zero CRITICAL findings (HIGH/MEDIUM/LOW may exist)
- **normal**: Zero CRITICAL/HIGH findings (MEDIUM/LOW may exist)
- **strict**: Zero CRITICAL/HIGH/MEDIUM findings (LOW may exist)
- **ocd**: Zero findings at all levels

**Partial** (`partial`):

- Threshold-level findings remain after max-iterations safety limit

**Failure** (`fail`):

- Technical errors during check or fix

**Note**: Below-threshold findings are reported in final audit but don't prevent success status.

## Example Usage

### Single Folder (Normal Strictness)

```
User: "Run specs validation for specs/apps/demo/be"
```

The AI will:

- Validate `specs/apps/demo/be/` and all its subfolders
- Fix CRITICAL and HIGH findings (missing READMEs, wrong counts, broken links)
- Report MEDIUM/LOW findings without fixing them
- Skip cross-folder consistency (only one folder listed)

### Multiple Folders — Cross-Folder Consistency

```
User: "Run specs validation for specs/apps/demo/be and specs/apps/demo/fe"
```

The AI will:

- Validate each folder independently (Categories 1-3, 5-7)
- Check cross-folder consistency between demo-be and demo-fe (Category 4):
  contradictions, coverage gaps, terminology drift, C4 coherence
- Fix CRITICAL and HIGH findings
- Iterate until zero CRITICAL/HIGH findings

### Strict Mode After Refactor

```
User: "Run specs validation for specs/apps/demo/be, specs/apps/demo/fe in strict mode"
```

The AI will:

- Fix CRITICAL/HIGH/MEDIUM findings (includes naming conventions, color palette)
- Check cross-folder consistency
- Report LOW findings without fixing them

### Comprehensive Audit (OCD Mode with Bounds)

```
User: "Run specs validation for specs/apps/demo/be, specs/apps/demo/fe, specs/apps/organiclever-be in ocd mode with max-iterations=10"
```

The AI will:

- Validate all 3 listed folders and check consistency across all pairs
- Fix ALL findings at all levels
- Cap at 10 iterations to prevent infinite loops
- Report final status (pass/partial)

## Iteration Example

Typical execution flow (folders: `[specs/apps/demo/be, specs/apps/demo/fe]`):

```
Iteration 1:
  Check demo-be → 4 findings (1 CRITICAL, 2 HIGH, 1 MEDIUM)
  Check demo-fe → 3 findings (0 CRITICAL, 2 HIGH, 1 LOW)
  Cross-folder check → 5 findings (0 CRITICAL, 3 HIGH, 1 MEDIUM, 1 LOW)
  Total: 12 findings (1 CRITICAL, 7 HIGH, 2 MEDIUM, 2 LOW)
  [normal mode] Fix 8 (1 CRITICAL + 7 HIGH)
  Re-check → 4 findings (0 CRITICAL, 1 HIGH, 2 MEDIUM, 1 LOW)

Iteration 2:
  Fix 1 (1 HIGH — cross-ref broken by README update in iteration 1)
  Re-check → 3 findings (0 CRITICAL, 0 HIGH, 2 MEDIUM, 1 LOW)

Result: SUCCESS (2 iterations, 3 below-threshold findings reported)
```

## Safety Features

**Infinite Loop Prevention**:

- Optional max-iterations parameter (no default — runs until zero findings)
- When provided, workflow terminates with `partial` if limit reached
- Tracks iteration count for monitoring

**False Positive Protection**:

- Fixer re-validates each finding before applying
- Skips FALSE_POSITIVE findings automatically
- Maintains `.known-false-positives.md` for persistent memory

**Error Recovery**:

- Continues to verification even if some fixes fail
- Reports which fixes succeeded/failed
- Generates final report regardless of status

## Related Workflows

- [Repository Rules Validation](../repository/repository-rules-validation.md) — Validates
  governance layer consistency (principles, conventions, development practices)
- [Docs Quality Gate](../docs/quality-gate.md) — Validates documentation quality
- [Plan Quality Gate](../plan/plan-quality-gate.md) — Validates plan completeness

## Notes

- **Fully automated**: No human checkpoints, runs to completion
- **Idempotent**: Safe to run multiple times, won't break working state
- **Conservative**: Fixer skips uncertain changes (preserves correctness)
- **Observable**: Generates audit reports for every iteration
- **Explicitly scoped**: Only validates folders you list — no implicit discovery

**Concurrency**: Currently validates and fixes sequentially. The `max-concurrency` parameter
is reserved for future enhancements where multiple listed folders could be validated in parallel.

## Principles Implemented/Respected

- **Explicit Over Implicit**: All steps, conditions, and termination criteria are explicit
- **Automation Over Manual**: Fully automated validation and fixing without human intervention
- **Simplicity Over Complexity**: Clear linear flow with loop control
- **Accessibility First**: Validates C4 diagrams use accessible color palette
- **Documentation First**: Ensures every spec directory has proper README documentation
- **No Time Estimates**: Focus on quality outcomes, not duration

## Conventions Implemented/Respected

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Workflow file follows
  plain name convention for workflows
- **[Linking Convention](../../conventions/formatting/linking.md)**: All cross-references use
  GitHub-compatible markdown with `.md` extensions
- **[Content Quality Principles](../../conventions/writing/quality.md)**: Active voice, proper
  heading hierarchy, single H1
- **[Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md)**: Three-stage
  workflow with criticality and confidence assessment

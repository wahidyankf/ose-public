---
name: ayokoding-web-general-quality-gate
goal: Validate all ayokoding-web content quality, apply fixes iteratively until zero findings
termination: "Zero findings across all validators on two consecutive validations (max-iterations defaults to 10, escalation warning at 7)"
inputs:
  - name: scope
    type: string
    description: Content to validate (e.g., "all", "ayokoding-web/content/en/", "specific-file.md")
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
  - name: content-report
    type: file
    pattern: generated-reports/ayokoding-web-general__*__audit.md
    description: Final content validation report
  - name: facts-report
    type: file
    pattern: generated-reports/ayokoding-web-facts__*__audit.md
    description: Final facts validation report
  - name: links-report
    type: file
    pattern: generated-reports/ayokoding-web-link__*__audit.md
    description: Final links validation report
---

# AyoKoding Content General Quality Gate Workflow

**Purpose**: Comprehensively validate all ayokoding-web content (factual accuracy, links), apply fixes iteratively until all issues are resolved.

**When to use**:

- After creating or updating ayokoding-web content
- Before deploying ayokoding-web to production
- Periodically to ensure content quality and accuracy
- After bulk content changes or restructuring

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `apps-ayokoding-web-general-checker`,
`apps-ayokoding-web-facts-checker`,
`apps-ayokoding-web-link-checker`, `apps-ayokoding-web-general-fixer`,
and `apps-ayokoding-web-facts-fixer`
via the Agent tool with `subagent_type`
(see [Workflow Execution Modes Convention](../meta/execution-modes.md)).

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using
Read/Write/Edit tools when Agent Delegation is unavailable.

The Agent tool runs subagents that persist file changes to the actual filesystem, making it
the preferred approach when these agents exist as defined subagent types.

**How to Execute**:

```
User: "Run ayokoding-web general quality gate workflow for ayokoding-web/content/en/"
```

The AI will:

1. Invoke checkers via the Agent tool in parallel (general, facts, links — validate, write audits)
2. Invoke fixers via the Agent tool in sequence (general, facts — read audits, apply fixes, write fix reports)
3. Iterate until zero findings achieved across all validators
4. Show git status with modified files
5. Wait for user commit approval

**Fallback (Manual Mode)**:

```
User: "Run ayokoding-web general quality gate workflow for ayokoding-web/content/en/ in manual mode"
```

The AI executes all checker, fixer, and regeneration logic directly using Read/Write/Edit
tools in the main context — use this when agent delegation is unavailable.

## Research Delegation

The `apps-ayokoding-web-facts-checker` agent invoked by this workflow delegates multi-page web
research to the [`web-research-maker`](../../../.claude/agents/web-research-maker.md) subagent when
verifying a single claim requires more than one or two searches, or more than two fetches.
Checkers retain in-context `WebSearch`/`WebFetch` only for single-shot verification against known
authoritative URLs. This keeps each audit context lean. The delegation is encoded in the checker
agent's prompt — no workflow-level configuration required.

## Steps

### 1. Parallel Validation (Parallel)

Run all ayokoding validators concurrently to identify all issues across different quality dimensions.

**Agent 1a**: `apps-ayokoding-web-general-checker`

- **Args**: `scope: {input.scope}`
- **Output**: `{content-report-N}` - Content quality, bilingual consistency

**Agent 1b**: `apps-ayokoding-web-facts-checker`

- **Args**: `scope: {input.scope}`
- **Output**: `{facts-report-N}` - Factual accuracy, code examples, tutorial sequences

**Agent 1c**: `apps-ayokoding-web-link-checker`

- **Args**: `scope: {input.scope}`
- **Output**: `{links-report-N}` - Internal/external link validation

**Success criteria**: All checkers complete and generate audit reports.

**On failure**: Terminate workflow with status `fail`.

**Notes**:

- All checkers run in parallel for efficiency
- Each generates independent audit report in `generated-reports/`
- Reports use progressive writing to survive context compaction

### 2. Aggregate Findings (Sequential)

Analyze all audit reports to determine if fixes are needed.

**Condition Check**: Count ALL findings (HIGH, MEDIUM, and MINOR) across all four reports

- If total findings > 0: Proceed to step 3 (reset `consecutive_zero_count` to 0)
- If total findings = 0: Initialize `consecutive_zero_count` to 1 (this check is the first zero),
  proceed to step 1 for confirmation re-check (consecutive pass requirement)

**Depends on**: Step 1 completion

**Notes**:

- Considers ALL findings from all four validation dimensions
- Fixes everything: HIGH (objective), MEDIUM (structural), MINOR (style/formatting)
- Tracks findings by category for observability
- Achieves perfect content quality state

### 3. Apply Content Fixes (Sequential, Conditional)

Fix Hugo convention violations, frontmatter issues, and content quality problems.

**Agent**: `apps-ayokoding-web-general-fixer`

- **Args**: `report: {step1.outputs.content-report-N}, approved: all`
- **Output**: `{content-fixes-applied}`
- **Condition**: Content findings exist from step 2
- **Depends on**: Step 2 completion

**Success criteria**: Fixer successfully applies content fixes without errors.

**On failure**: Log errors, continue to next fixer.

### 4. Apply Facts Fixes (Sequential, Conditional)

Fix factual errors, outdated information, and incorrect code examples.

**Agent**: `apps-ayokoding-web-facts-fixer`

- **Args**: `report: {step1.outputs.facts-report-N}, approved: all`
- **Output**: `{facts-fixes-applied}`
- **Condition**: Facts findings exist from step 2
- **Depends on**: Step 3 completion

**Success criteria**: Fixer successfully applies factual fixes without errors.

**On failure**: Log errors, continue to next fixer.

**Notes**:

- Uses web verification to ensure accuracy
- Re-validates findings before applying
- Preserves educational content intent

### 5. Iteration Control (Sequential)

Determine whether to continue fixing or move to finalization.

**Logic**:

- Re-run all checkers (step 1) to get fresh reports
- Count ALL findings (HIGH, MEDIUM, MINOR) across all new reports
- Track `consecutive_zero_count` across iterations (resets to 0 when findings > 0, increments when findings = 0)
- If consecutive_zero_count >= 2 AND iterations >= min-iterations (or min not provided): Proceed to step 6 (Final Validation — double-zero confirmed)
- If consecutive_zero_count >= 2 AND iterations < min-iterations: Loop back to step 1 (re-validate)
- If consecutive_zero_count < 2 AND findings = 0: Loop back to step 1 (confirmation check — no fix needed, just re-verify)
- If findings > 0 AND max-iterations provided AND iterations >= max-iterations: Proceed to step 6 with status `partial`
- If findings > 0 AND (max-iterations not provided OR iterations < max-iterations): Loop back to step 3

**Depends on**: Step 4 completion

**Notes**:

- **Default behavior**: Runs up to 15 iterations (default max-iterations). Override with higher value for more attempts
- **Consecutive pass requirement**: Zero findings must be confirmed by a second independent check before declaring success
- **Optional min-iterations**: Prevents premature termination before sufficient iterations
- Each iteration gets fresh validation reports across all four validators
- Tracks iteration count and finding trends

### 6. Final Validation (Sequential)

Run all checkers one final time to confirm zero issues remain.

**Agents**: All checkers in parallel

- apps-ayokoding-web-general-checker
- apps-ayokoding-web-facts-checker
- apps-ayokoding-web-link-checker

**Args**: `scope: {input.scope}, expect: zero-issues`

**Output**: Final audit reports for all dimensions

**Success criteria**: All checkers report zero issues of ANY confidence level.

**On failure**: Set status to `partial`.

**Depends on**: Step 5 completion

### 7. Finalization (Sequential)

Report final status and summary.

**Output**: `{final-status}`, `{iterations-completed}`, all final reports

**Status determination**:

- **Success** (`pass`): Zero findings after final validation
- **Partial** (`partial`): Findings remain after max-iterations OR final validation failed
- **Failure** (`fail`): Technical errors during check, fix, or finalization

**Depends on**: Step 6 completion

## Termination Criteria

- PASS: **Success** (`pass`): Zero findings of ANY confidence level (HIGH, MEDIUM, MINOR) across all validators on **two consecutive** validations (consecutive pass requirement)
- **Partial** (`partial`): Any findings remain after max-iterations OR final validation found issues
- FAIL: **Failure** (`fail`): Checkers, fixers, or finalization agents encountered technical errors

## Example Usage

### Full Content Check-Fix

```
User: "Run ayokoding-web general quality gate workflow"
```

The AI will invoke specialized agents via the Agent tool:

- Validate all ayokoding-web content in parallel (`apps-ayokoding-web-general-checker`, `apps-ayokoding-web-facts-checker`, `apps-ayokoding-web-link-checker` subagents)
- Fix all findings (`apps-ayokoding-web-general-fixer`, `apps-ayokoding-web-facts-fixer` subagents)
- Iterate until zero findings achieved

### Validate Specific Language

```
User: "Run ayokoding-web general quality gate workflow for ayokoding-web/content/en/"
```

The AI will invoke agents with language-scoped validation:

- Validate only English content
- Fix issues in English files only

### Validate Specific Section

```
User: "Run ayokoding-web general quality gate workflow for ayokoding-web/content/en/programming/"
```

The AI will invoke agents with section-scoped validation:

- Validate only programming section
- Fix issues in that section

### With Iteration Bounds

```
User: "Run ayokoding-web general quality gate workflow with min-iterations=2 and max-iterations=10"
```

The AI will invoke agents with iteration controls:

- Require at least 2 check-fix cycles
- Cap at maximum 10 iterations
- Report final status after completion

## Iteration Example

Typical execution flow:

```
Iteration 1:
  Parallel Check (3 validators) → 20 total findings
    - Content: 10 findings
    - Facts: 8 findings
    - Links: 2 findings
  Sequential Fix → Content → Facts
  Re-check → 5 findings remain

Iteration 2:
  Parallel Check → 5 findings
  Sequential Fix → Content → Facts
  Re-check → 0 findings

Finalization:
  Final Validation → Zero issues

Result: SUCCESS (2 iterations)
```

## Safety Features

**Infinite Loop Prevention**:

- max-iterations defaults to 10 (override with higher value for more attempts)
- When provided, workflow terminates with `partial` if limit reached
- Tracks iteration count and finding trends
- Use max-iterations when fix convergence is uncertain

**Convergence Safeguards**:

- Checker loads `.known-false-positives.md` skip list at start of each iteration
- Fixer persists new FALSE_POSITIVEs to skip list after each run
- Re-validation uses scoped scan (changed files only) to prevent scope expansion
- Factual claims verified in iteration 1 are cached, not re-verified with WebSearch
- Escalation after repeated checker-fixer disagreements on the same finding

**False Positive Protection**:

- All fixers re-validate findings before applying
- Skips FALSE_POSITIVE findings automatically
- Progressive writing ensures audit history survives

**Error Recovery**:

- Continues to next fixer even if one fails
- Continues to finalization even if fixes partially fail
- Reports which fixes succeeded/failed
- Generates final reports regardless of status

**Comprehensive Coverage**:

- Three validation dimensions (content, facts, links)
- Parallel validation for efficiency
- Sequential fixing for dependency management
- Post-fix regeneration for consistency

## Validation Dimensions

### Content Validation (apps-ayokoding-web-general-checker)

- Content quality principles
- Bilingual consistency

### Facts Validation (apps-ayokoding-web-facts-checker)

- Technical accuracy using web verification
- Code examples correctness
- Tutorial sequences validity
- Bilingual factual consistency

### Links Validation (apps-ayokoding-web-link-checker)

- Internal link validity
- External link accessibility
- Broken link detection

## Related Workflows

This workflow can be composed with:

- Deployment workflows (validate before deploying ayokoding-web)
- Content creation workflows (validate after bulk content creation)
- Translation workflows (validate bilingual consistency)

## Success Metrics

Track across executions:

- **Average iterations to completion**: How many cycles typically needed
- **Success rate**: Percentage reaching zero findings
- **Findings by dimension**: Which validators find most issues
- **Fix success rate**: Percentage of fixes applied without errors
- **Common issue categories**: What problems appear most frequently

## Notes

- **Fully automated**: No human checkpoints, runs to completion
- **Comprehensive**: Validates all quality dimensions
- **Parallel validation**: Efficient checking across dimensions
- **Sequential fixing**: Manages dependencies between fixers
- **Iterative fixing**: Ensures all findings are resolved
- **Idempotent**: Safe to run multiple times
- **Observable**: Generates detailed audit reports for each dimension
- **Bounded**: Max-iterations prevents runaway execution

This workflow ensures comprehensive ayokoding-web content quality through multi-dimensional validation and iterative fixing.

## Principles Implemented/Respected

- PASS: **Explicit Over Implicit**: All steps, validators, fixers, and finalization are explicit
- PASS: **Automation Over Manual**: Fully automated validation, fixing, and regeneration
- PASS: **Simplicity Over Complexity**: Clear flow despite multiple validators
- PASS: **Accessibility First**: Generates human-readable audit reports
- PASS: **Progressive Disclosure**: Can run with different scopes and iteration limits
- PASS: **No Time Estimates**: Focus on quality outcomes, not duration

## Conventions Implemented/Respected

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Workflow file follows plain name convention for workflows
- **[Linking Convention](../../conventions/formatting/linking.md)**: All cross-references use GitHub-compatible markdown with `.md` extensions
- **[Content Quality Principles](../../conventions/writing/quality.md)**: Active voice, proper heading hierarchy, single H1

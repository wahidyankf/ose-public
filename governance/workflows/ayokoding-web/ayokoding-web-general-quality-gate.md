---
name: ayokoding-web-general-quality-gate
goal: Validate all ayokoding-web content quality, apply fixes iteratively until zero findings, then regenerate titles and navigation
termination: Zero findings across all validators and navigation regenerated (runs indefinitely until achieved unless max-iterations provided)
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
    description: Maximum check-fix cycles to prevent infinite loops (if not provided, runs until zero findings)
    required: false
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
  - name: structure-report
    type: file
    pattern: generated-reports/ayokoding-web-structure__*__audit.md
    description: Final structure validation report
  - name: links-report
    type: file
    pattern: generated-reports/ayokoding-web-link__*__audit.md
    description: Final links validation report
---

# AyoKoding Content General Quality Gate Workflow

**Purpose**: Comprehensively validate all ayokoding-web content (Hugo conventions, factual accuracy, structure, links), apply fixes iteratively until all issues are resolved, then regenerate titles and navigation.

**When to use**:

- After creating or updating ayokoding-web content
- Before deploying ayokoding-web to production
- Periodically to ensure content quality and accuracy
- After bulk content changes or restructuring

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `apps-ayokoding-web-general-checker`,
`apps-ayokoding-web-facts-checker`, `apps-ayokoding-web-structure-checker`,
`apps-ayokoding-web-link-checker`, `apps-ayokoding-web-general-fixer`,
`apps-ayokoding-web-facts-fixer`, `apps-ayokoding-web-structure-fixer`,
`apps-ayokoding-web-title-maker`, and `apps-ayokoding-web-navigation-maker`
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

1. Invoke all four checkers via the Agent tool in parallel (general, facts, structure, links — validate, write audits)
2. Invoke all three fixers via the Agent tool in sequence (general, facts, structure — read audits, apply fixes, write fix reports)
3. Iterate until zero findings achieved across all validators
4. Invoke `apps-ayokoding-web-title-maker` via the Agent tool (regenerate titles)
5. Invoke `apps-ayokoding-web-navigation-maker` via the Agent tool (regenerate 2-layer navigation)
6. Show git status with modified files
7. Wait for user commit approval

**Fallback (Manual Mode)**:

```
User: "Run ayokoding-web general quality gate workflow for ayokoding-web/content/en/ in manual mode"
```

The AI executes all checker, fixer, and regeneration logic directly using Read/Write/Edit
tools in the main context — use this when agent delegation is unavailable.

## Steps

### 1. Parallel Validation (Parallel)

Run all ayokoding validators concurrently to identify all issues across different quality dimensions.

**Agent 1a**: `apps-ayokoding-web-general-checker`

- **Args**: `scope: {input.scope}`
- **Output**: `{content-report-N}` - Hugo conventions, bilingual consistency, navigation validation

**Agent 1b**: `apps-ayokoding-web-facts-checker`

- **Args**: `scope: {input.scope}`
- **Output**: `{facts-report-N}` - Factual accuracy, code examples, tutorial sequences

**Agent 1c**: `apps-ayokoding-web-structure-checker`

- **Args**: `scope: {input.scope}`
- **Output**: `{structure-report-N}` - Weight conventions, ordering, navigation structure

**Agent 1d**: `apps-ayokoding-web-link-checker`

- **Args**: `scope: {input.scope}`
- **Output**: `{links-report-N}` - Internal/external link validation, Hugo link format

**Success criteria**: All four checkers complete and generate audit reports.

**On failure**: Terminate workflow with status `fail`.

**Notes**:

- All checkers run in parallel for efficiency
- Each generates independent audit report in `generated-reports/`
- Reports use progressive writing to survive context compaction

### 2. Aggregate Findings (Sequential)

Analyze all audit reports to determine if fixes are needed.

**Condition Check**: Count ALL findings (HIGH, MEDIUM, and MINOR) across all four reports

- If total findings > 0: Proceed to step 3
- If total findings = 0: Skip to step 7 (Finalization)

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

### 5. Apply Structure Fixes (Sequential, Conditional)

Fix weight ordering, navigation structure, and coverage issues.

**Agent**: `apps-ayokoding-web-structure-fixer`

- **Args**: `report: {step1.outputs.structure-report-N}, approved: all`
- **Output**: `{structure-fixes-applied}`
- **Condition**: Structure findings exist from step 2
- **Depends on**: Step 4 completion

**Success criteria**: Fixer successfully applies structure fixes without errors.

**On failure**: Log errors, proceed to re-validation.

**Notes**:

- Adjusts weights to maintain proper ordering
- Fixes navigation structure issues
- Does NOT regenerate navigation (that happens in step 8)

### 6. Iteration Control (Sequential)

Determine whether to continue fixing or move to finalization.

**Logic**:

- Re-run all checkers (step 1) to get fresh reports
- Count ALL findings (HIGH, MEDIUM, MINOR) across all new reports
- If findings = 0 AND iterations >= min-iterations (or min not provided): Proceed to step 7 (Finalization)
- If findings = 0 AND iterations < min-iterations: Loop back to step 3 (need more iterations)
- If findings > 0 AND max-iterations provided AND iterations >= max-iterations: Proceed to step 7 with status `partial`
- If findings > 0 AND (max-iterations not provided OR iterations < max-iterations): Loop back to step 3

**Depends on**: Step 5 completion

**Notes**:

- **Default behavior**: Runs indefinitely until zero findings (no max-iterations limit)
- **Optional min-iterations**: Prevents premature termination before sufficient iterations
- **Optional max-iterations**: Prevents infinite loops when explicitly provided
- Each iteration gets fresh validation reports across all four validators
- Tracks iteration count and finding trends

### 7. Regenerate Titles (Sequential)

Update title fields in all ayokoding-web markdown files based on filenames and configuration.

**Agent**: `apps-ayokoding-web-title-maker`

- **Args**: `scope: {input.scope}`
- **Output**: `{titles-updated}`
- **Depends on**: Zero findings or max-iterations reached

**Success criteria**: All titles regenerated successfully.

**On failure**: Log errors, continue to navigation regeneration.

**Notes**:

- Runs after all fixes applied
- Updates titles based on filename conventions
- Handles language-specific title overrides

### 8. Regenerate Navigation (Sequential)

Regenerate 2-layer navigation listings in all \_index.md files from file structure.

**Agent**: `apps-ayokoding-web-navigation-maker`

- **Args**: `scope: {input.scope}`
- **Output**: `{navigation-updated}`
- **Depends on**: Step 7 completion

**Success criteria**: All navigation listings regenerated successfully.

**On failure**: Terminate workflow with status `fail`.

**Notes**:

- Runs AFTER title regeneration (titles affect navigation)
- Automatically generates 2-layer navigation from file structure
- Ensures complete navigation coverage

### 9. Final Validation (Sequential)

Run all checkers one final time to confirm zero issues remain.

**Agents**: All four checkers in parallel

- apps-ayokoding-web-general-checker
- apps-ayokoding-web-facts-checker
- apps-ayokoding-web-structure-checker
- apps-ayokoding-web-link-checker

**Args**: `scope: {input.scope}, expect: zero-issues`

**Output**: Final audit reports for all dimensions

**Success criteria**: All checkers report zero issues of ANY confidence level.

**On failure**: Set status to `partial`.

**Depends on**: Step 8 completion

### 10. Finalization (Sequential)

Report final status and summary.

**Output**: `{final-status}`, `{iterations-completed}`, all final reports

**Status determination**:

- **Success** (`pass`): Zero findings after final validation
- **Partial** (`partial`): Findings remain after max-iterations OR final validation failed
- **Failure** (`fail`): Technical errors during check, fix, or finalization

**Depends on**: Step 9 completion

## Termination Criteria

- PASS: **Success** (`pass`): Zero findings of ANY confidence level (HIGH, MEDIUM, MINOR) across all validators after finalization
- **Partial** (`partial`): Any findings remain after max-iterations OR final validation found issues
- FAIL: **Failure** (`fail`): Checkers, fixers, or finalization agents encountered technical errors

## Example Usage

### Full Content Check-Fix

```
User: "Run ayokoding-web general quality gate workflow"
```

The AI will invoke specialized agents via the Agent tool:

- Validate all ayokoding-web content in parallel (`apps-ayokoding-web-general-checker`, `apps-ayokoding-web-facts-checker`, `apps-ayokoding-web-structure-checker`, `apps-ayokoding-web-link-checker` subagents)
- Fix all findings (`apps-ayokoding-web-general-fixer`, `apps-ayokoding-web-facts-fixer`, `apps-ayokoding-web-structure-fixer` subagents)
- Regenerate titles and navigation (`apps-ayokoding-web-title-maker`, `apps-ayokoding-web-navigation-maker` subagents)
- Iterate until zero findings achieved

### Validate Specific Language

```
User: "Run ayokoding-web general quality gate workflow for ayokoding-web/content/en/"
```

The AI will invoke agents with language-scoped validation:

- Validate only English content
- Fix issues in English files only
- Regenerate titles and navigation for English content

### Validate Specific Section

```
User: "Run ayokoding-web general quality gate workflow for ayokoding-web/content/en/programming/"
```

The AI will invoke agents with section-scoped validation:

- Validate only programming section
- Fix issues in that section
- Regenerate titles and navigation for affected files

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
  Parallel Check (4 validators) → 25 total findings
    - Content: 10 findings
    - Facts: 8 findings
    - Structure: 5 findings
    - Links: 2 findings
  Sequential Fix → Content → Facts → Structure
  Re-check → 8 findings remain

Iteration 2:
  Parallel Check → 8 findings
  Sequential Fix → Content → Facts → Structure
  Re-check → 0 findings

Finalization:
  Regenerate Titles → Success
  Regenerate Navigation → Success
  Final Validation → Zero issues

Result: SUCCESS (2 iterations)
```

## Safety Features

**Infinite Loop Prevention**:

- Optional max-iterations parameter (no default - runs until zero findings)
- When provided, workflow terminates with `partial` if limit reached
- Tracks iteration count and finding trends
- Use max-iterations when fix convergence is uncertain

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

- Four validation dimensions (content, facts, structure, links)
- Parallel validation for efficiency
- Sequential fixing for dependency management
- Post-fix regeneration for consistency

## Validation Dimensions

### Content Validation (apps-ayokoding-web-general-checker)

- Hugo conventions (frontmatter, theme-specific)
- Bilingual consistency
- Navigation structure
- Content quality principles

### Facts Validation (apps-ayokoding-web-facts-checker)

- Technical accuracy using web verification
- Code examples correctness
- Tutorial sequences validity
- Bilingual factual consistency

### Structure Validation (apps-ayokoding-web-structure-checker)

- Weight conventions and ordering
- Navigation structure completeness
- Coverage gaps
- Pedagogical progression

### Links Validation (apps-ayokoding-web-link-checker)

- Internal link validity
- External link accessibility
- Hugo link format compliance (absolute paths, no .md)
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
- **Post-fix regeneration**: Ensures titles and navigation are current
- **Idempotent**: Safe to run multiple times
- **Observable**: Generates detailed audit reports for each dimension
- **Bounded**: Max-iterations prevents runaway execution

This workflow ensures comprehensive ayokoding-web content quality through multi-dimensional validation, iterative fixing, and automated regeneration of titles and navigation.

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

---
title: "Workflow Pattern Convention"
description: Standards for creating orchestrated multi-step processes that compose AI agents
category: explanation
subcategory: workflows
tags:
  - workflows
  - agents
  - orchestration
  - patterns
  - conventions
created: 2025-12-23
updated: 2026-03-24
---

# Workflow Pattern Convention

## Overview

Workflows are **composed multi-step processes** that orchestrate AI agents to achieve specific goals with clear termination criteria. They represent the fifth layer in the repository's governance hierarchy, sitting above individual agents to coordinate complex tasks.

## Repository Hierarchy

```
Layer 0: Vision (WHY we exist - foundational purpose)
    ↓ inspires
Layer 1: Principles (WHY - foundational values)
    ↓ governs
Layer 2: Conventions (WHAT - documentation rules)
    ↓ governs
Layer 3: Development (HOW - software practices)
    ↓ governs
Layer 4: AI Agents (WHO - atomic task executors)
    ↓ orchestrated by
Layer 5: Workflows (WHEN - multi-step processes)
```

**Key relationship**: Workflows are to Agents what Agents are to Tools - a composition layer.

## What Workflows Are

Workflows define:

- **Sequences of operations** - Multiple agents executed in order
- **Clear goals** - What the workflow achieves
- **Termination criteria** - When the workflow completes (success/failure/partial)
- **Input/output contracts** - What goes in, what comes out
- **State management** - How data flows between steps
- **Error handling** - What happens when steps fail

## What Workflows Are NOT

- FAIL: **Not a replacement for agents** - Workflows orchestrate, agents execute
- FAIL: **Not ad-hoc scripts** - Workflows are documented, validated, reusable processes
- FAIL: **Not project plans** - Plans are strategic documents, workflows are executable processes
- FAIL: **Not a new conceptual layer violating principles** - Workflows respect all layers above them

## When to Create a Workflow

Create a workflow when:

- PASS: A task requires **2 or more agents in sequence**
- PASS: The same sequence is **repeated multiple times**
- PASS: The process has **conditional logic** (if X, then Y)
- PASS: Steps need to run in **parallel** for efficiency
- PASS: **Human approval** is required at specific checkpoints
- PASS: **Outputs from one step** feed into another step

Don't create a workflow when:

- FAIL: A single agent can handle the task
- FAIL: The sequence is one-time only (use ad-hoc approach)
- FAIL: The logic is too complex (break into smaller workflows)

## Workflow Structure

All workflows use **structured Markdown with YAML frontmatter**:

```markdown
---
name: workflow-identifier
goal: What this workflow achieves
termination: Success/failure criteria
inputs:
  - name: input-name
    type: string | number | boolean | file | file-list | enum
    description: What this input is for
    required: true | false
    default: value (if not required)
  - name: max-concurrency
    type: number
    description: Maximum number of agents/tasks that can run in parallel
    required: false
    default: 2
outputs:
  - name: output-name
    type: string | number | boolean | file | file-list | enum
    description: What this output contains
    pattern: file-pattern (for file/file-list types)
---

# Workflow Name

**Purpose**: One-sentence description of what this workflow does.

**When to use**: Specific scenarios where this workflow applies.

## Steps

### 1. Step Name (Execution Mode)

Execution modes: Sequential | Parallel | Conditional

Description of what this step does.

**Agent**: `agent-name`

- **Args**: Key-value pairs or references to inputs/previous outputs
- **Output**: What this step produces
- **Depends on**: Previous step(s) that must complete first (if sequential)
- **Condition**: When this step runs (if conditional)

**Success criteria**: What defines success for this step.
**On failure**: What happens if this step fails.

## Termination Criteria

- PASS: **Success**: Conditions for successful completion
- **Partial**: Conditions for partial success
- FAIL: **Failure**: Conditions for failure

## Example Usage

Concrete examples of how to invoke this workflow.

## Related Workflows

Links to workflows that compose with this one.

## Notes

Additional context, limitations, or important considerations.
```

### YAML Syntax Requirements

**CRITICAL**: All YAML frontmatter values containing special characters MUST be wrapped in quotes to prevent parser errors in some YAML parsers.

**Characters requiring quotes**:

- Colon `:` (most common)
- Square brackets `[`, `]`
- Curly braces `{`, `}`
- Hash `#`
- Ampersand `&`
- Asterisk `*`
- Exclamation mark `!`
- Pipe `|`
- Greater-than `>`
- Single quote `'`
- Double quote `"`
- Percent `%`
- At sign `@`
- Backtick `` ` ``

**Quoting guidelines**:

- Use double quotes `"` for consistency
- Quote ALL values containing special characters, not just the character itself
- Escape inner quotes if needed: `"Description with "quoted" text"`
- Quote complex descriptions containing colons (e.g., mode descriptions with multiple options)

**Examples**:

Good:

```yaml
description: "Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)"
goal: "Validate repository consistency across all layers, apply fixes iteratively until zero findings achieved"
values: [lax, normal, strict, ocd]
```

Bad:

```yaml
description: Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)
goal: Validate repository consistency across all layers, apply fixes iteratively until zero findings achieved
values: [lax, normal, strict, ocd]  # This is OK - arrays are fine without quotes
```

**Why this matters**:

- Unquoted colons break some YAML parsers (they may display raw frontmatter or fail to load)
- YAML parsers interpret unquoted special characters as syntax, not content
- Quoted values ensure consistent parsing across all tools (GitHub, static site generators, editor previews)

## File Naming Convention

All workflow files follow the plain-name pattern (no prefix), organized by subdirectory:

```
[workflow-identifier].md
```

- **No prefix**: Workflow files use plain descriptive names
- **Subdirectory**: Location in `governance/workflows/[category]/` encodes the context
- **Identifier**: Lowercase, hyphen-separated
- **Extension**: `.md`

**Examples**:

- `repository-rules-validation.md` (in `governance/workflows/repository/`)
- `plan-quality-gate.md` (in `governance/workflows/plan/`)
- `quality-gate.md` (in `governance/workflows/docs/`)

**Note**: Workflow files use plain kebab-case names in their respective subdirectories. See [File Naming Convention](../../conventions/structure/file-naming.md) for the current naming rules.

## Step Execution Patterns

Workflows support three step execution patterns:

### Sequential

Steps execute one after another. Later steps can reference outputs from earlier steps.

```markdown
### 1. Build Project (Sequential)

**Agent**: `swe-typescript-dev`

- **Args**: `action: build, project: ayokoding-web`
- **Output**: `{build-artifacts}`

### 2. Run Tests (Sequential)

**Agent**: `plan-execution-checker`

- **Args**: `target: {step1.outputs.build-artifacts}`
- **Depends on**: Step 1 completion
```

### Parallel

Steps execute simultaneously for efficiency.

```markdown
### 1. Validation Suite (Parallel)

Run all validators concurrently:

**Agent**: `docs-checker`

- **Args**: `scope: all`
- **Output**: `{docs-report}`

**Agent**: `docs-tutorial-checker`

- **Args**: `scope: all`
- **Output**: `{tutorial-report}`

**Agent**: `docs-link-general-checker`

- **Args**: `scope: all`
- **Output**: `{links-report}`

**Success criteria**: All three agents complete.
```

### Conditional

Steps execute only if conditions are met.

```markdown
### 3. Apply Fixes (Conditional)

**Agent**: `docs-fixer`

- **Args**: `report: {step1.outputs.docs-report}`
- **Condition**: `{step2.user-approved} == true`

Only runs if user approved fixes in step 2.
```

**Parallelization Control**:

The `max-concurrency` input parameter controls concurrent execution:

- **Default: 2** - Conservative, suitable for most workflows
- **Increase** - Faster execution on capable systems (e.g., 4-8 for multi-validator workflows)
- **Decrease to 1** - Force sequential execution for debugging or resource constraints
- **Set to validator count** - Maximum efficiency when validators are independent

**Notes**:

- System automatically queues excess tasks when limit reached
- Independent validators with no shared state are ideal parallelization candidates
- Consider API rate limits and system resources when setting value
- Monitor execution performance to tune optimal value

## State Management

Workflows pass data between steps using references:

- `{input.name}` - References workflow input
- `{stepN.outputs.name}` - References output from step N
- `{stepN.status}` - References status of step N (success/failure/partial)
- `{stepN.user-approved}` - References user decision from checkpoint

**Example**:

```yaml
inputs:
  - name: scope
    type: string
    required: true
```

```markdown
**Agent**: `docs-checker`

- **Args**: `scope: {input.scope}`
```

## Human Checkpoints

Workflows can pause for human approval:

```markdown
### 3. User Review (Human Checkpoint)

**Prompt**: "Review audit reports. Approve fixes?"

**Options**:

- Approve all → Proceed to step 4
- Approve selective → Proceed to step 4 with selections
- Reject → Terminate (status: fail)

**Timeout**: None (workflow waits indefinitely)
```

Human checkpoints use the `AskUserQuestion` tool when executed.

## Error Handling

Each step defines failure behavior:

```markdown
**On failure**:

- Retry 3 times with exponential backoff
- If still failing, proceed to user review
- User can: skip step, retry manually, terminate workflow
```

Common patterns:

- **Fail fast**: Terminate workflow immediately
- **Continue**: Log error, proceed to next step
- **Retry**: Attempt step again (with limits)
- **User intervention**: Ask user how to proceed
- **Fallback**: Execute alternative step

## Validation

Workflows must be validated before execution:

- PASS: **Frontmatter schema**: All required fields present
- PASS: **Agent references**: All agents exist in `.claude/agents/` (primary) or `.opencode/agent/` (secondary)
- PASS: **Input/output types**: Valid type declarations
- PASS: **Step dependencies**: No circular dependencies
- PASS: **State references**: All references resolve
- PASS: **File naming**: Plain name in correct subdirectory of `governance/workflows/`

Validation performed by `workflow-validator` (future agent).

## Relationship to Other Layers

### Workflows ↔ Principles

Workflows **must respect** all core principles:

- **Explicit Over Implicit**: All steps, dependencies, conditions are explicit
- **Automation Over Manual**: Workflows automate complex multi-step processes
- **Simplicity Over Complexity**: Break complex workflows into smaller composable ones
- **No Time Estimates**: Workflows define WHAT to do, not HOW LONG it takes

### Workflows ↔ Conventions

Workflows **must follow** all conventions:

- File naming, linking, indentation, emoji usage
- All workflow documentation uses Markdown conventions
- Workflows can enforce conventions (e.g., validation workflow runs checkers)

### Workflows ↔ Development

Workflows **implement** development practices:

- Maker-Checker-Fixer pattern IS a workflow
- Implementation workflow (make it work, make it right, make it fast) can be formalized
- Code quality checks can be orchestrated via workflows

### Workflows ↔ Agents

Workflows **orchestrate** agents:

- Workflows call agents, not the reverse
- Agents don't know about workflows (separation of concerns)
- Workflows pass inputs/outputs between agents
- Workflows handle agent failures

### Workflows ↔ Plans

Workflows **operationalize** plans:

- Plans describe WHAT to build (strategic)
- Workflows describe HOW to build it (tactical)
- Plans can reference workflows: "Use deployment-workflow for release"
- Workflows can be generated from plan checklists

## Composability

Workflows can compose with other workflows:

```markdown
### 2. Run Validation Workflow (Nested)

**Workflow**: `docs/quality-gate`

- **Args**: `scope: {input.scope}`
- **Output**: `{validation-status}`

This step executes another workflow.
```

Output from one workflow becomes input to another:

```
content-creation-workflow
    ↓ outputs: new-docs-path
full-docs-validation-workflow
    ↓ outputs: validation-passed
deployment-workflow (uses validation-passed)
```

## \*-check-fix Workflow Pattern

A specialized workflow pattern that achieves **perfect quality state** by fixing ALL findings (CRITICAL, HIGH, MEDIUM, LOW criticality levels) and iterating until ZERO findings remain.

### Pattern Characteristics

**Purpose**: Achieve zero findings across all confidence levels, not "good enough" state.

**When to use**:

- Repository-wide validation (repository-rules-validation)
- Content quality assurance (plan-quality-gate, ayokoding-web-content-quality-gate)
- Pre-release quality gates
- Periodic health checks

**Key Differentiators**:

1. **ALL findings count** - Not just CRITICAL or HIGH criticality, includes MEDIUM and LOW (style, formatting)
2. **Zero findings goal** - Terminates with SUCCESS only when zero findings of any level
3. **Iterative fixing** - Continues check-fix cycles until perfect state or max-iterations
4. **Perfect quality state** - Achieves comprehensive quality, not minimal compliance

### Standard Structure

All \*-check-fix workflows follow this pattern:

```yaml
inputs:
  - name: mode
    type: enum
    values: [lax, normal, strict, ocd]
    description: "Quality threshold (lax: CRITICAL only, normal: CRITICAL/HIGH, strict: +MEDIUM, ocd: all levels)"
    required: false
    default: normal
  - name: max-concurrency
    type: number
    description: Maximum number of agents/tasks that can run concurrently during workflow execution
    required: false
    default: 2
  - name: min-iterations
    type: number
    description: Minimum check-fix cycles before allowing zero-finding termination
    required: false
  - name: max-iterations
    type: number
    description: Maximum check-fix cycles to prevent infinite loops
    required: false
    default: 10

outputs:
  - name: final-status
    type: enum
    values: [pass, partial, fail]
  - name: iterations-completed
    type: number
  - name: final-report
    type: file
```

### Required Steps

**Step 1: Initial Validation**

```markdown
**Agent**: `{domain}-checker`

- Count ALL findings (CRITICAL, HIGH, MEDIUM, LOW)
- Generate audit report
```

**Step 2: Check for Findings**

```markdown
**Condition**: Count findings based on mode level

- **normal**: Count CRITICAL + HIGH only
- **strict**: Count CRITICAL + HIGH + MEDIUM
- **ocd**: Count all levels (CRITICAL, HIGH, MEDIUM, LOW)

**Below-threshold findings**: Report but don't block success

- **normal**: MEDIUM/LOW reported, not counted
- **strict**: LOW reported, not counted
- **ocd**: All findings counted

**Decision**:

- If threshold-level findings > 0: Proceed to fixing (reset `consecutive_zero_count` to 0)
- If threshold-level findings = 0: Initialize `consecutive_zero_count` to 1 (this check is the first
  zero), proceed to Step 4 for confirmation re-check (see Consecutive Pass Requirement)
```

**Step 3: Apply Fixes**

```markdown
**Agent**: `{domain}-fixer`

- **Args**: `report: {audit-report}, approved: all, mode: {input.mode}`
- **Fix scope based on mode**:
  - **normal**: Fix CRITICAL + HIGH only (skip MEDIUM/LOW)
  - **strict**: Fix CRITICAL + HIGH + MEDIUM (skip LOW)
  - **ocd**: Fix all levels (CRITICAL, HIGH, MEDIUM, LOW)
- Re-validate before applying each fix
- Apply HIGH confidence fixes automatically within scope
- Flag MEDIUM confidence for manual review
```

**Step 4: Re-validate**

```markdown
**Agent**: `{domain}-checker`

- Verify fixes resolved issues
- Detect any new issues introduced
```

**Step 5: Iteration Control**

```markdown
**Logic**:

- Count findings based on mode level (same as Step 2):
  - **normal**: Count CRITICAL + HIGH
  - **strict**: Count CRITICAL + HIGH + MEDIUM
  - **ocd**: Count all levels
- Track `consecutive_zero_count` across iterations:
  - If threshold-level findings = 0: increment `consecutive_zero_count`
  - If threshold-level findings > 0: reset `consecutive_zero_count` to 0
- If consecutive_zero_count >= 2 AND iterations >= min-iterations: Success (double-zero confirmed)
- If consecutive_zero_count >= 2 AND iterations < min-iterations: Loop back to Step 4 (re-validate)
- If consecutive_zero_count < 2 AND threshold-level findings = 0: Loop back to Step 4
  (confirmation check — no fix needed, just re-verify)
- If threshold-level findings > 0 AND iterations >= max-iterations: Partial
- If threshold-level findings > 0 AND iterations < max-iterations: Loop back to Step 3 (fix)

**Below-threshold findings**: Continue to be reported in audit but don't affect iteration logic

**Note**: Each check iteration (whether after a fix or a confirmation re-check) counts toward
both `iterations` and `max-iterations`. The minimum iterations to achieve success is 2
(two consecutive zero-finding checks), even when `min-iterations` is not set.
```

### Termination Criteria (Mandatory)

All \*-check-fix workflows MUST use termination criteria based on mode level:

**Success** (`pass`):

- Requires **two consecutive** zero-finding validations at the mode's threshold level (consecutive pass requirement)
- **normal**: Zero CRITICAL/HIGH findings on 2 consecutive checks (MEDIUM/LOW may exist)
- **strict**: Zero CRITICAL/HIGH/MEDIUM findings on 2 consecutive checks (LOW may exist)
- **ocd**: Zero findings at all levels on 2 consecutive checks

**Partial** (`partial`):

- Threshold-level findings remain after max-iterations safety limit

**Failure** (`fail`):

- Technical errors during check or fix

**Note**: Below-threshold findings are reported in final audit but don't prevent success status.

### Consecutive Pass Requirement

All \*-check-fix workflows require **two consecutive zero-finding validations** before declaring
success. A single zero-finding check is insufficient — the checker must confirm zero findings
on a second independent run before the workflow terminates with `pass`.

**Rationale**: A single zero-finding check may be a false negative. Checker agents operate
non-deterministically — prompt variation, context window limitations, or evaluation order can
cause a checker to miss findings on one run that it catches on the next. Requiring two
consecutive zero-finding checks provides statistical confidence that the content truly meets
the quality standard for the active mode.

**Mechanism**:

- The workflow tracks `consecutive_zero_count` across check iterations
- Each zero-finding check increments the counter; any non-zero check resets it to 0
- Success requires `consecutive_zero_count >= 2`

**Impact on workflow flow**:

- After the first zero-finding check, the workflow loops back to Step 4 (re-validate) — no fix
  is needed, just a confirmation re-check
- If the confirmation check also returns zero findings, the workflow succeeds (double-zero)
- If the confirmation check finds new issues, the counter resets and the workflow loops back to
  Step 3 (fix) — then the cycle continues

**Impact on iteration budget**:

- The minimum iterations to achieve success is **2** (initial zero + confirmation zero), even
  when `min-iterations` is not explicitly set
- Each confirmation re-check counts toward `max-iterations`, so the default `max-iterations: 15`
  allows ample room for fix cycles and confirmation checks
- Workflows with `max-iterations: 1` can never achieve `pass` — they will always terminate
  with `partial` at best

**Applies to all modes**: lax, normal, strict, and ocd all require double-zero confirmation.
No mode is exempt.

### Safety Features (Mandatory)

**Infinite Loop Prevention**:

- MUST include `max-iterations` parameter (default: 10)
- MUST terminate with `partial` if limit reached
- MUST track iteration count

**False Positive Protection**:

- Fixer MUST re-validate each finding before applying
- Fixer MUST skip FALSE_POSITIVE findings
- Checker MUST use progressive writing

### Strictness Parameter Usage

The `mode` parameter controls which criticality levels must reach zero for workflow success.

**Lax Mode** (minimal validation):

```
User: "Run [workflow-name] in lax mode"
```

Fixes CRITICAL only, reports HIGH/MEDIUM/LOW. Success when zero CRITICAL findings remain.

**Normal Mode** (default - everyday validation):

```
User: "Run [workflow-name] in normal mode"
```

Fixes CRITICAL/HIGH, reports MEDIUM/LOW. Success when zero CRITICAL/HIGH findings remain.

**Strict Mode** (pre-release validation):

```
User: "Run [workflow-name] in strict mode"
```

Fixes CRITICAL/HIGH/MEDIUM, reports LOW. Success when zero CRITICAL/HIGH/MEDIUM findings remain.

**OCD Mode** (comprehensive audit):

```
User: "Run [workflow-name] in ocd mode"
```

Fixes all levels, zero tolerance. Success when zero findings at all levels.

**Combined with iteration bounds**:

```
User: "Run [workflow-name] in strict mode with min-iterations=2 and max-iterations=10"
```

Applies mode-based fixing with iteration limits.

### Example Implementation

See [Repository Rules Validation Workflow](../repository/repository-rules-validation.md) for canonical implementation.

### Key Differences from Basic Validation Workflow

| Aspect             | Basic Validation Workflow        | \*-check-fix Workflow Pattern              |
| ------------------ | -------------------------------- | ------------------------------------------ |
| **Goal**           | Identify issues                  | Achieve zero findings                      |
| **Iteration**      | Single pass                      | Iterative until zero or max-limit          |
| **Findings Scope** | May focus on HIGH/MEDIUM only    | ALL findings (CRITICAL, HIGH, MEDIUM, LOW) |
| **Termination**    | After single check               | Zero findings or max-iterations            |
| **Quality Target** | Good enough (major issues fixed) | Perfect state (all issues fixed)           |
| **Human Approval** | May require checkpoints          | Fully automated                            |
| **Safety Limit**   | Not required                     | REQUIRED (max-iterations)                  |

## Example Workflow Structure

Here's a simplified example of a multi-step validation workflow:

```markdown
---
name: content-validation
goal: Validate content quality and apply fixes
termination: Content passes all quality checks
inputs:
  - name: content-type
    type: enum
    values: [docs, ayokoding, ose-platform, readme]
    required: true
  - name: scope
    type: string
    required: true
  - name: mode
    type: enum
    values: [lax, normal, strict, ocd]
    description: "Quality threshold"
    required: false
    default: normal
outputs:
  - name: validation-status
    type: enum
    values: [pass, partial, fail]
---

# Content Validation Workflow

**Purpose**: Validate and fix content quality iteratively until zero findings achieved.

**When to use**: After creating or updating content.

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `{input.content-type}-checker` and
`{input.content-type}-fixer` via the Agent tool with `subagent_type` when these
agents exist as defined subagent types.

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using
Read/Write/Edit tools when Agent Delegation is unavailable.
```

User: "Run content validation workflow for [scope] in [mode] mode"

```

The AI invokes specialized agents via the Agent tool. If agents are unavailable as
subagent types, it falls back to executing workflow logic directly.

## Steps

### 1. Validate Content (Sequential)

**Agent**: `{input.content-type}-checker`

- Validate content in scope
- Generate audit report in generated-reports/

### 2. Apply Fixes (Sequential)

**Agent**: `{input.content-type}-fixer`

- Read audit report from step 1
- Apply fixes based on mode level
- Generate fix report

### 3. Iteration Control (Sequential)

- Re-validate content
- If zero threshold-level findings: Success
- If findings remain and under max-iterations: Loop to step 2

## Termination Criteria

- PASS: Success: Zero threshold-level findings (based on mode)
- Partial: Findings remain after max-iterations
- FAIL: Failure: Technical errors
```

## Documentation Requirements

All workflows must include:

- **Purpose**: One-sentence what and why
- **When to use**: Specific scenarios
- **Steps**: Numbered, with execution mode
- **Agent references**: Explicit agent names
- **Success/failure criteria**: Clear definitions
- **Example usage**: Concrete invocation examples
- **Related workflows**: Composition opportunities

## Future Enhancements

Potential workflow features (not yet implemented):

- **Retry policies**: Exponential backoff, max attempts
- **Timeouts**: Maximum execution time per step/workflow
- **Rollback**: Undo steps on failure
- **Metrics**: Execution time, success rate, failure modes
- **Visualization**: Auto-generate diagrams from workflow definitions
- **Testing**: Workflow validation and dry-run mode

## Token Budget Philosophy

**CRITICAL GUIDELINE**: When orchestrating workflows (`governance/workflows/`), **do NOT think about token budget constraints**.

Workflows naturally consume more tokens than single agent invocations because they:

- Execute multiple agents in sequence
- Maintain state between steps
- Generate multiple reports
- Iterate until quality goals are met
- Handle conditional logic and parallel execution

**This is expected and acceptable.** The reliable compaction mechanism handles context management. Focus on correct, thorough workflow execution quality, not token usage.

## Principles Implemented/Respected

**REQUIRED SECTION**: All workflow documents MUST include this section to ensure traceability from workflow patterns back to foundational values.

This convention respects:

- PASS: **Explicit Over Implicit**: All workflow logic is visible in markdown
- PASS: **Automation Over Manual**: Workflows automate complex multi-agent tasks
- PASS: **Simplicity Over Complexity**: Structured markdown, not complex DSL
- PASS: **Progressive Disclosure**: Simple workflows stay simple, complex is possible
- PASS: **Accessibility First**: Human-readable format, clear documentation
- PASS: **No Time Estimates**: Focus on what/how, not duration

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices back to conventions.

This convention implements/respects:

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Workflow files follow plain name pattern (no prefix) in `governance/workflows/` subdirectories, as defined by the file naming convention
- **[AI Agents Convention](../../development/agents/ai-agents.md)**: Workflows orchestrate agents defined and governed by the AI Agents Convention; agent names referenced in workflow files must match agent names in `.claude/agents/`
- **[Linking Convention](../../conventions/formatting/linking.md)**: All workflow cross-references use GitHub-compatible markdown links with `.md` extension and relative paths

## Related Documentation

- [AI Agents Convention](../../development/agents/ai-agents.md) - How agents work
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core workflow pattern
- [Plans Organization](../../conventions/structure/plans.md) - How plans relate to workflows
- [Implementation Workflow](../../development/workflow/implementation.md) - Development process workflow
- [Workflows Index](../README.md) - All available workflows

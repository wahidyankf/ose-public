---
title: "Workflow Execution Mode Convention"
description: Defines execution modes for workflows — Agent Delegation (preferred) and Manual Orchestration (fallback) — explaining how to use the Agent tool for subagent invocation and when to fall back to direct execution
category: explanation
subcategory: workflows
tags:
  - workflows
  - execution-mode
  - orchestration
  - conventions
created: 2026-01-05
---

# Workflow Execution Mode Convention

## Overview

This convention defines the execution modes for workflows in this repository: **Agent Delegation** (preferred) and **Manual Orchestration** (fallback). Understanding both modes is essential for executing workflows that require persistent file changes.

## The Core Challenge

Workflows orchestrate multiple agents (checker → fixer → checker loops, etc.) to achieve quality outcomes. File changes must persist to the actual filesystem for workflow outcomes to be durable.

**Two solutions exist**:

- **Agent Delegation** (preferred): Use the Agent tool with `subagent_type` to invoke specialized agents. Agent tool subagents persist file changes to the actual filesystem.
- **Manual Orchestration** (fallback): Execute workflow logic directly in the main context using Read/Write/Edit tools when agents are not available as defined subagent types.

## Execution Modes

### Agent Delegation Mode (Preferred)

#### Description

Invoke specialized agents via the Agent tool with `subagent_type` when the workflow references agents that exist as defined subagent types.

**Characteristics**:

- Specialized agents execute in dedicated subagent contexts
- File changes persist to the actual filesystem
- Agents bring their full specialized knowledge and validation rules
- Agent tool subagents are distinct from the Task tool: file changes DO persist
- SHOULD be used when the workflow's checker/fixer agents exist as defined subagent types

#### When to Use Agent Delegation

- PASS: Workflow step references a named agent (e.g., `plan-checker`, `repo-rules-fixer`)
- PASS: That agent exists as a defined subagent_type in `.claude/agents/`
- PASS: The step requires persistent file changes (audit reports, fixes)
- PASS: You want the agent's full specialized validation/fixing logic applied

#### Example Usage

```
User: "Run plan quality gate workflow for plans/backlog/my-plan/"
AI: [Invokes plan-checker via Agent tool]
1. Agent tool invokes plan-checker subagent
   → plan-checker reads plan files, validates, writes audit report to generated-reports/
   → audit report persists on filesystem
2. Agent tool invokes plan-fixer subagent with audit report path
   → plan-fixer reads audit, applies fixes to plan files, writes fix report
   → fixes and fix report persist on filesystem
3. Repeat until zero findings
4. Show git status with modified files
5. Wait for user commit approval
```

#### Agent Delegation Pattern

When a workflow step references an agent, invoke it via the Agent tool:

```
Agent tool invocation:
  subagent_type: plan-checker
  prompt: "Validate plans/backlog/my-plan/ and write audit report"

Agent tool invocation:
  subagent_type: plan-fixer
  prompt: "Apply fixes from generated-reports/plan__abc123__2026-03-24--10-00__audit.md"
```

#### Expected Behavior

- Real audit reports created in `generated-reports/`
- Real fixes applied to target files
- Real fix reports documenting changes
- Changes visible in `git status`
- User can commit changes when satisfied

### Manual Orchestration Mode (Fallback)

#### Description

User or AI assistant follows workflow steps directly using tools in main context when agents are not available as defined subagent types.

**Characteristics**:

- AI assistant executes workflow logic directly
- Direct tool usage (Read, Write, Edit, Bash) in main context
- Manual iteration control (user decides when to continue)
- Step-by-step execution with visibility at each stage
- File changes persist to actual filesystem

#### When to Use Manual Orchestration

- PASS: Workflow agents are not available as defined subagent types
- PASS: You want step-by-step visibility and granular control
- PASS: You want to review changes between each step
- PASS: Agent delegation is unavailable or fails

#### Example Usage

```
User: "Run plan quality gate workflow for plans/backlog/my-plan/ in manual mode"
AI: [Executes workflow steps directly]
1. Reads plan files (Read tool)
2. Validates content (checker logic)
3. Writes audit report (Write tool to generated-reports/)
4. Applies fixes (Edit tool on plan files)
5. Writes fix report (Write tool to generated-reports/)
6. Re-validates (checker logic again)
7. Iterates until zero findings
```

#### Use Task Tool (Isolated) When

- PASS: Agent only reads and analyzes (no file modifications needed)
- PASS: Exploratory research and recommendations
- PASS: Information gathering without side effects
- PASS: Analysis that doesn't require persisting results

**Examples**:

- Code exploration and understanding
- Research tasks (web search + analysis)
- Answering questions about codebase
- Planning without implementation

## Execution Mode Decision Flow

```
Workflow step references a named agent?
├── YES → Agent exists as defined subagent_type in .claude/agents/?
│   ├── YES → Use Agent Delegation (preferred)
│   └── NO  → Use Manual Orchestration (fallback)
└── NO  → Use Manual Orchestration
```

## Manual Mode Execution Pattern

### Step-by-Step Guide

**Step 1: Initialize Workflow Context**

- Generate UUID for execution tracking
- Determine workflow scope (files to process)
- Set iteration counter to 0

**Step 2: Execute Checker Logic**

```markdown
1. Read all files in scope
2. Apply validation rules
3. Categorize findings by criticality
4. Generate UUID chain for report
5. Write audit report to generated-reports/
   Pattern: {agent-family}**{uuid}**{timestamp}\_\_audit.md
6. Report findings summary to user
```

**Step 3: Check Termination Criteria**

```markdown
If findings = 0 AND iterations >= min-iterations (if set):
→ Go to Step 6 (Success)
If findings = 0 AND iterations < min-iterations:
→ Go to Step 4 (continue iterating)
If findings > 0 AND iterations >= max-iterations (if set):
→ Go to Step 6 (Partial success)
If findings > 0 AND (no max-iterations OR iterations < max-iterations):
→ Go to Step 4 (apply fixes)
```

**Step 4: Execute Fixer Logic**

```markdown
1. Read audit report from Step 2
2. Re-validate each finding:
   - Confirms issue exists → assess confidence
   - Issue resolved → skip (stale finding)
   - Issue never existed → FALSE_POSITIVE
3. Apply HIGH confidence fixes using Edit tool
4. Skip MEDIUM confidence (manual review needed)
5. Write fix report to generated-reports/
   Pattern: {agent-family}**{uuid}**{timestamp}\_\_fix.md
6. Report fixes applied to user
```

**Step 5: Iterate**

```markdown
1. Increment iteration counter
2. Go back to Step 2 (Execute Checker Logic)
```

**Step 6: Finalize**

```markdown
1. Report final status:
   - PASS: Success (zero findings)
   - Partial (findings remain after max-iterations)
   - FAIL: Failure (errors during execution)
2. Show git status (modified files)
3. Wait for user commit approval
```

## Implementation Example

### Workflow Document Structure

Every workflow should include an "Execution Mode" section:

````markdown
# My Workflow Name

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `{checker-agent}` and `{fixer-agent}` via the
Agent tool with `subagent_type` when these agents exist as defined subagent types.

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using
Read/Write/Edit tools when Agent Delegation is unavailable.

**How to Execute**:

```
User: "Run my-workflow for [scope]"
```

The AI will invoke specialized agents via the Agent tool. If agents are unavailable as
subagent types, it will fall back to executing the workflow steps directly.

## Steps

[Workflow steps as usual...]
````

## Future Considerations

### Potential Automation

In the future, a workflow runner could be developed to automate workflow execution:

- Execute workflows with full tool access
- Manage iteration state and termination criteria
- Aggregate reports and provide summaries
- Reduce manual effort for repetitive workflows

**Note**: Manual orchestration mode would remain supported as a fallback mechanism.

### When Developing Workflow Runner

1. Ensure backward compatibility with manual mode
2. Support both `workflow run` and manual mode invocation patterns
3. Maintain file persistence guarantees
4. Provide transparent execution status and progress tracking

## Tool Usage Rules

### For AI Assistant Using Agent Delegation

**Agent Invocation**:

- PASS: Use the Agent tool with `subagent_type` matching the workflow's named agent
- PASS: Pass the relevant scope, report paths, and mode parameters in the prompt
- PASS: File operations performed by the subagent persist to the actual filesystem
- PASS: Collect subagent outputs (report paths) to pass to subsequent steps

### For AI Assistant in Manual Mode

**File Operations** (when executing workflow logic directly):

- PASS: Use Write tool for creating new files (audit reports, fix reports)
- PASS: Use Edit tool for modifying existing files (applying fixes)
- PASS: Use Bash tool for UUID generation, timestamps
- PASS: All operations persist to actual filesystem

## Common Pitfalls

### FAIL: Pitfall 1: Confusing Agent tool and Task tool

**Important distinction**:

- **Agent tool** (`subagent_type`): Subagent runs with file system access — Write/Edit changes **DO persist**
- **Task tool**: Agent runs in isolated context — Write/Edit changes **do NOT persist**

```
Agent tool (correct for workflows requiring persistence):
  subagent_type: plan-checker → writes audit report → PERSISTS

Task tool (wrong for workflows requiring persistence):
  Task(plan-checker) → isolated context → audit report does NOT persist
```

### FAIL: Pitfall 2: Using Manual Orchestration when Agent Delegation is available

**Wrong**:

```
Execute checker logic directly in main context
Execute fixer logic directly in main context
```

**Right** (when agents exist as subagent types):

```
Agent tool invokes plan-checker subagent → audit report persists
Agent tool invokes plan-fixer subagent → fixes persist
```

### FAIL: Pitfall 3: Expecting automated iteration in manual mode

**Wrong**: Assume workflow will iterate automatically until zero findings

**Right**: Manually control iteration, review between cycles

### FAIL: Pitfall 4: Not checking git status after workflow

**Wrong**: Assume changes didn't happen because no visual feedback

**Right**: Always run `git status` to see persisted changes

## Principles Implemented/Respected

- PASS: **Explicit Over Implicit**: Clear description of execution mode behavior
- PASS: **Simplicity Over Complexity**: Two clearly defined modes with explicit decision flow
- PASS: **Documentation First**: Document current reality, not ideal future state
- PASS: **No Time Estimates**: Focus on what to do, not how long it takes
- PASS: **Automation Over Manual**: Agent Delegation preferred over manual execution

## Conventions Implemented/Respected

- PASS: **Workflow Pattern Convention**: Defines execution mode for workflows
- PASS: **AI Agents Convention**: Explains agent invocation patterns
- PASS: **Temporary Files Convention**: Audit/fix reports in generated-reports/

## Related Documentation

- [Workflow Pattern Convention](./workflow-identifier.md) - Overall workflow structure
- [Plan Quality Gate Workflow](../plan/plan-quality-gate.md) - Example workflow using agent delegation
- [AI Agents Convention](../../development/agents/ai-agents.md) - Agent invocation patterns
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Validation workflow pattern

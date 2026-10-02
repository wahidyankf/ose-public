---
description: "States that workflows require direct execution, covers the current Task-tool isolation limitation, and gives worked invocation-pattern examples."
when_to_use: Use when an agent needs conversation continuity and you must judge whether Task-tool isolation is a blocker.
---

# Agent Invocation Patterns — Workflow Execution, Current Limitation, and Examples

## Workflows Require Direct Execution

**Critical**: Workflows orchestrating multiple agents (checker → fixer loops) MUST use direct execution pattern.

**Why**: Workflows need to:

- Persist audit reports for user review
- Apply real fixes to files
- Generate fix reports
- Allow git commit of changes

**See**: [Workflow Execution Modes Convention](../../../conventions/structure/workflow-pattern/execution-modes.md) for complete workflow execution patterns.

## Current Limitation: Task Tool Isolation

**Fundamental Issue**: The Task tool runs agents in isolated subprocesses where file operations don't persist to the actual filesystem.

**Impact**:

- FAIL: Audit reports written by checker agents don't appear in `local-tmp/<agent-family>/`
- FAIL: Fixes applied by fixer agents don't modify actual files
- FAIL: Changes aren't visible in `git status`
- FAIL: Workflows requiring file persistence cannot use Task tool

**Workaround**: Use direct execution pattern for agents requiring file persistence.

**Future**: When workflow runner is implemented, it will orchestrate agents in main context with full file persistence.

## Examples

**FAIL: Wrong - Using Task Tool for Fixer**:

```
Task(docs-fixer, "apply fixes from audit report")
→ Fixes applied in isolated context
→ Real plan files unchanged
→ git status shows nothing
```

**PASS: Right - Direct Execution for Fixer**:

```
User: "Apply plan fixes in manual mode"
→ Execute docs-fixer logic directly
→ Edit tool modifies real plan files
→ Write tool creates real fix report
→ git status shows modified files
```

**PASS: Right - Using Task Tool for Research**:

```
Task(Explore, "find authentication code")
→ Analysis in isolated context (OK)
→ No file modifications needed
→ Results returned in conversation
```

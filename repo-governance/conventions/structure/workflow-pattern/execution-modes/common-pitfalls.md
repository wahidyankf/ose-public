---
description: Four recurring mistakes when choosing or executing an execution mode, each with the wrong and right pattern.
when_to_use: Use when debugging why a workflow's file changes didn't persist or iteration behaved unexpectedly.
---

# Common Pitfalls

## Pitfall 1: Confusing Agent tool and Task tool

**Important distinction**:

- **Agent tool** (`subagent_type`): Delegated agent runs with file system access — Write/Edit changes **DO persist**
- **Task tool**: Agent runs in isolated context — Write/Edit changes **do NOT persist**

```
Agent tool (correct for workflows requiring persistence):
  subagent_type: plan-checker → writes audit report → PERSISTS

Task tool (wrong for workflows requiring persistence):
  Task(plan-checker) → isolated context → audit report does NOT persist
```

## Pitfall 2: Using Manual Orchestration when Agent Delegation is available

**Wrong**:

```
Execute checker logic directly in main context
Execute fixer logic directly in main context
```

**Right** (when agents exist as delegated agent types):

```
Agent tool invokes plan-checker subagent → audit report persists
Agent tool invokes plan-fixer subagent → fixes persist
```

## Pitfall 3: Expecting automated iteration in manual mode

**Wrong**: Assume workflow will iterate automatically, or past its three-cycle ceiling

**Right**: Manually control iteration, review between cycles

## Pitfall 4: Not checking git status after workflow

**Wrong**: Assume changes didn't happen because no visual feedback

**Right**: Always run `git status` to see persisted changes

---
description: "Defines the two agent invocation patterns (Task tool vs. direct execution) and the decision matrix for choosing between them."
when_to_use: Use when deciding whether an agent should be invoked via the Task tool or executed directly in the main context.
---

# Agent Invocation Patterns — Patterns and Decision Matrix

Agents can be invoked in two ways, each with different implications for file persistence and execution context.

## Pattern 1: Task Tool Invocation (Isolated Context)

**Use When**: Agent performs analysis, research, or information gathering without needing to persist file changes.

**Characteristics**:

- Agent runs in isolated subprocess context
- File operations (Write, Edit) don't persist to actual filesystem
- Results returned to main conversation only
- Suitable for read-only operations

**Example Use Cases**:

- Code exploration and understanding
- Research tasks (WebSearch + analysis)
- Answering questions about codebase
- Planning without implementation
- Information gathering
- Recommendations and suggestions

**Invocation**:

```
Task(agent-name, "analyze codebase structure")
```

**Limitation**: FAIL: File changes don't persist - Write/Edit operations stay in isolated context

## Pattern 2: Direct Execution (Main Context)

**Use When**: Agent must persist file changes (Write, Edit operations) or workflow requires file modification.

**Characteristics**:

- Logic executes in main Claude instance context
- File operations persist to actual filesystem
- Changes visible in `git status`
- Required for workflows with validation-fixing loops

**Example Use Cases**:

- Checker agents (Write audit reports to `local-tmp/<agent-family>/`)
- Fixer agents (Edit files to apply fixes, Write fix reports)
- Maker agents (Write/Edit content files)
- Workflows requiring iteration (check → fix → check loops)
- Any operation requiring git-committable changes

**Execution Pattern**:

```
User: "Run [agent-name] logic for [scope]"

Claude: [Executes agent logic directly]
1. Uses Read tools to analyze
2. Uses Write/Edit tools to modify files
3. Changes persist to filesystem
4. User can see changes in git status
```

**Requirement**: PASS: File changes persist - all Write/Edit operations affect real files

## Decision Matrix: Which Pattern to Use?

| Agent Type                                | Needs File Persistence? | Use Pattern      | Invocation                 |
| ----------------------------------------- | ----------------------- | ---------------- | -------------------------- |
| **Exploration** (Explore agent)           | FAIL: No                | Task tool        | `Task(Explore, "find X")`  |
| **Research** (analysis only)              | FAIL: No                | Task tool        | `Task(agent, "analyze Y")` |
| **Checker** (writes audit reports)        | PASS: Yes               | Direct execution | Execute checker logic      |
| **Fixer** (applies fixes, writes reports) | PASS: Yes               | Direct execution | Execute fixer logic        |
| **Maker** (creates/updates content)       | PASS: Yes               | Direct execution | Execute maker logic        |
| **Deployer** (modifies configs)           | PASS: Yes               | Dispatch         | `Task(swe-developer, ...)` |
| **Workflow** (iterative check-fix)        | PASS: Yes               | Direct execution | Manual orchestration       |

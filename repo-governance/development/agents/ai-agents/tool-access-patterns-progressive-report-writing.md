---
description: "Continues the report-generating agent tool requirements: the progressive-writing requirement and its implementation steps."
when_to_use: Use when implementing or reviewing how a checker agent writes its audit report progressively.
---

# Tool Access Patterns — Report-Generating Agents: Mandatory Tool Requirements (Continued)

**PROGRESSIVE WRITING REQUIREMENT**:

**CRITICAL BEHAVIOURAL REQUIREMENT**: ALL \*-checker agents MUST write reports PROGRESSIVELY (continuously updating files during execution), NOT buffering findings in memory to write once at the end.

**Why this is mandatory:**

- **Context compaction survival**: During long audits, the AI coding agent may compact/summarize conversation context. If agent only writes at the END, file contents may be lost during compaction.
- **Real-time persistence**: File continuously updated THROUGHOUT execution ensures findings persist regardless of context compaction.
- **Behavioural, not optional**: This is a hard requirement for all checker agents.

**Implementation requirement:**

1. **Initialize file at execution start** - Create report file with header and "In Progress" status immediately
2. **Write findings progressively** - Each validated item written to file immediately after checking (not buffered)
3. **Update continuously** - Progress indicator and running totals updated throughout execution
4. **Finalize on completion** - Update status to "Complete" with final summary statistics

See [Temporary Files Convention - Progressive Writing Requirement](../../infra/temporary-files/generated-reports-and-progressive-writing.md#progressive-writing-requirement-for-checker-agents) for complete details, patterns, and examples.

**Example frontmatter**:

```yaml
---
name: rules-checker
description: Validates consistency between agents, AGENTS.md, conventions, and documentation.
tools: Read, Glob, Grep, Write, Bash
model: sonnet
color: green
---
```

**Verification**: When creating or updating report-generating agents, verify both Write and Bash are present in the tools list.

See [Temporary Files Convention](../../infra/temporary-files.md) for complete details on report naming patterns, mandatory checker requirements, and timestamp generation.

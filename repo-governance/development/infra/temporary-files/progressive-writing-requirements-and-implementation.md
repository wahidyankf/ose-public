---
description: The five progressive-writing requirements and the checker-agent list subject to the rule.
when_to_use: Use when writing a checker agent's progressive-writing instructions.
---

# Progressive Writing Requirement — Requirements and Implementation Pattern

Continues [Directory Purposes — generated-reports/ and Progressive Writing Requirement](./generated-reports-and-progressive-writing.md).

**Requirements for All \*-Checker Agents:**

1. **Initialize file immediately** at start of agent execution (not at the end)
   - Use `Write` tool to create report file with header
   - Document creation timestamp and status "In Progress"
   - Each section added as discovered

2. **Write findings progressively** as they are discovered
   - Each validated item written to file immediately after checking
   - Use `Edit` or `Write` tool to append/update findings
   - Include interim status updates

3. **Update file continuously** throughout execution
   - Current progress indicator shown in file
   - Running totals updated
   - Any findings from this point forward are persisted

4. **Final update with completion status** when done
   - Update "In Progress" → "Complete"
   - Provide final summary statistics
   - File is fully persisted before agent finishes

5. **NO buffering in conversation** of findings to write later
   - Each finding must be written to file immediately
   - Conversation output is SUPPLEMENTARY (summary), not the source

**Implementation Pattern:**

All checker agents should follow this structure in their instructions:

```
## File Output Strategy

This agent writes findings PROGRESSIVELY to ensure survival through context compaction:

1. **Initialize** report file at execution start with header and "In Progress" status
2. **Validate** each item and write findings immediately to file (not buffered)
3. **Update** file continuously with progress indicator and running totals
4. **Finalize** with completion status and summary statistics
5. **Never** buffer findings in memory - write immediately after each validation

Report file: local-tmp/{agent-family}/{agent-family}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md

This progressive approach ensures findings persist even if context is compacted during long audits.
```

**Checker Agents Subject to This Requirement:**

ALL \*-checker agents must implement progressive writing:

1. rules-checker
2. content-checker
3. tutorial-by-example-checker
4. content-checker
5. apps-ayokoding-www-link-checker
6. content-checker
7. docs-checker
8. docs-link-checker
9. docs-tutorial-checker
10. readme-checker
11. plan-checker
12. plan-execution-checker
13. tutorial-in-the-field-checker
14. docs-software-engineering-separation-checker
15. repo-workflow-checker
16. specs-checker
17. swe-reviewer

**Validation**: See rules-checker agent for validation rules that verify progressive writing compliance across all checker agents.

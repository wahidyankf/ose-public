---
description: "Explains how to invoke the specs quality-gate workflow (agent delegation vs manual orchestration), and clarifies exactly which folders and content types it validates."
when_to_use: "Use when deciding whether to run this workflow via agent delegation or manual orchestration, or to confirm what falls inside or outside its validation scope."
---

# Execution Mode and Scope

**Key Design Principle**: This workflow only validates folders you explicitly list. It does not
discover or scan the entire specs/ tree. Subfolders are included automatically — listing
`specs/apps/organiclever` includes `specs/apps/organiclever/be/behaviours/`, etc.
When multiple folders are listed, cross-folder consistency is checked between them (contradictions,
coverage gaps, terminology drift).

**Scope Clarification**:

This workflow validates **specification files only** in listed folders. It does NOT validate:

- Implementation code in `apps/` (that's `swe-code-maker` and CI)
- Test binding substance (use `gherkin-implementation-review`)
- Governance docs (that's `rules-checker`)
- Spec folders NOT in the explicit list

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `specs-checker` and `specs-fixer` via the
Agent tool with `subagent_type`
(see [Workflow Execution Modes Convention](../../meta/execution-modes.md)).

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using
Read/Write/Edit tools when Agent Delegation is unavailable.

The Agent tool runs delegated agents that persist file changes to the actual filesystem, making it
the preferred approach when these agents exist as defined delegated agent types.

**How to Execute**:

```
User: "Run specs validation for specs/apps/organiclever-be"
User: "Run specs validation for specs/apps/organiclever-be and specs/apps/organiclever in strict mode"
User: "Run specs validation for specs/apps/organiclever-be, specs/apps/organiclever, specs/apps/ayokoding with max-iterations=5"
```

The AI will:

1. Invoke `specs-checker` via the Agent tool for the listed folders (reads, validates, writes audit)
2. Check cross-folder consistency if 2+ folders listed
3. Invoke `specs-fixer` via the Agent tool (reads audit, applies fixes within listed folders only)
4. Iterate until zero findings achieved at the configured threshold
5. Show git status with modified files
6. Wait for user commit approval

**Fallback (Manual Mode)**:

```
User: "Run specs validation for specs/apps/organiclever-be in manual mode"
```

The AI executes checker and fixer logic directly using Read/Write/Edit tools in the main
context — use this when agent delegation is unavailable.

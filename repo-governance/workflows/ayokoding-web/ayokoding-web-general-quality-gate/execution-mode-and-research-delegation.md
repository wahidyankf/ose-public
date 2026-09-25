---
description: Describes the Agent Delegation (preferred) and Manual Orchestration (fallback) execution modes for the general quality gate, and how the facts-checker delegates deep web research.
when_to_use: Use when deciding whether to run this quality gate via Agent tool delegation or manually, or when understanding how factual research is delegated.
---

# Execution Mode and Research Delegation

## Execution Mode

**Preferred Mode**: Agent Delegation — invoke `apps-ayokoding-www-general-checker`,
`apps-ayokoding-www-facts-checker`,
`apps-ayokoding-www-link-checker`, `apps-ayokoding-www-general-fixer`,
and `apps-ayokoding-www-facts-fixer`
via the Agent tool with `subagent_type`
(see [Workflow Execution Modes Convention](../../meta/execution-modes.md)).

**Fallback Mode**: Manual Orchestration — execute workflow logic directly using
Read/Write/Edit tools when Agent Delegation is unavailable.

The Agent tool runs delegated agents that persist file changes to the actual filesystem, making it
the preferred approach when these agents exist as defined delegated agent types.

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

The `apps-ayokoding-www-facts-checker` agent invoked by this workflow delegates multi-page web
research to the [`web-researcher`](../../../../.agents/agents/web-researcher.md) delegated agent when
verifying a single claim requires more than one or two searches, or more than two fetches.
Checkers retain in-context `WebSearch`/`WebFetch` only for single-shot verification against known
authoritative URLs. This keeps each audit context lean. The delegation is encoded in the checker
agent's prompt — no workflow-level configuration required.

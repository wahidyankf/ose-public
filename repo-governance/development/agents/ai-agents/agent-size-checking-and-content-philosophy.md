---
description: "Describes how agent file size is measured — by the word-budget gate, not by hand — and the content philosophy that keeps agents small."
when_to_use: Use when the word-budget gate flags an agent, or when explaining why agent definitions are kept small.
---

# Agent Size Checking and Content Philosophy

## Size Checking Process

Nobody counts by hand. The
[Governance Word-Budget Convention](../../../conventions/structure/governance-word-budget.md)
measures every agent definition deterministically through `./rhino governance word-budget validate`,
which runs on demand rather than at a hook or in CI, so the only authoring obligation is to run it and
respond to what it reports.

**For all agent authors**:

1. Let the gate report the size — do not estimate it
2. When it flags a file, review for redundancy against convention docs first
3. Remediate by progressive disclosure: move detail into a linked doc rather than compressing prose
4. Link to detailed docs rather than duplicating them

## Agent Content Philosophy

**Focus on single responsibility**:

- Each agent should do ONE thing well
- Complex workflows should compose multiple agents, procedures, and/or other workflows
- Don't create "Swiss Army knife" agents

**Detailed but targeted prompts**:

- Provide comprehensive guidance for the agent's domain
- Don't document unrelated concerns
- Link to convention docs instead of duplicating

**Avoid duplication with convention docs**:

- Convention docs are the source of truth
- Agents should reference conventions, not repeat them
- Exception: Agent-specific applications of conventions

**Balance comprehensiveness with conciseness**:

- Include essential decision logic and examples
- Remove tangential information
- Prefer structured formats (tables, checklists) over prose

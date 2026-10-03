---
description: "States the requirement that every agent include a Model Selection Justification block explaining its grade choice."
when_to_use: Use when writing or reviewing an agent's Model Selection Justification block.
---

# Justification Requirement

Every agent MUST include a **Model Selection Justification** block in its markdown body explaining why the chosen grade is appropriate. This block appears near the top of the agent file, after the frontmatter metadata section.

**Format**:

```markdown
**Model Selection Justification**: `tier: execution` (execution grade) — this agent requires:

- [Capability 1] to [accomplish task aspect]
- [Capability 2] to [accomplish task aspect]
```

**Examples**:

For a checker agent:

> **Model Selection Justification**: `tier: execution` (execution grade) — this agent requires:
>
> - Systematic rule application to validate content against defined checklists
> - Structured report generation following the audit report template
> - Pattern recognition to identify convention violations across files

For a planning-grade maker:

> **Model Selection Justification**: `tier: plan` (planning grade) — this agent requires:
>
> - Advanced reasoning to generate idiomatic code across language paradigms
> - Multi-step problem decomposition for complex refactoring tasks
> - Creative synthesis to design APIs and data models

For a link checker:

> **Model Selection Justification**: `tier: fast` (fast grade) — this agent requires:
>
> - Execution of predefined link and status checks
> - No analytical reasoning beyond following a fixed procedure

An ultra-grade agent's block carries a heavier burden: it must record the three-part admission
evidence from [Model Tiers — Ultra](./model-tiers-ultra.md#admission-evidence) — the observed
planning-grade failure, why a cheaper fix does not apply, and what would send the agent back down.
A capability list alone does not justify the ultra grade.

---
description: "Explains why agent content and agent skills content must stay separated and gives the knowledge-classification decision tree."
when_to_use: Use when deciding whether a piece of knowledge belongs in an agent's body or in a Skill.
---

# Agent-Skill Separation — Purpose and Knowledge Classification

## Purpose

This section defines how to properly separate reusable knowledge (agent skills) from agent-specific instructions (Agent files), ensuring maintainability, reducing duplication, and enabling effective knowledge delivery.

**Validated through**: agent skills Simplification pilot (2026-01-03) - docs family achieved 49.2% size reduction while maintaining 100% functionality.

## Knowledge Classification Decision Tree

When writing or updating an agent, use this decision tree to determine where content belongs:

```mermaid
flowchart TD
    accTitle: Knowledge Classification Decision Tree
    accDescr: Reusable across 3+ agents? leads to Actionable how-to guidance? via Yes; Actionable how-to guidance? leads to Skill in.claude/skills/ via Yes; Reusable across 3+ agents? leads to Technical spec or standard? via Yes; and 3 more links.
    Q1{"Reusable across<br/>3+ agents?"}
    Q1 -->|Yes| Q2{"Actionable how-to<br/>guidance?"}
    Q2 -->|Yes| SK["Skill in<br/>.claude/skills/"]
    Q1 -->|Yes| Q3{"Technical spec<br/>or standard?"}
    Q3 -->|Yes| CV["Convention in<br/>conventions/"]
    Q1 -->|No| Q4{"Task-specific<br/>workflow?"}
    Q4 -->|Yes| AG["Keep in the<br/>agent file"]
```

Examples: agent skills such as `applying-content-quality` and `creating-accessible-diagrams`; Conventions such as the
Color Accessibility Convention and the Mathematical Notation Convention in `repo-governance/conventions/`; and
agent-specific knowledge such as "When to use this agent", validation workflow steps, and tool usage patterns.

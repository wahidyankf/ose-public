---
description: "Provides the boilerplate template structure for a new agent definition file."
when_to_use: Use as the starting skeleton when writing a brand-new agent definition file.
---

# Creating New Agents — Agent Template

Use this template when creating a new canonical agent at `.agents/agents/<name>.md`:

```markdown
---
name: agent-name
description: >-
  Expert in [domain] specializing in [specific area].
when_to_use: >-
  Use when [specific scenario].
tier: execution
capabilities:
  - repository-read
skills:
  - [skill-name]
---

# Agent Name Agent

## Agent Metadata

- **Role**: [Maker (blue) / Checker (green) / Fixer (yellow) / Implementor (purple)]

You are an expert [role/domain] specializing in [specific expertise].

## Core Responsibility

Your primary job is to [clear, specific purpose statement].

## [Domain-Specific Guidelines]

[Detailed guidelines, standards, examples specific to this agent's domain]

### [Subsection as needed]

[More specific guidance]

## [Additional Sections as Needed]

- Examples
- Checklists
- Decision trees
- Anti-patterns
- Troubleshooting

## Reference Documentation

**Project Guidance:**

- `AGENTS.md` - Primary guidance for all agents working on this project

**Agent Conventions:**

- `repo-governance/development/agents/ai-agents.md` - AI agents convention (all agents must follow)

**[Domain-Specific Conventions]:**

- Relevant conventions for this agent's domain

**Related Agents:**

- Other complementary agents (if applicable)
```

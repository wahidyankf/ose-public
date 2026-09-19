---
description: "Architectural guidance on skill context modes in `.agents/skills/`. Inline skills work universally; fork skills work from main conversation only."
when_to_use: "Read this index to find the right Skill Context Architecture child document."
---

# Skill Context Architecture

- [The Architectural Constraint](./the-architectural-constraint.md) — Explains the core limitation on Skill context and its impact on agent skills. Use when a Skill needs to spawn or delegate work and you must check whether its context mode allows it.
- [The Repository Standard](./the-repository-standard.md) — Defines the Skill context modes used in the primary binding agent skills directory, including inline context mode. Use when authoring a new Skill and deciding which context mode it declares.
- [Fork agent skills: Main Conversation Only](./fork-agent-skills-main-conversation-only.md) — Explains when a Skill needs fork behaviour and lists fork-skill use cases outside the repository. Use when a Skill needs to run in an isolated context outside the current conversation.
- [Validation and Compliance](./validation-and-compliance.md) — Gives the Skill validation checklist and lists common context-architecture mistakes. Use when validating that a new or edited Skill declares the correct context mode.
- [Architecture Diagram](./architecture-diagram.md) — Provides a diagram of the Skill context architecture. Use when you need a visual reference for how Skill context modes relate to each other.
- [Enforcement](./enforcement.md) — Gives the code-review checklist and notes on future automated validation for Skill context architecture. Use when reviewing a PR that adds or edits a Skill for context-architecture compliance.
- [Summary](./summary.md) — Summarizes the Skill context architecture rules in one closing statement. Use when you need a one-paragraph recap of the Skill context architecture rules.

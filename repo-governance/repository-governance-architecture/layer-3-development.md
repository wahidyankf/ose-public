---
description: "The software-practices layer: scope, categories, requirements"
when_to_use: Use for Layer 3's scope and governance relationships.
---

# Layer 3: Development (HOW - Software Practices)

**Purpose**: Software practices implementing core principles. Defines HOW we develop, test, deploy software and automation.

**Location**: `repo-governance/development/`

**Key Document**: [Development Index](../development/README.md)

**Scope**:

- **Source code** (TypeScript, Rust, F#, and the other languages this repo ships)
- **Build systems** (Nx, npm, Volta)
- **AI agents** (canonical `.agents/agents/` directory)
- **Git workflows** (commits, branches, hooks)

**Practice Categories**:

- **Patterns**: Maker-Checker-Fixer, functional programming
- **Quality**: Code quality, criticality levels, fixer confidence, repository validation
- **Workflows**: Trunk-based development, commit messages, implementation workflow, reproducible environments
- **Infrastructure**: Temporary files, AI agents convention
- **Frontend**: Design tokens, component patterns, accessibility, styling conventions
- **Practices**: Proactive Preexisting Error Resolution (and future practice-level guidance)

**Example Practices**:

- [Trunk Based Development](../development/workflow/trunk-based-development.md)
- [Code Quality Convention (Git Hooks)](../development/quality/code.md)
- [AI Agents Convention](../development/agents/ai-agents.md)
- [Maker-Checker-Fixer Pattern](../development/pattern/maker-checker-fixer.md)

**Requirements**:

- Each practice MUST include BOTH "Principles Implemented/Respected" AND "Conventions Implemented/Respected" sections
- Implemented by Layer 4 (AI Agents) and automation (git hooks)
- Changes more frequently than conventions

**Relationship to Other Layers**:

- **Governed by** Layer 1 (Principles) and Layer 2 (Conventions)
- **Governs** Layer 4 (AI Agents)
- **Implemented by** Layer 4 (AI Agents) and automation

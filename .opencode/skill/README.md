# OpenCode Skills Index

> ⚠️ **AUTO-SYNCED**: This directory (`.opencode/skill/`) is automatically synced from `.claude/skills/` (source of truth).
>
> **DO NOT EDIT DIRECTLY**. To make changes:
>
> 1. Edit skills in `.claude/skills/` directory
> 2. Run: `npm run sync:claude-to-opencode`
> 3. Changes will be synced here automatically (maintains folder structure)
>
> **See [.claude/skills/README.md](../../.claude/skills/README.md) for primary skills documentation**.

---

## Skills Format

Skills use **folder structure** for OpenCode compatibility:

**Directory structure**:

```
.opencode/skill/
├── skill-name/
│   └── SKILL.md
└── README.md
```

**SKILL.md structure**:

```yaml
---
description: Brief description for progressive disclosure
context: inline # Default: inline knowledge injection
# OR
context: fork # Task delegation mode
agent: AgentName # Required when context: fork
---

# Skill Name

## Purpose
When to use this skill

## Content
Detailed guidance, standards, examples

## References
Links to conventions, related skills
```

## Skill Modes: Inline vs Fork

**Inline Skills** (default) - Knowledge injection:

- Progressive disclosure of standards and conventions
- Injected into current conversation context
- Enable knowledge composition across multiple skills
- Used for: Style guides, conventions, domain knowledge

**Fork Skills** (`context: fork`) - Task delegation:

- Spawn isolated agent contexts for focused work
- Delegate specialized tasks to specific agent types
- Return summarized results to main conversation
- Used for: Deep research, focused analysis, exploration

**Key difference**: Inline skills add knowledge, fork skills delegate tasks.

**Service relationship**: Skills serve agents but don't govern them (delivery infrastructure, not governance layer).

## Skill Categories

Skills are synced from `.claude/skills/` maintaining folder structure. For complete documentation, see [.claude/skills/README.md](../../.claude/skills/README.md).

- **Documentation Skills**: docs-applying-content-quality, docs-applying-diataxis-framework, docs-creating-accessible-diagrams, docs-creating-by-example-tutorials, docs-creating-in-the-field-tutorials, docs-validating-factual-accuracy, docs-validating-links, docs-validating-software-engineering-separation
- **README Skills**: readme-writing-readme-files
- **Planning Skills**: plan-creating-project-plans, plan-writing-gherkin-criteria
- **Agent Development Skills**: agent-developing-agents
- **Repository Pattern Skills**: repo-applying-maker-checker-fixer, repo-assessing-criticality-confidence, repo-defining-workflows, repo-generating-validation-reports, repo-practicing-trunk-based-development, repo-understanding-repository-architecture
- **Development Workflow Skills**: swe-developing-applications-common, swe-developing-e2e-test-with-playwright
- **Programming Language Skills**: swe-programming-clojure, swe-programming-csharp, swe-programming-dart, swe-programming-elixir, swe-programming-fsharp, swe-programming-golang, swe-programming-java, swe-programming-kotlin, swe-programming-python, swe-programming-rust, swe-programming-typescript
- **Application-Specific Skills**: apps-ayokoding-web-developing-content, apps-organiclever-fe-developing-content, apps-oseplatform-web-developing-content

---

**Total Skills**: 34
**Format**: Folder structure with SKILL.md inside each folder
**Last Updated**: 2026-03-09

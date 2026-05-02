---
title: "Platform Bindings Catalog"
description: Catalog of all AI coding agent platform bindings in ose-public, their directories, root instruction files, and mechanical translation artifacts.
category: reference
created: 2026-05-02
---

# Platform Bindings Catalog

This reference catalogs every AI coding agent platform binding in this repository: where it lives,
what root instruction file it reads, its current status, and what mechanical translations exist
between bindings.

A **platform binding** is the platform-specific directory and configuration that wires an AI coding
agent to this repository. Governance prose lives in `governance/` (vendor-neutral). Platform
bindings live in their own directories and are explicitly excluded from the
[Governance Vendor-Independence Convention](../../governance/conventions/structure/governance-vendor-independence.md).

## Platform Binding Directories

| Platform         | Binding location                                | Root instruction file                           | Status                                       |
| ---------------- | ----------------------------------------------- | ----------------------------------------------- | -------------------------------------------- |
| Claude Code      | `.claude/`                                      | `CLAUDE.md` (shim → `AGENTS.md`)                | Active                                       |
| OpenCode         | `.opencode/agents/`, `.claude/skills/` (native) | `AGENTS.md` (read natively)                     | Active                                       |
| OpenAI Codex CLI | (no dotdir)                                     | `AGENTS.md` (read natively)                     | Provided automatically via `AGENTS.md`       |
| Aider            | n/a                                             | `AGENTS.md` (read natively) or `CONVENTIONS.md` | Provided automatically via `AGENTS.md`       |
| Cursor           | `.cursor/rules/*.mdc`                           | `AGENTS.md` (also reads `.cursor/rules/`)       | Reserved (not yet provided)                  |
| GitHub Copilot   | `.github/copilot-instructions.md`               | `AGENTS.md` (coding agent mode)                 | Reserved (not yet provided)                  |
| Gemini CLI       | (no dotdir)                                     | `GEMINI.md` or `AGENTS.md`                      | Reserved                                     |
| Continue         | TBD                                             | TBD                                             | Not researched conclusively; see plan brd.md |
| Sourcegraph Cody | search-based context                            | none                                            | Not applicable (no instruction file)         |

**Root instruction file hierarchy**: Any platform that reads `AGENTS.md` natively requires no
additional binding directory. Platforms that predate `AGENTS.md` (e.g., the Claude Code binding,
which uses `CLAUDE.md`) receive a shim that imports `AGENTS.md`.

## Translation Artifacts

Mechanical translations that platform bindings apply when generating output from upstream sources.
All translations are performed by `rhino-cli agents sync` (`npm run sync:claude-to-opencode`).

### Color Translation (Claude Code → OpenCode)

The Claude Code binding uses named color strings (`blue`, `green`, `yellow`, `purple`, etc.) in
agent frontmatter. OpenCode uses theme tokens (`primary`, `success`, `warning`, `secondary`, etc.).

- **Source**: `.claude/agents/<name>.md` frontmatter `color:` field
- **Transform**: `ClaudeToOpenCodeColor` in `apps/rhino-cli/internal/agents/types.go`
- **Sink**: `.opencode/agents/<name>.md` frontmatter `color:` field
- **Policy**: [Dual-Mode Color Translation](../../governance/development/agents/ai-agents.md)
  ("Dual-Mode Color Translation — Claude Code to OpenCode" subsection)

| Claude Code color | OpenCode theme token | Role hint         |
| ----------------- | -------------------- | ----------------- |
| `blue`            | `primary`            | Maker agents      |
| `green`           | `success`            | Checker agents    |
| `yellow`          | `warning`            | Fixer agents      |
| `purple`          | `secondary`          | Executor agents   |
| `red`             | `error`              | Critical/alert    |
| `orange`          | `warning`            | (maps to warning) |
| `gray`/`grey`     | `muted`              | Utility/misc      |
| `cyan`/`teal`     | `info`               | Informational     |
| unrecognized/hex  | passed through       | Escape hatch      |

### Model ID Translation (Claude Code → OpenCode)

Claude Code agent frontmatter uses short aliases (`sonnet`, `haiku`) or omits `model:` for
planning-grade inheritance. OpenCode uses Zhipu AI GLM model IDs.

- **Source**: `.claude/agents/<name>.md` frontmatter `model:` field
- **Transform**: `ClaudeToOpenCodeModel` in `apps/rhino-cli/internal/agents/types.go`
- **Sink**: `.opencode/agents/<name>.md` frontmatter `model:` field
- **Policy**: [Model Selection Convention](../../governance/development/agents/model-selection.md)
  ("Platform Binding Equivalents" section)

| Claude Code alias | OpenCode model ID             | Capability tier |
| ----------------- | ----------------------------- | --------------- |
| omit (inherit)    | `zai-coding-plan/glm-5.1`     | Planning-grade  |
| `sonnet`          | `zai-coding-plan/glm-5.1`     | Execution-grade |
| `haiku`           | `zai-coding-plan/glm-5-turbo` | Fast            |

### Tool Translation (Claude Code → OpenCode)

Claude Code agent frontmatter lists tools as an array of string names. OpenCode uses boolean flag
objects.

- **Source**: `.claude/agents/<name>.md` frontmatter `tools:` array
- **Transform**: `ClaudeToOpenCodeTools` in `apps/rhino-cli/internal/agents/types.go`
- **Sink**: `.opencode/agents/<name>.md` frontmatter tool flags (`read`, `write`, `edit`, etc.)

## Adding a New Platform Binding

To add a new binding (e.g., `.cursor/rules/`):

1. Create the binding directory and its root instruction file (or confirm `AGENTS.md` suffices).
2. Add a row to the Platform Binding Directories table above.
3. Identify any per-field translations needed (`rhino-cli agents sync` applies them).
4. Implement translations in `apps/rhino-cli/internal/agents/types.go` and add godog scenarios.
5. Update this document's Translation Artifacts section.

## Related

- [Governance Vendor-Independence Convention](../../governance/conventions/structure/governance-vendor-independence.md) —
  policy separating vendor-neutral governance from platform bindings
- [AI Agents Development Guide](../../governance/development/agents/ai-agents.md) — agent authoring
  guide with binding-specific Platform Binding Examples
- [Model Selection Convention](../../governance/development/agents/model-selection.md) — capability
  tiers and how they resolve to per-binding model IDs
- `AGENTS.md` at repo root — canonical root instruction file read by most platforms
- `CLAUDE.md` at repo root — Claude Code shim importing `AGENTS.md`

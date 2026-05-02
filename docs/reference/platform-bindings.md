---
title: "Platform Bindings Catalog"
description: Catalog of all AI coding agent platform bindings in ose-public, their directories, root instruction files, and mechanical translation artifacts.
category: reference
created: 2026-05-02
---

# Platform Bindings Catalog

> **Status**: Stub — full content populated in Phase 4 of the
> [Governance Vendor-Independence Refactor](../../plans/in-progress/2026-05-02__governance-vendor-independence/README.md).

This reference catalogs every AI coding agent platform binding in this repository: where it lives, what file it reads first, and what mechanical translations exist between bindings.

## Platform Binding Directories

| Platform         | Binding location                       | Root instruction file                     | Status           |
| ---------------- | -------------------------------------- | ----------------------------------------- | ---------------- |
| Claude Code      | `.claude/`                             | `CLAUDE.md` (shim → `AGENTS.md`)          | Active           |
| OpenCode         | `.opencode/agents/`, `.claude/skills/` | `AGENTS.md` (read natively)               | Active           |
| Cursor           | `.cursor/rules/`                       | `AGENTS.md` (also reads `.cursor/rules/`) | Reserved         |
| GitHub Copilot   | `.github/copilot-instructions.md`      | `AGENTS.md` (coding-agent mode)           | Reserved         |
| OpenAI Codex CLI | (no dotdir)                            | `AGENTS.md`                               | Auto (AGENTS.md) |
| Gemini CLI       | (no dotdir)                            | `GEMINI.md` or `AGENTS.md`                | Reserved         |
| Aider            | n/a                                    | `CONVENTIONS.md` or `AGENTS.md`           | Auto (AGENTS.md) |

## Translation Artifacts

Mechanical translations that platform bindings apply when generating output from upstream sources.

<!-- TODO(platform-bindings): Expand this section in Phase 4 with full translation artifact details -->

### Color Translation (Claude Code → OpenCode)

`apps/rhino-cli/internal/agents/types.go` `ClaudeToOpenCodeColor` maps Claude Code named colors to OpenCode theme tokens during `rhino-cli agents sync`. Policy: [`governance/development/agents/ai-agents.md` "Dual-Mode Color Translation"](../../../governance/development/agents/ai-agents.md).

## Related

- [Governance Vendor-Independence Convention](../../governance/conventions/structure/governance-vendor-independence.md)
- [AI Agents Development Guide](../../governance/development/agents/ai-agents.md)
- `AGENTS.md` at repo root — canonical root instruction file (populated in Phase 2)

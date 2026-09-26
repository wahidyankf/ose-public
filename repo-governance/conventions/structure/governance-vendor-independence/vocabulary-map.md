---
description: The table of vendor-specific terms and their vendor-neutral equivalents to use when rewriting governance prose.
when_to_use: Use when rewriting governance prose and you need the vendor-neutral replacement for a specific vendor term.
---

# Vocabulary Map

> **A listed name is not a support claim.** Dropped harnesses stay here on purpose — their names
> must not leak into governance prose either. `repo-config.yml` `harness:` decides support.

When rewriting governance prose, replace vendor-specific terms with the vendor-neutral equivalents below.

| Vendor-specific term (old)                  | Vendor-neutral term (new)                                              | Notes                                                                                                             |
| ------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| "Claude Code"                               | "the coding agent" or "the AI coding agent"                            | Allowed only in a file its vocabulary exception names, and in `docs/reference/platform-bindings.md`               |
| "OpenCode"                                  | "the coding agent" / drop where redundant                              | Allowed only in a file its vocabulary exception names, and in the platform-bindings catalog                       |
| "Cursor" / "Windsurf" / "Codeium"           | "the coding agent" or "AI coding editor"                               | Allowed only in a file its vocabulary exception names, and in the platform-bindings catalog                       |
| "Copilot" / "Aider" / "Cline" / "Devin"     | "the coding agent" or "AI coding assistant"                            | Allowed only in a file its vocabulary exception names, and in the platform-bindings catalog                       |
| "Anthropic" / "OpenAI" / "xAI"              | drop, or "the model vendor"                                            | Allowed only in a file its vocabulary exception names                                                             |
| "Fable" / "Opus" / "Sonnet" / "Haiku"       | capability grade: "ultra", "planning-grade", "execution-grade", "fast" | Concrete model names live in platform-binding agent frontmatter only                                              |
| "GPT" / "Gemini" / "Llama" / "Mistral"      | capability tier or "AI model"                                          | Concrete model names live in platform-binding agent frontmatter only                                              |
| "DeepSeek" / "Qwen" / "Grok"                | capability tier or "AI model"                                          | Concrete model names live in platform-binding agent frontmatter only                                              |
| "Skills" (proper noun, branded)             | "agent skills" (lowercase generic)                                     | Aligned with AAIF / Codex / OpenCode shared term                                                                  |
| "slash commands"                            | "agent commands" or "workflow commands"                                | No formal AAIF term yet; use lowercase generic                                                                    |
| "subagents"                                 | "delegated agents" / "agent delegation"                                | Aligned with A2A protocol vocabulary                                                                              |
| "MCP server"                                | unchanged (already cross-vendor standard)                              | MCP is a Linux Foundation / AAIF standard since Dec 2025                                                          |
| "CLAUDE.md" (as canonical root)             | "AGENTS.md"                                                            | `CLAUDE.md` continues to exist as a Claude Code binding shim; governance prose refers to `AGENTS.md` as canonical |
| "Junie" / "Amazon Q" / "Antigravity" / "Pi" | "the coding agent"                                                     | Allowed only in a file its vocabulary exception names, and in the platform-bindings catalog                       |
| "JetBrains" / "Earendil"                    | "the model vendor" / drop                                              | Allowed only in a file its vocabulary exception names                                                             |

Binding directory paths such as `.agents/`, `.claude/`, `.codex/`, and `.opencode/` need no
replacement: they are not vendor terms, so governance prose names the real path it means. Prefer the
canonical source path (for example `.agents/agents/<name>.md`) over a generated route.

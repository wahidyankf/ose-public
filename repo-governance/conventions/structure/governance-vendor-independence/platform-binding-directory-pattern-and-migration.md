---
description: The catalog of per-platform binding directories and root instruction files, plus the step-by-step process for refactoring an existing governance file to be vendor-neutral.
when_to_use: Use when you need the catalog of platform-binding directories, or the step-by-step process for scrubbing vendor terms from an existing governance file.
---

# Platform Binding Directory Pattern, and Migration Guidance

## Platform Binding Directory Pattern

Each AI coding platform that integrates with this repository has a dedicated binding directory at the repo root:

| Platform         | Binding paths                                                          | Root instruction file            | Harness tier |
| ---------------- | ---------------------------------------------------------------------- | -------------------------------- | ------------ |
| Claude Code      | `.claude/`                                                             | `CLAUDE.md` (shim → `AGENTS.md`) | source       |
| OpenCode         | `.opencode/agents/`; vendored config                                   | `AGENTS.md` (read natively)      | generated    |
| OpenAI Codex CLI | `.codex/agents/`; generated and vendored paths under `.agents/skills/` | `AGENTS.md` (read natively)      | generated    |

The `harness:` registry in `repo-config.yml` is authoritative for this table's membership and for
path-level `source`, `generated`, or `vendored` ownership. Harness tier does not make every path in
its binding root generated. A platform absent from that registry is not supported, whatever a
binding directory's presence on some other machine might suggest.

The governance layer refers to these binding directories collectively as "the platform binding" rather than naming specific directories in load-bearing prose.

See [`docs/reference/platform-bindings.md`](../../../../docs/reference/platform-bindings.md) for the full catalog.

## Migration Guidance

To refactor an existing governance file:

1. **Scan**: prefer `./rhino governance vendor validate <path>` (it respects all allowlist regions). For ad-hoc grep, use `grep -n -E "Claude Code|OpenCode|Cursor|Windsurf|Codeium|Copilot|Aider|Cline|Devin|Junie|JetBrains|Amazon Q|Antigravity|Pi Coding Agent|pi\.dev|Earendil|Anthropic|OpenAI|xAI|Sonnet|Opus|Haiku|GPT|Gemini|DeepSeek|Qwen|Llama|Mistral|Grok|Skills|\.claude/|\.opencode/|\.cursor/|\.windsurf/|\.continue/|\.clinerules/|\.junie/|\.amazonq/|\.pi/|\.gemini/|\.agent/|\.agents/" <file>` to find all matches.
2. **Classify each match**:
   - Load-bearing prose → rewrite using the Vocabulary Map above.
   - Cross-reference link → rewrite anchor text and link target to neutral equivalent.
   - Illustrative example → wrap in ` ```binding-example ` fence or move under "Platform Binding Examples" heading.
   - Inside a genuinely agent-specific section → allowlist via section heading.
3. **Verify**: re-run the grep; expect zero matches outside allowlisted regions.
4. **Lint**: `npm run lint:md:fix` then `npm run lint:md`.
5. **Commit**: one commit per file (or per logical group within a phase).

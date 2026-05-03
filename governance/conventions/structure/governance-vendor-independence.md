---
title: "Governance Vendor-Independence Convention"
description: Governance prose must be vendor-neutral. Vendor-specific bindings belong in platform-binding directories, not in governance/.
category: explanation
subcategory: conventions
tags:
  - conventions
  - governance
  - vendor-independence
  - agents
  - platform-bindings
created: 2026-05-02
---

# Governance Vendor-Independence Convention

All prose under `governance/` must be readable and actionable by any contributor — human or agent — regardless of which AI coding platform they use. Vendor-specific implementation details belong in dedicated platform-binding directories, not in the governance layer.

## Principles Implemented/Respected

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: One clear rule (governance is vendor-neutral) is easier to apply consistently than per-file exceptions.
- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: The allowlist mechanism makes every vendor reference deliberate and visible.
- **[Accessibility First](../../principles/content/accessibility-first.md)**: Broadly read — governance should be accessible to contributors using any tool or no tool.
- **[Documentation First](../../principles/content/documentation-first.md)**: The rule is codified here before bulk rewriting begins so writers have a stable reference.

## Purpose

`governance/` contains the rules every contributor follows regardless of toolchain. When vendor-specific product names, model names, or path references appear in governance prose, they:

- Exclude contributors using other AI coding agents (Cursor, Codex CLI, Gemini CLI, Copilot, Aider).
- Couple governance correctness to a specific vendor's product lifecycle.
- Create maintenance debt when vendor names or APIs change.

This convention separates **vendor-neutral governance** (the rules) from **platform bindings** (the vendor-specific wiring that executes the rules) by pushing all binding details out of `governance/` and into the appropriate platform-binding directory.

## Scope

**Applies to**: every `.md` file under `governance/`.

**Out of scope** (vendor terms are intentionally present here):

- `.claude/` — Claude Code platform binding directory.
- `.opencode/` — OpenCode platform binding directory.
- `AGENTS.md` — canonical root instruction file; may reference all platform bindings.
- `CLAUDE.md` — Claude Code shim; intentionally Claude-specific.
- `docs/reference/platform-bindings.md` — catalog of all platform bindings; references them by necessity.
- `plans/` — planning documents; may reference vendor specifics when discussing implementation details.

## Forbidden Vendor Terms

The following patterns are forbidden in `governance/` prose except inside the allowlisted regions defined in the next section.

### Coding-agent / harness product names

| Pattern (regex) | Reason                                                     |
| --------------- | ---------------------------------------------------------- |
| `Claude Code`   | Vendor product name                                        |
| `OpenCode`      | Vendor product name                                        |
| `\bCursor\b`    | Vendor product name (Anysphere)                            |
| `\bWindsurf\b`  | Vendor product name (Cognition AI; formerly Codeium)       |
| `\bCodeium\b`   | Vendor product name (legacy brand for Windsurf)            |
| `\bCopilot\b`   | Vendor product name (GitHub / Microsoft)                   |
| `\bAider\b`     | Vendor product name                                        |
| `\bCline\b`     | Vendor product name                                        |
| `\bDevin\b`     | Vendor product name (Cognition AI; FP risk: personal name) |

### Vendor-specific binding directory paths

| Pattern (regex) | Reason               |
| --------------- | -------------------- |
| `\.claude/`     | Vendor-specific path |
| `\.opencode/`   | Vendor-specific path |
| `\.cursor/`     | Vendor-specific path |
| `\.windsurf/`   | Vendor-specific path |
| `\.continue/`   | Vendor-specific path |
| `\.clinerules/` | Vendor-specific path |

### Model-vendor company names

| Pattern (regex) | Reason              |
| --------------- | ------------------- |
| `Anthropic`     | Vendor company name |
| `\bOpenAI\b`    | Vendor company name |
| `\bxAI\b`       | Vendor company name |

### Model family / model names

| Pattern (regex) | Reason                                                       |
| --------------- | ------------------------------------------------------------ |
| `\bSonnet\b`    | Vendor model name                                            |
| `\bOpus\b`      | Vendor model name                                            |
| `\bHaiku\b`     | Vendor model name (the AI model, not the poem form)          |
| `\bGPT\b`       | Vendor model family (OpenAI)                                 |
| `\bGemini\b`    | Vendor model family (Google)                                 |
| `\bDeepSeek\b`  | Vendor model family (DeepSeek)                               |
| `\bQwen\b`      | Vendor model family (Alibaba)                                |
| `\bLlama\b`     | Vendor model family (Meta; FP risk: animal — negligible)     |
| `\bMistral\b`   | Vendor model family (Mistral AI; FP risk: wind — negligible) |
| `\bGrok\b`      | Vendor model family (xAI; FP risk: verb "to grok")           |

### Vendor-branded concepts

| Pattern (regex)                                | Reason                                                    |
| ---------------------------------------------- | --------------------------------------------------------- |
| `\bSkills\b` (capitalized, as branded concept) | Vendor-branded term; use lowercase "agent skills" instead |

Combined audit regex used by `rhino-cli governance vendor-audit`:

```
Claude Code|OpenCode|\bCursor\b|\bWindsurf\b|\bCodeium\b|\bCopilot\b|\bAider\b|\bCline\b|\bDevin\b|\.claude/|\.opencode/|\.cursor/|\.windsurf/|\.continue/|\.clinerules/|Anthropic|\bOpenAI\b|\bxAI\b|\bSonnet\b|\bOpus\b|\bHaiku\b|\bGPT\b|\bGemini\b|\bDeepSeek\b|\bQwen\b|\bLlama\b|\bMistral\b|\bGrok\b|\bSkills\b
```

> **Note**: `MCP`, `AGENTS.md`, and `Goose` are NOT forbidden — all three are Linux Foundation / AAIF cross-vendor standards shared across all major coding agents.
>
> **False-positive notes**:
>
> - `\bDevin\b` collides with the personal name. Reviewers should confirm context before treating as a violation.
> - `\bGrok\b` collides with the verb "to grok" (Heinlein, common in tech writing). Reviewers should distinguish product reference from verb usage.
> - `\bLlama\b`, `\bMistral\b` collide with non-AI English words but rarely appear in governance prose.

## Allowlist Mechanism

Two mechanisms allow vendor references inside governance files when genuinely needed for illustrative purposes:

### 1. `binding-example` fenced block (granular, inline)

Wrap any inline vendor-specific example in a ` ```binding-example ` fence. The vendor-audit scanner skips the entire content of such fences.

````markdown
```binding-example
# Example: how a Claude Code binding resolves this rule
model: claude-sonnet-4-6
```
````

### 2. "Platform Binding Examples" section heading (page-level)

Place all vendor-specific content for a page under a heading whose text matches the pattern `Platform Binding Examples` (case-insensitive). The scanner skips every line from that heading until the next same-level heading or end of file.

```markdown
## Platform Binding Examples

### Claude Code

The `.claude/agents/plan-maker.md` frontmatter sets `model: claude-sonnet-4-6`.

### OpenCode

The `.opencode/agents/plan-maker.md` sets `model: opencode-go/minimax-m2.7`.
```

**Precedence**: the fence mechanism wins for any line inside both a fence and a heading scope.

## Vocabulary Map

When rewriting governance prose, replace vendor-specific terms with the vendor-neutral equivalents below.

| Vendor-specific term (old)                     | Vendor-neutral term (new)                                            | Notes                                                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| "Claude Code"                                  | "the coding agent" or "the AI coding agent"                          | Allowed inside `binding-example` blocks and in `docs/reference/platform-bindings.md`                              |
| "OpenCode"                                     | "the coding agent" / drop where redundant                            | Allowed in cross-references and in the platform-bindings catalog                                                  |
| "Cursor" / "Windsurf" / "Codeium"              | "the coding agent" or "AI coding editor"                             | Allowed inside `binding-example` blocks and in the platform-bindings catalog                                      |
| "Copilot" / "Aider" / "Cline" / "Devin"        | "the coding agent" or "AI coding assistant"                          | Allowed inside `binding-example` blocks and in the platform-bindings catalog                                      |
| "Anthropic" / "OpenAI" / "xAI"                 | drop, or "the model vendor"                                          | Allowed only in citation context                                                                                  |
| "Sonnet" / "Opus" / "Haiku"                    | capability tier: "planning-grade", "execution-grade", "fast"         | Concrete model names live in platform-binding agent frontmatter only                                              |
| "GPT" / "Gemini" / "Llama" / "Mistral"         | capability tier or "AI model"                                        | Concrete model names live in platform-binding agent frontmatter only                                              |
| "DeepSeek" / "Qwen" / "Grok"                   | capability tier or "AI model"                                        | Concrete model names live in platform-binding agent frontmatter only                                              |
| "Skills" (proper noun, branded)                | "agent skills" (lowercase generic)                                   | Aligned with AAIF / Codex / OpenCode shared term                                                                  |
| "slash commands"                               | "agent commands" or "workflow commands"                              | No formal AAIF term yet; use lowercase generic                                                                    |
| "subagents"                                    | "delegated agents" / "agent delegation"                              | Aligned with A2A protocol vocabulary                                                                              |
| "MCP server"                                   | unchanged (already cross-vendor standard)                            | MCP is a Linux Foundation / AAIF standard since Dec 2025                                                          |
| "CLAUDE.md" (as canonical root)                | "AGENTS.md"                                                          | `CLAUDE.md` continues to exist as a Claude Code binding shim; governance prose refers to `AGENTS.md` as canonical |
| "`.claude/agents/<name>.md`" (as generic path) | "the agent definition file" or `<platform-binding>/agents/<name>.md` | Use exact path only inside platform-binding examples                                                              |
| "`.claude/skills/<name>/SKILL.md`"             | "the agent skill file" or `<skill-search-path>/<name>/SKILL.md`      | Concrete path inside binding examples only                                                                        |
| "`.opencode/agents/<name>.md`"                 | same treatment as `.claude/agents/`                                  |                                                                                                                   |

## Platform Binding Directory Pattern

Each AI coding platform that integrates with this repository has a dedicated binding directory at the repo root:

| Platform       | Binding directory                         | Root instruction file                     | Status   |
| -------------- | ----------------------------------------- | ----------------------------------------- | -------- |
| Claude Code    | `.claude/`                                | `CLAUDE.md` (shim → `AGENTS.md`)          | Active   |
| OpenCode       | `.opencode/agents/`                       | `AGENTS.md` (read natively)               | Active   |
| Cursor         | `.cursor/rules/`                          | `AGENTS.md` (also reads `.cursor/rules/`) | Reserved |
| GitHub Copilot | `.github/copilot-instructions.md`         | `AGENTS.md` (coding-agent mode)           | Reserved |
| Others         | see `docs/reference/platform-bindings.md` | `AGENTS.md`                               | Varies   |

The governance layer refers to these binding directories collectively as "the platform binding" rather than naming specific directories in load-bearing prose.

See [`docs/reference/platform-bindings.md`](../../../docs/reference/platform-bindings.md) for the full catalog.

## Migration Guidance

To refactor an existing governance file:

1. **Scan**: prefer `rhino-cli governance vendor-audit <path>` (it respects all allowlist regions). For ad-hoc grep, use `grep -n -E "Claude Code|OpenCode|Cursor|Windsurf|Codeium|Copilot|Aider|Cline|Devin|Anthropic|OpenAI|xAI|Sonnet|Opus|Haiku|GPT|Gemini|DeepSeek|Qwen|Llama|Mistral|Grok|Skills|\.claude/|\.opencode/|\.cursor/|\.windsurf/|\.continue/|\.clinerules/" <file>` to find all matches.
2. **Classify each match**:
   - Load-bearing prose → rewrite using the Vocabulary Map above.
   - Cross-reference link → rewrite anchor text and link target to neutral equivalent.
   - Illustrative example → wrap in ` ```binding-example ` fence or move under "Platform Binding Examples" heading.
   - Inside a genuinely agent-specific section → allowlist via section heading.
3. **Verify**: re-run the grep; expect zero matches outside allowlisted regions.
4. **Lint**: `npm run lint:md:fix` then `npm run lint:md`.
5. **Commit**: one commit per file (or per logical group within a phase).

## Enforcement

Enforcement is automated via `rhino-cli governance vendor-audit`.

### Running the audit manually

```bash
# Audit the governance/ directory (default)
go run apps/rhino-cli/main.go governance vendor-audit governance/

# Or via Nx (cached)
npx nx run rhino-cli:validate:governance-vendor-audit
```

Exit code 0 means clean; exit code 1 means violations found. Each finding prints:

```
<file>:<line>  <forbidden-term>  →  "<suggested-replacement>"
```

### Pre-push integration

The pre-push hook automatically runs `validate:governance-vendor-audit` when any `governance/**/*.md`
file changes. No manual invocation needed on pushes.

### Scope of the scanner

The scanner respects all exemption mechanisms described in the "Allowlist Mechanism" section above:
code fences, `binding-example` fences, "Platform Binding Examples" heading sections, inline code
spans, link URL portions, HTML comments, and YAML frontmatter. The convention file itself
(`governance-vendor-independence.md`) is also permanently allowlisted.

The `repo-rules-checker` agent continues to detect violations during its full audit sweep as a
complementary signal.

## Exceptions and Escape Hatches

The following are explicitly permitted and never constitute a violation:

1. **Inside `binding-example` fences**: any content, including vendor names and paths.
2. **Under "Platform Binding Examples" headings**: any content until the next same-level heading.
3. **The convention file itself** (`governance-vendor-independence.md`): this file uses vendor terms in examples to illustrate the rule. The audit tooling allowlists this file.
4. **`docs/reference/platform-bindings.md`**: catalog file; explicitly out of scope.
5. **`AGENTS.md` and `CLAUDE.md`** at the repo root: explicitly out of scope.
6. **Plans files** (`plans/`): explicitly out of scope.
7. **Citation context**: when citing an external source whose name happens to be a vendor term (e.g., "the AAIF specification donated by Anthropic in December 2025"), the citation is allowed. The pattern must be clearly attributive, not a product mention.

## Related Conventions

- [File Naming Convention](./file-naming.md) - Kebab-case file naming
- [Agent Naming Convention](./agent-naming.md) - Agent file naming standards
- [Plans Organization](./plans.md) - How plans are structured
- [Platform Bindings Catalog](../../../docs/reference/platform-bindings.md) - Full catalog of all platform bindings

## Conventions Implemented/Respected

- **[File Naming Convention](./file-naming.md)**: This file uses kebab-case.
- **[Linking Convention](../formatting/linking.md)**: All cross-references use GitHub-compatible markdown with `.md` extensions.
- **[Content Quality Principles](../writing/quality.md)**: Active voice, proper heading hierarchy, single H1.

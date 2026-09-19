---
description: Forbidden model-family/model names and vendor-branded concept terms, part 2 of the Forbidden Vendor Terms catalog, plus the combined audit regex and false-positive notes.
when_to_use: Use when checking whether a model name or vendor-branded concept term in governance prose is forbidden, or when you need the combined vendor-audit regex.
---

# Forbidden Vendor Terms — Models and Branded Concepts

> **A listed name is not a support claim.** Dropped harnesses stay here on purpose — their names
> must not leak into governance prose either. `repo-config.yml` `harness:` decides support.

## Model family / model names

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

## Vendor-branded concepts

| Pattern (regex)                                | Reason                                                    |
| ---------------------------------------------- | --------------------------------------------------------- |
| `\bSkills\b` (capitalized, as branded concept) | Vendor-branded term; use lowercase "agent skills" instead |

Combined audit regex used by `./rhino governance vendor validate`:

```
Claude Code|OpenCode|\bCursor\b|\bWindsurf\b|\bCodeium\b|\bCopilot\b|\bAider\b|\bCline\b|\bDevin\b|\.claude/|\.opencode/|\.cursor/|\.windsurf/|\.continue/|\.clinerules/|Anthropic|\bOpenAI\b|\bxAI\b|\bSonnet\b|\bOpus\b|\bHaiku\b|\bGPT\b|\bGemini\b|\bDeepSeek\b|\bQwen\b|\bLlama\b|\bMistral\b|\bGrok\b|\bSkills\b|\bJunie\b|\bJetBrains\b|\bAmazon Q\b|\bAntigravity\b|Pi Coding Agent|pi\.dev|\bEarendil\b|\.junie/|\.amazonq/|\.pi/|\.gemini/|\.agent/|\.agents/
```

> **Note**: `MCP`, `AGENTS.md`, and `Goose` are NOT forbidden — all three are Linux Foundation / AAIF cross-vendor standards shared across all major coding agents.
>
> **False-positive notes**:
>
> - `\bDevin\b` collides with the personal name. Reviewers should confirm context before treating as a violation.
> - `\bGrok\b` collides with the verb "to grok" (Heinlein, common in tech writing). Reviewers should distinguish product reference from verb usage.
> - `\bLlama\b`, `\bMistral\b` collide with non-AI English words but rarely appear in governance prose.
> - `\bAmazon Q\b` is matched only as the qualified phrase; bare `\bQ\b` is intentionally NOT forbidden (single-letter false-positive risk).
> - `Pi Coding Agent` / `pi\.dev` are matched only as qualified forms; bare `\bpi\b` is intentionally NOT forbidden (collides with the mathematical constant). The binary name `agy` is intentionally NOT forbidden (collides with common substrings).
> - `\.agents/` is an emerging cross-vendor skills directory; reviewers should confirm a match is load-bearing prose, not an allowlisted Platform Binding Examples region.

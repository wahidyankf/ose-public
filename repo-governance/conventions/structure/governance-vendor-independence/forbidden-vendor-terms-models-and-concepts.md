---
description: Forbidden model-family and model names, part 2 of the Forbidden Vendor Terms catalog, plus the branded-concept rule and substring false-positive notes.
when_to_use: Use when checking whether a model name or vendor-branded concept term in governance prose is forbidden, or how the plain-substring match can misfire.
---

# Forbidden Vendor Terms — Models and Branded Concepts

> **A listed name is not a support claim.** Dropped harnesses stay here on purpose — their names
> must not leak into governance prose either. `repo-config.yml` `harness:` decides support.

## Model family / model names

| Term       | Reason                                              |
| ---------- | --------------------------------------------------- |
| `Sonnet`   | Vendor model name                                   |
| `Opus`     | Vendor model name                                   |
| `Haiku`    | Vendor model name (the AI model, not the poem form) |
| `GPT`      | Vendor model family (OpenAI)                        |
| `Gemini`   | Vendor model family (Google)                        |
| `DeepSeek` | Vendor model family (DeepSeek)                      |
| `Qwen`     | Vendor model family (Alibaba)                       |
| `Llama`    | Vendor model family (Meta)                          |
| `Mistral`  | Vendor model family (Mistral AI)                    |
| `Grok`     | Vendor model family (xAI)                           |

## Vendor-branded concepts

| Term                          | Reason                                                    |
| ----------------------------- | --------------------------------------------------------- |
| `Skills` (as branded concept) | Vendor-branded term; use lowercase "agent skills" instead |

`Skills` is **unenforced by decision**: capitalized "Skills" is ordinary English in headings and
sentence starts, so a plain substring gate would fail on legitimate prose. Reviewers apply this rule;
the gate does not.

## Matching and false positives

`./rhino governance vendor validate` reads the declared list from `repo-config.yml` and fails on any
file under the declared roots that contains a term as a plain, case-sensitive substring, unless a
vocabulary exception pairs that term with that exact file. It has no regular expression, no word
boundary, and no skipped region.

> **Note**: `MCP`, `AGENTS.md`, and `Goose` are NOT forbidden — all three are Linux Foundation / AAIF cross-vendor standards shared across all major coding agents.
>
> **False-positive notes**:
>
> - A substring also matches inside a longer word: `Devin` inside a personal name, `Grok` in
>   "Grokking", or `Amazon Q` at the start of "Amazon Queue". Reword the sentence; add an exception
>   only for a page that must name the vendor.
> - Lowercase uses never match: "the cursor", "a haiku", "mistral winds", and binding paths such as
>   `.gemini/` are clean.
> - Bare `Q`, bare `pi`, and the binary name `agy` are intentionally NOT forbidden (single-letter,
>   mathematical-constant, and common-substring collisions).

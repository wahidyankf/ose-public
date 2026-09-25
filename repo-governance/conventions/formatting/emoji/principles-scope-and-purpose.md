---
description: The accessibility and consistency principles this convention implements, what it covers and does not cover, and the purpose emojis serve in documentation.
when_to_use: Use when you need to understand why this repository allows emoji in documentation or what the emoji convention covers.
---

# Principles, Scope, and Purpose

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Accessibility First](../../../principles/content/accessibility-first.md)**: Uses color-blind friendly emoji colors (blue, orange, teal, purple, brown). Emojis supplement text headings, never replace them. Semantic meaning is always conveyed through text first, emoji second.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Defines a standardized emoji vocabulary where each emoji has explicit, documented meaning. Same emoji = same meaning across all docs. No guessing or implicit conventions.

## Scope

### What This Convention Covers

- **Where emojis are allowed** - docs/, READMEs, plans/, repo-governance/, AGENTS.md, CLAUDE.md, the canonical `.agents/` agent and skill directories, and generated agent routes
- **Where emojis are forbidden** - config files (_.json,_.yaml, \*.toml), source code
- **Semantic emoji usage** - Using emojis for meaning, not decoration
- **Emoji consistency** - Standard emojis for common concepts
- **Accessibility considerations** - How emojis affect screen readers

### What This Convention Does NOT Cover

- **Emoji rendering** - Platform-specific emoji display (implementation detail)
- **Custom emojis** - Creating custom emoji sets
- **Emoji in commit messages** - Git commit formatting covered separately
- **Emoji alternatives** - When emojis aren't available (fallback text)

## Purpose

Emojis in documentation should:

1. **Enhance scannability** - Help readers quickly locate content types
2. **Add semantic meaning** - Reinforce the purpose of sections
3. **Improve engagement** - Make long documentation more visually interesting
4. **Maintain consistency** - Same emoji = same meaning across all docs

Emojis should **NOT**:

- Be purely decorative without semantic value
- Replace clear text headings
- Appear in code, commands, or technical specifications
- Be overused (causing visual noise)

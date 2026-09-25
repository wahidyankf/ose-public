---
description: The two mechanisms — binding-example fences and the Platform Binding Examples heading — that allow vendor references inside governance files for illustrative purposes.
when_to_use: Use when you need to legitimately include a vendor-specific example inside governance prose without triggering the vendor-audit scanner.
---

# Allowlist Mechanism

Two mechanisms allow vendor references inside governance files when genuinely needed for illustrative purposes:

## 1. `binding-example` fenced block (granular, inline)

Wrap any inline vendor-specific example in a ` ```binding-example ` fence. The vendor-audit scanner skips the entire content of such fences.

````markdown
```binding-example
# Example: how a Claude Code binding resolves this rule
model: claude-sonnet-4-6
```
````

## 2. "Platform Binding Examples" section heading (page-level)

Place all vendor-specific content for a page under a heading whose text matches the pattern `Platform Binding Examples` (case-insensitive). The scanner skips every line from that heading until the next same-level heading or end of file.

```markdown
## Platform Binding Examples

### Claude Code

The `.agents/agents/plan-maker.md` frontmatter sets `model: claude-sonnet-4-6`.

### OpenCode

The `.opencode/agents/plan-maker.md` declares a `permission:` object rather than a `tools:` array.
```

**Precedence**: the fence mechanism wins for any line inside both a fence and a heading scope.

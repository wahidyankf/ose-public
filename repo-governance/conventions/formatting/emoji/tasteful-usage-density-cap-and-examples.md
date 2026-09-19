---
description: The soft density limits on emoji per heading and per paragraph, and side-by-side good-vs-bad examples of emoji usage in documentation.
when_to_use: Use when checking whether a document has too many emojis, or when you need a concrete good-vs-bad usage example.
---

# Tasteful Usage: Density Cap and Examples

## Density Cap

Enforce these soft limits; exceeding them is a governance finding:

- **At most ~1 emoji per heading.** If a heading needs two emojis to communicate, the heading is trying to say too much — split it.
- **At most ~1 emoji per paragraph of body text**, and only for inline status indicators (PASS/FAIL/warning). Plain prose should not contain emojis.
- **Zero emojis in config files and source code.** This is a hard ban, not a soft cap (see Usage Rules FAIL list).
- **Zero emojis in YAML frontmatter and file names.**

**Known exceptions to the source-code ban** (documented per accepted false positives in
`local-tmp/.known-false-positives.md`):

- Command-line tools using emoji for terminal output formatting (for example status indicators ✓ ✗ ✅ ❌)
- Web UI component code where emoji is part of rendered UI content (e.g., React TSX components
  in `apps/*/src/` for ayokoding-www, organiclever-www, ose-www, and `libs/web-ui/src/`)

These exceptions apply when emoji appears in user-visible output layers (terminal UI, rendered
HTML), not in business logic or configuration.

## Good vs Bad Examples

✅ **Good — one emoji marks a section, one status indicator inside an example:**

```markdown
## 🔒 Security Considerations

Authentication uses OAuth2 with PKCE. Validate every token server-side.

✅ **Correct:** Validate on every request
❌ **Incorrect:** Cache auth decisions in localStorage
```

✅ **Good — plan checklist with status indicators:**

```markdown
## Delivery Checklist

- ✅ Define API contract in OpenAPI spec
- ✅ Generate TypeScript types via codegen
- 🚧 Implement handler with validation
- ⏳ Add integration tests against real DB
- ⏳ Update documentation
```

❌ **Bad — every bullet prefixed, decorative emojis, density too high:**

```markdown
## 🚀 Getting Started 🎉

🌟 Welcome to our amazing project! 😎

- 📝 Read the docs
- 🔧 Install dependencies
- 🏃 Run the dev server
- 🎨 Customize the theme
- 🚢 Deploy to production
```

❌ **Bad — emoji as bullet substitute, emoji in every heading:**

```markdown
## 📘 Overview

👉 This project does X.
👉 It integrates with Y.
👉 It supports Z.

## 📗 Installation

👉 Run `npm install`.

## 📕 Usage

👉 Run `npm start`.
```

# hugo-commons

Shared Go utilities for Hugo site CLIs in the Open Sharia Enterprise platform.

## Overview

This library provides packages shared between CLI tools that operate on Hugo sites
(`ayokoding-cli` and `oseplatform-cli`). It understands Hugo-specific conventions
such as `_index.md` section pages and Hugo absolute URL paths.

## Packages

### `links`

Link-checking utilities for Hugo site content directories.

- `CheckLinks(contentDir string) (*CheckResult, error)` — walks all `.md` files and validates internal links
- `OutputLinksText(...)` — human-readable text report
- `OutputLinksJSON(...)` — JSON report
- `OutputLinksMarkdown(...)` — Markdown report

Hugo-specific behavior:

- Resolves links to both `target.md` and `target/_index.md`
- Skips external links (`http://`, `https://`, `mailto:`, `//`)
- Skips anchor-only links (`#section`)
- Skips links to static assets (files with extensions like `.xml`, `.pdf`)
- Ignores links inside fenced code blocks

## Usage

Import via the Go workspace replace directive:

```go
import "github.com/wahidyankf/ose-public/libs/hugo-commons/links"
```

## Development

```bash
# Run tests with coverage enforcement (≥80%)
nx run hugo-commons:test:quick

# Lint
nx run hugo-commons:lint

# Tidy dependencies
nx run hugo-commons:install
```

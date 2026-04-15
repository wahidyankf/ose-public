# golang-commons

Shared Go utilities for Open Sharia Enterprise CLI tools.

## Purpose

Provides common packages used across multiple Go CLI applications (`ayokoding-cli`, `oseplatform-cli`, `rhino-cli`) and libraries (`hugo-commons`).

## Packages

### `timeutil`

Timestamp utilities shared across Go CLI tools and libraries.

**Import path**: `github.com/wahidyankf/ose-public/libs/golang-commons/timeutil`

**Exports**:

- `Timestamp() string` — current time in RFC3339 format
- `JakartaTimestamp() string` — current time as ISO 8601 in the Asia/Jakarta timezone (UTC+7)

### `testutil`

Testing utilities for Go CLI tools.

**Import path**: `github.com/wahidyankf/ose-public/libs/golang-commons/testutil`

**Exports**:

- `CaptureStdout(t *testing.T) func() string` — redirects stdout to a pipe; call the returned function to restore stdout and retrieve captured output

### `links`

Link-checking utilities for Hugo site CLIs.

**Import path**: `github.com/wahidyankf/ose-public/libs/golang-commons/links`

**Exports**:

- `BrokenLink` — broken link representation (source file, line, text, target)
- `CheckResult` — aggregate result (checked count, error count, errors, broken links)
- `CheckLinks(contentDir string) (*CheckResult, error)` — walks all `.md` files and validates internal links
- `OutputLinksText(result, elapsed, quiet, verbose)` — human-readable stdout report
- `OutputLinksJSON(result, elapsed) error` — JSON stdout report
- `OutputLinksMarkdown(result, elapsed)` — Markdown stdout report

## Usage

```go
import "github.com/wahidyankf/ose-public/libs/golang-commons/links"

result, err := links.CheckLinks("apps/ayokoding-web/content")
if err != nil {
    return err
}
links.OutputLinksText(result, elapsed, quiet, verbose)
```

## Commands

```bash
# Run tests
nx run golang-commons:test:quick

# Lint
nx run golang-commons:lint

# Tidy dependencies
nx run golang-commons:install
```

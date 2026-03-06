# ayokoding-cli

Command-line tools for ayokoding-web Hugo site maintenance and automation.

## What is ayokoding-cli?

A Go-based CLI tool that automates repetitive tasks for the ayokoding-web Hugo site. Provides fast navigation regeneration with support for multiple output formats and verbose logging.

**Why Go instead of bash?** The original navigation regeneration was done by an AI agent making hundreds of file I/O calls. Moving this logic to a compiled binary provides 100-1000x performance improvement (50ms vs several seconds for 74 files).

## Quick Start

```bash
# Regenerate all navigation
ayokoding-cli nav regen

# Regenerate specific directory
ayokoding-cli nav regen --path apps/ayokoding-web/content/en/learn

# Verbose output with timestamps
ayokoding-cli nav regen --verbose

# JSON output for scripting
ayokoding-cli nav regen -o json
```

## Installation

Build the CLI tool from the repository root:

```bash
cd apps/ayokoding-cli
go build -o dist/ayokoding-cli
```

The binary will be created at `apps/ayokoding-cli/dist/ayokoding-cli`.

## Commands

### Navigation Management

#### Regenerate Navigation

```bash
# Basic usage
ayokoding-cli nav regen

# Custom path (flag or positional)
ayokoding-cli nav regen --path /custom/path
ayokoding-cli nav regen /custom/path

# Verbose output
ayokoding-cli nav regen --verbose
```

**What it does:**

- Scans all `_index.md` files in `apps/ayokoding-web/content/`
- Excludes root language files (`en/_index.md`, `id/_index.md`)
- Extracts frontmatter from each file (preserves exactly)
- Scans file structure 2 layers deep
- Generates DFS navigation tree with proper indentation
- Sorts items by weight within each level
- **Generates absolute paths with language prefix** for all navigation links (e.g., `/en/learn/swe/prog-lang/python`)
- Writes updated navigation back to files

**CRITICAL - Absolute Path Requirement**: All generated navigation links use **absolute paths with language prefix**. This is required for Hugo sites because relative paths break when content is rendered in different page contexts (sidebar, hamburger menu, content pages). See [Hugo Content Convention - ayokoding-web](../../governance/conventions/hugo/ayokoding.md#internal-link-requirements) for complete details.

**Flags:**

- `--path, -p` - Content directory (default: apps/ayokoding-web/content)
- `--exclude` - Files to exclude (default: en/\_index.md, id/\_index.md)

**Global Flags** (available to all commands):

- `--verbose, -v` - Verbose output with timestamps
- `--quiet, -q` - Quiet mode (errors only)
- `--output, -o` - Output format: text, json, markdown
- `--no-color` - Disable colored output

### Title Management

#### Update Titles

```bash
# Update all titles (both English and Indonesian)
ayokoding-cli titles update

# Update specific language
ayokoding-cli titles update --lang en
ayokoding-cli titles update --lang id

# Preview changes without writing (dry-run)
ayokoding-cli titles update --dry-run

# Verbose output
ayokoding-cli titles update --verbose

# JSON output
ayokoding-cli titles update -o json
```

**What it does:**

- Scans all `.md` files in `apps/ayokoding-web/content/en/` and `apps/ayokoding-web/content/id/`
- Generates titles from filenames using Title Case
- Applies custom overrides for special cases (e.g., "cliftonstrengths" → "CliftonStrengths")
- Handles lowercase articles/prepositions (e.g., "terms-and-conditions" → "Terms and Conditions")
- Updates frontmatter title field only if it differs from expected
- Skips files that already have correct titles (idempotent, cleaner git diffs)

**Title Generation Algorithm:**

1. Extract filename (without extension, strip leading underscores)
2. Check for exact filename override in config
3. Split on hyphens and underscores
4. For each word:
   - Check for per-word override (e.g., "javascript" → "JavaScript")
   - Capitalize first letter
   - Apply lowercase rules for articles/prepositions (except first word)
5. Join with spaces

**Examples:**

- `programming-language` → "Programming Language"
- `corporate-finance` → "Corporate Finance"
- `terms-and-conditions` → "Terms and Conditions" (not "Terms And Conditions")
- `cliftonstrengths` → "CliftonStrengths" (exact override)
- `javascript-basics` → "JavaScript Basics" (per-word override)

**Flags:**

- `--lang` - Language to process: en, id, or both (default: both)
- `--dry-run` - Preview changes without writing files
- `--config-en` - Path to English config (default: apps/ayokoding-cli/config/title-overrides-en.yaml)
- `--config-id` - Path to Indonesian config (default: apps/ayokoding-cli/config/title-overrides-id.yaml)

**Configuration:**

The CLI uses two YAML configuration files for overrides:

- `apps/ayokoding-cli/config/title-overrides-en.yaml` - English overrides
- `apps/ayokoding-cli/config/title-overrides-id.yaml` - Indonesian overrides

Each config file defines:

1. **Overrides**: Special cases for exact filename matches or per-word replacements
2. **Lowercase words**: Articles/prepositions that should stay lowercase (except first word)

**Example config:**

```yaml
overrides:
  cliftonstrengths: "CliftonStrengths"
  javascript: "JavaScript"
  typescript: "TypeScript"

lowercase_words:
  - and
  - or
  - the
  - of
  - in
```

### Link Validation

#### Check Internal Links

```bash
# Check all internal links (default content directory)
ayokoding-cli links check

# Check specific content directory
ayokoding-cli links check --content apps/ayokoding-web/content

# JSON output for scripting or CI
ayokoding-cli links check -o json

# Quiet mode (errors/broken links only; no output on success)
ayokoding-cli links check --quiet
```

**What it does:**

- Walks all `.md` files in the content directory
- Extracts every markdown link (`[text](target)`) from non-code-block lines
- Skips external links (`http://`, `https://`, `mailto:`, `//`) — use the
  `apps-ayokoding-web-link-checker` AI agent for those
- Skips same-page anchors (`#section`)
- Strips `#fragment` and `?query` from internal link targets before resolving
- Resolves each internal link against the content directory:
  - `/en/learn/overview` → `content/en/learn/overview.md` OR `content/en/learn/overview/_index.md`
- Reports all broken links with source file, line number, link text, and target
- **Exits with code 1** when broken links are found

**Internal vs External links:**

| Type                     | Example                  | Handled by                              |
| ------------------------ | ------------------------ | --------------------------------------- |
| Internal (Hugo absolute) | `/en/learn/swe/overview` | `ayokoding-cli links check`             |
| External URL             | `https://example.com`    | `apps-ayokoding-web-link-checker` agent |
| Same-page anchor         | `#section-name`          | Not validated                           |

**Exit codes:**

- `0` — All internal links resolve to real files
- `1` — One or more broken internal links found

**Flags:**

- `--content` — Content directory path (default: `apps/ayokoding-web/content`)

**Nx integration:**

```bash
# Run standalone (builds ayokoding-cli first automatically)
nx run ayokoding-web:links:check

# Runs automatically as part of test:quick
nx run ayokoding-web:test:quick
```

**Performance:** ~100ms for 850+ files / 3000+ links

## Help Commands

```bash
# General help
ayokoding-cli --help
ayokoding-cli help

# Command-specific help
ayokoding-cli nav --help
ayokoding-cli nav regen --help

# Version
ayokoding-cli --version
```

## Architecture

```
apps/ayokoding-cli/
├── cmd/
│   ├── root.go               # Cobra root command, global flags
│   ├── nav.go                # Navigation command group
│   ├── nav_regen.go          # nav regen - regenerate navigation
│   ├── titles.go             # Title management command group
│   ├── titles_update.go      # titles update - update frontmatter titles
│   ├── links.go              # Link management command group
│   └── links_check.go        # links check - validate internal links
├── internal/
│   ├── navigation/           # Navigation generation logic
│   │   ├── scanner.go        # File structure scanner (3 layers) + absolute path builder
│   │   ├── generator.go      # Markdown DFS tree generator + absolute path links
│   │   └── regenerate.go     # Main orchestration logic
│   ├── markdown/             # Markdown utilities
│   │   └── frontmatter.go    # YAML frontmatter extraction
│   ├── titles/               # Title update logic
│   └── links/                # Link validation logic
│       └── checker.go        # Internal link checker (walk, extract, resolve)
├── dist/                     # Built binary (gitignored)
├── main.go                   # CLI entry point (Cobra execution)
├── go.mod                    # Go module definition (+ Cobra)
└── project.json              # Nx project configuration
```

**Critical Bug Fix (2025-12-21)**: Prior to this date, `scanner.go`, `regenerate.go`, and `generator.go` generated relative paths for navigation links, causing broken links when navigating from certain page contexts. All three files were updated to generate absolute paths with language prefixes (`/en/learn/...`, `/id/belajar/...`) ensuring links work correctly from any page context in Hugo.

## Migration Notes

### v0.3.0 → v0.4.0

**New**: `links check` command for internal link validation.

- No breaking changes
- `nx run ayokoding-web:test:quick` now runs `links:check` before the Hugo build
- Fix broken internal links to keep CI green: `nx run ayokoding-web:links:check`

### v0.2.0 → v0.3.0 (Breaking Change)

**BREAKING**: Legacy `regen-nav` command removed. Use new grouped syntax only:

```bash
# ❌ Old syntax (NO LONGER SUPPORTED)
ayokoding-cli regen-nav [path]

# ✅ Current syntax (REQUIRED)
ayokoding-cli nav regen [--path=path]
```

**Impact**:

- All scripts and agents must be updated to use new syntax
- `ayokoding-web-navigation-maker` agent updated to use `nav regen`

### v0.1.0 → v0.2.0

- **Grouped subcommands**: Navigation commands under `nav` group
- **Global flags**: --verbose, --quiet, --output, --no-color
- **Output formats**: JSON and Markdown in addition to text
- **Better help**: Context-aware help with examples

## Integration with AI Agents

### ayokoding-web-navigation-maker

The `ayokoding-web-navigation-maker` agent regenerates navigation listings by calling:

```bash
./apps/ayokoding-cli/dist/ayokoding-cli nav regen
```

**Performance**: ~25ms for 74 files

### ayokoding-web-title-maker

The `ayokoding-web-title-maker` agent updates title fields by calling:

```bash
./apps/ayokoding-cli/dist/ayokoding-cli titles update
```

**Performance**: ~40ms for 150 files

### Workflow Integration

Typical workflow when adding new content:

1. **Create content**: `ayokoding-web-general-maker` creates new markdown files
2. **Update titles**: `ayokoding-web-title-maker` standardizes titles from filenames
3. **Generate navigation**: `ayokoding-web-navigation-maker` regenerates navigation listings
4. **Validate structure**: `ayokoding-web-structure-checker` validates structure and ordering
5. **Fix issues**: `ayokoding-web-structure-fixer` fixes any validation issues

### Pre-commit Automation

**Automatic title and navigation updates** are enabled via git pre-commit hook when committing ayokoding-web content changes:

```json
// apps/ayokoding-web/project.json
"pre-commit-script": {
  "commands": [
    "nx build ayokoding-cli",           // Rebuild CLI (Nx cached: ~250ms)
    "titles update --quiet",             // Update titles (~40ms)
    "nav regen --quiet"                  // Regenerate navigation (~25ms)
  ]
}
```

**How it works:**

1. Developer commits changes to `apps/ayokoding-web/content/`
2. Pre-commit hook detects changes via `nx affected -t pre-commit-script`
3. CLI is rebuilt (Nx cache hit: ~250ms, with changes: ~674ms)
4. Titles and navigation updated automatically
5. Modified files auto-staged and included in commit

**Performance benchmarks:**

- Total hook time (cached): **~725ms** ✨
- Total hook time (with CLI changes): **~1.3s**
- Acceptable overhead for ensuring consistency

**Benefits:**

- Zero manual steps for developers
- Titles and navigation always up-to-date
- Fresh CLI binary on every commit
- Nx caching keeps it fast

**Note:** Agents (`ayokoding-web-title-maker`, `ayokoding-web-navigation-maker`) are still useful for:

- Batch updates across all content
- Manual corrections outside commit workflow
- Testing changes in isolation

## Testing

Two test tiers cover different concerns:

### Unit Tests

```bash
# Run unit tests (no build tag required)
go test ./...

# Via Nx (includes 95% line coverage check)
nx run ayokoding-cli:test:quick
```

Unit tests cover isolated pure functions, algorithmic logic, and edge cases not
reachable from integration tests. Coverage threshold: ≥95% line coverage.

### Integration Tests

```bash
# Run all 13 BDD integration tests
nx run ayokoding-cli:test:integration

# Run a specific suite during development
cd apps/ayokoding-cli
go test -v -tags=integration -run TestIntegrationNavRegen ./cmd/...
go test -v -tags=integration -run TestIntegrationTitlesUpdate ./cmd/...
go test -v -tags=integration -run TestIntegrationLinksCheck ./cmd/...
```

Integration tests use [godog](https://github.com/cucumber/godog) to run Gherkin
scenarios from `specs/apps/ayokoding-cli/`. They are co-located in `cmd/` (same
package) to access unexported flag variables. Three suites cover all 3 commands:

| Test function                 | Feature file                                       | Scenarios |
| ----------------------------- | -------------------------------------------------- | --------- |
| `TestIntegrationNavRegen`     | `specs/apps/ayokoding-cli/nav/nav-regen.feature`        | 5         |
| `TestIntegrationTitlesUpdate` | `specs/apps/ayokoding-cli/titles/titles-update.feature` | 4         |
| `TestIntegrationLinksCheck`   | `specs/apps/ayokoding-cli/links/links-check.feature`    | 4         |

The `test:integration` target is cached — it only re-runs when `cmd/**/*.go` or
`specs/apps/ayokoding-cli/**/*.feature` files change.

## Development

### Build

```bash
go build -o dist/ayokoding-cli
```

### Lint

```bash
# Run directly
golangci-lint run ./...

# Run via Nx
nx lint ayokoding-cli
```

Linting uses the shared configuration at `.golangci.yml` in the repository root. golangci-lint discovers it automatically by walking up parent directories from the app's working directory.

### Run without building

```bash
go run main.go nav regen
```

## Nx Integration

The CLI is integrated into the Nx workspace:

```bash
# Build via Nx
nx build ayokoding-cli

# Run fast quality gate via Nx
nx run ayokoding-cli:test:quick

# Run via Nx
nx run ayokoding-cli
```

**Available Nx Targets:**

- `build` - Build the CLI binary to `dist/`
- `test:quick` - Run unit tests (`go test ./...`)
- `test:integration` - Run BDD integration tests (godog, 13 scenarios)
- `lint` - Static analysis via golangci-lint
- `run` - Run the CLI directly (`go run main.go`)
- `install` - Install Go dependencies (`go mod tidy`)

## Performance

Navigation regeneration performance comparison:

- **AI Agent (bash/awk)**: ~3-5 seconds for 74 files
- **Go CLI**: ~50ms for 74 files
- **Speedup**: 60-100x faster

## References

- [ayokoding-web-navigation-maker Agent](../../.claude/agents/apps-ayokoding-web-navigation-maker.md)
- [Hugo Content Convention - ayokoding-web](../../governance/conventions/hugo/ayokoding.md)
- [AI Agents Convention](../../governance/development/agents/ai-agents.md)

# rhino-cli

**RHINO** – Repository Hygiene & INtegration Orchestrator

Command-line tools for repository management and automation.

## What is rhino-cli?

A Go-based CLI tool that provides utilities for repository management and automation tasks. Built with Cobra CLI framework for powerful command-line interfaces.

## Quick Start

```bash
# Check test coverage against a threshold (standard line-based algorithm)
rhino-cli test-coverage validate apps/rhino-cli/cover.out 85

# Check all required development tools are installed
rhino-cli doctor

# Validate Claude Code format
rhino-cli agents validate-claude

# Sync Claude Code → OpenCode configurations
rhino-cli agents sync

# Validate sync is correct
rhino-cli agents validate-sync

# Validate markdown links in the repository
rhino-cli docs validate-links

# Validate only staged files (useful in git hooks)
rhino-cli docs validate-links --staged-only

# Validate BDD spec coverage (all specs have matching test files)
rhino-cli spec-coverage validate specs/apps/organiclever-web apps/organiclever-web

# Echo a message
rhino-cli --say "hello world"

# Verbose output with timestamps
rhino-cli --say "hello" --verbose

# Quiet mode (errors only)
rhino-cli --say "hello" --quiet
```

## Installation

Build the CLI tool from the repository root:

```bash
cd apps/rhino-cli
go build -o dist/rhino-cli
```

The binary will be created at `apps/rhino-cli/dist/rhino-cli`.

## Global Flags

### Say Flag

Echo a message to standard output.

```bash
# Basic usage
rhino-cli --say "hello world"

# Verbose output with timestamps
rhino-cli --say "hello" --verbose

# Quiet mode
rhino-cli --say "hello" --quiet

# Custom output format
rhino-cli --say "hello" -o json
```

**What it does:**

- Prints the provided message to stdout
- Supports verbose mode with timestamps
- Supports quiet mode for minimal output
- Handles special characters (quotes, newlines, tabs, etc.)

**Global Flags:**

- `--say` - Echo a message to stdout
- `--verbose, -v` - Verbose output with timestamps
- `--quiet, -q` - Quiet mode (errors only)
- `--output, -o` - Output format: text, json, markdown
- `--no-color` - Disable colored output

## Commands

### test-coverage validate

Check test coverage against a minimum threshold using a standard line-based algorithm.
Supports Go `cover.out`, LCOV, JaCoCo XML, and Cobertura XML formats; auto-detects from filename and content.

```bash
# Check Go cover.out (path relative to git root)
rhino-cli test-coverage validate apps/rhino-cli/cover.out 85

# Check LCOV coverage from Vitest
rhino-cli test-coverage validate apps/organiclever-web/coverage/lcov.info 85

# Output as JSON
rhino-cli test-coverage validate apps/rhino-cli/cover.out 85 -o json

# Output as markdown
rhino-cli test-coverage validate apps/rhino-cli/cover.out 85 -o markdown

# Quiet mode
rhino-cli test-coverage validate apps/rhino-cli/cover.out 85 -q
```

**What it does:**

- Auto-detects format: `.info` or filename containing `lcov` → LCOV; otherwise → Go cover.out
- Implements a standard line-based algorithm:
  - **Covered**: hit count > 0 AND all branches taken (or no branches)
  - **Partial**: hit count > 0 but some branches not taken
  - **Missed**: hit count = 0
  - Coverage % = covered / (covered + partial + missed)
  - Partial lines count as NOT covered
- Go-specific filtering (standard executable-line filtering): excludes blank lines, comment-only
  lines (`//`), and brace-only lines (`{` or `}`)
- Supports multiple output formats (text, JSON, markdown)

**Arguments:**

- `<coverage-file>` - Path to coverage file relative to git root (e.g. `apps/rhino-cli/cover.out`)
- `<threshold>` - Minimum coverage percentage (e.g. `85`)

**Flags:**

- `-o, --output` - Output format: text, json, markdown (default: text)
- `-v, --verbose` - Verbose output with timestamps
- `-q, --quiet` - Quiet mode (errors only)
- `--per-file` - Show per-file coverage breakdown (sorted ascending by %)
- `--below-threshold <pct>` - With `--per-file`, show only files below this coverage percentage
- `--exclude <glob>` - Exclude files matching glob pattern (repeatable)

**Exit codes:**

- `0` - Coverage meets or exceeds threshold
- `1` - Coverage is below threshold

**Example output (text):**

```
Line coverage: 86.08% (2411 covered, 141 partial, 249 missed, 2801 total)
PASS: 86.08% >= 85% threshold
```

**Example output (JSON):**

```json
{
  "status": "success",
  "timestamp": "2026-03-05T10:00:00+07:00",
  "file": "apps/rhino-cli/cover.out",
  "format": "go",
  "covered": 2411,
  "partial": 141,
  "missed": 249,
  "total": 2801,
  "pct": 86.08,
  "threshold": 85,
  "passed": true
}
```

**Replaces:**

This command replaces the Python script `scripts/validate-test-coverage.py`, eliminating the Python
dependency and consolidating all tooling in rhino-cli.

### docs validate-links

Validate markdown links in the repository. Scans markdown files for broken internal links and generates a categorized report.

```bash
# Validate all markdown files
rhino-cli docs validate-links

# Validate only staged files (useful in pre-commit hooks)
rhino-cli docs validate-links --staged-only

# Output as JSON
rhino-cli docs validate-links -o json

# Output as markdown report
rhino-cli docs validate-links -o markdown

# Verbose mode
rhino-cli docs validate-links -v

# Quiet mode (errors only)
rhino-cli docs validate-links -q
```

**What it does:**

- Scans markdown files in core directories (docs/, governance/, .claude/, and root)
- Validates that all internal links point to existing files
- Automatically skips external URLs (http://, https://)
- Automatically skips Hugo paths (starting with /)
- Automatically skips placeholder links (path.md, target, etc.)
- Automatically skips example patterns (tu**\*, ex**\*, etc.)
- Categorizes broken links for easier fixing
- Supports multiple output formats (text, json, markdown)

**Flags:**

- `--staged-only` - Only validate staged files from git
- `-o, --output` - Output format: text, json, markdown (default: text)
- `-v, --verbose` - Verbose output with timestamps
- `-q, --quiet` - Quiet mode (errors only)

**Exit codes:**

- `0` - All links valid
- `1` - Broken links found

**Output categories:**

1. **Missing files** - Common files like CODE_OF_CONDUCT.md, CHANGELOG.md
2. **General/other paths** - All other broken links
3. **workflows/ paths** - Links to workflows/ (not governance/workflows/)
4. **vision/ paths** - Links to vision/ (not governance/vision/)
5. **conventions README** - Links to conventions/README.md

**Example output (text):**

```
# Broken Links Report

**Total broken links**: 3

## General/other paths (3 links)

### docs/file.md

- Line 10: `../missing.md`
- Line 20: `./another-missing.md`

### README.md

- Line 5: `./nonexistent.md`
```

**Example output (JSON):**

```json
{
  "status": "failure",
  "timestamp": "2026-01-21T15:30:00+07:00",
  "total_files": 350,
  "total_links": 3920,
  "broken_count": 3,
  "duration_ms": 234,
  "categories": {
    "General/other paths": [
      {
        "source_file": "docs/file.md",
        "line_number": 10,
        "link_text": "../missing.md",
        "target_path": "/path/to/missing.md"
      }
    ]
  }
}
```

**Replaces:**

This command replaces the Python script at `scripts/validate-docs-links.py` with a faster, more maintainable Go implementation.

### docs validate-mermaid

Validate Mermaid flowchart diagrams in markdown files for structural issues. Read-only
checker — never modifies any file. Only `flowchart` and `graph` keyword blocks are
validated; all other Mermaid diagram types (`sequenceDiagram`, `classDiagram`, `gantt`,
etc.) are silently skipped. The following directories are always excluded from recursive
walks: `.next` (Next.js build artifacts), `node_modules`, `.git`.

```bash
# Validate governance/ and .claude/ (default Nx target scope)
rhino-cli docs validate-mermaid governance/ .claude/

# Validate specific files or directories
rhino-cli docs validate-mermaid docs/ governance/

# Only validate files staged in git (pre-commit use)
rhino-cli docs validate-mermaid --staged-only

# Only validate files changed since upstream (pre-push use)
rhino-cli docs validate-mermaid --changed-only

# Set custom thresholds
rhino-cli docs validate-mermaid --max-label-len 20 --max-width 4

# Output as JSON
rhino-cli docs validate-mermaid -o json

# Output as markdown report
rhino-cli docs validate-mermaid -o markdown
```

**Three enforced rules (flowchart/graph blocks only):**

1. **Label length** (`--max-label-len N`, default 30) — each visual line of a node label
   must be ≤ N characters. Labels using `<br/>` or `\n` are split; the longest line is
   checked. Use `--max-label-len 20` to enforce the stricter Hugo/Hextra limit.
2. **Parallel rank width** (`--max-width N`, default 3) — max nodes at the same rank.
   Exception: when BOTH span > max-width AND depth > max-depth, a non-blocking **warning**
   is emitted instead of a hard error (both-exceeded path, see `--max-depth`).
3. **Single diagram per block** — each fenced mermaid block must contain exactly one
   `flowchart`/`graph` header.

**Flags:**

| Flag                | Default | Description                                                                                           |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| `--staged-only`     | false   | Only validate staged files (pre-commit use)                                                           |
| `--changed-only`    | false   | Only validate files changed since upstream (pre-push use)                                             |
| `--max-label-len N` | 30      | Max chars per visual line in a node label                                                             |
| `--max-width N`     | 3       | Max nodes at same rank before violation                                                               |
| `--max-depth N`     | 5       | Depth threshold for both-exceeded warning: span>max-width AND depth>max-depth emits warning not error |
| `-o, --output`      | text    | Output format: text, json, markdown                                                                   |
| `-v, --verbose`     | false   | Include per-file detail in text output                                                                |
| `-q, --quiet`       | false   | Suppress non-error output                                                                             |

**Exit codes:**

- `0` — No violations (warnings alone do not cause failure)
- `1` — One or more violations found
- `2` — Command invocation error

---

### agents sync

Sync Claude Code agents and skills to OpenCode format. Converts `.claude/` configuration to `.opencode/` format with proper YAML frontmatter transformation.

```bash
# Sync all agents and skills
rhino-cli agents sync

# Preview changes without modifying files
rhino-cli agents sync --dry-run

# Sync only agents (skip skills)
rhino-cli agents sync --agents-only

# Sync only skills (skip agents)
rhino-cli agents sync --skills-only

# Output as JSON
rhino-cli agents sync -o json

# Verbose mode
rhino-cli agents sync -v
```

**What it does:**

**Agents (`.claude/agents/` → `.opencode/agents/`):**

- Converts tools array to boolean map (`Read, Write` → `read: true, write: true`)
- Maps models (`sonnet`/`opus` → `opencode-go/minimax-m2.7`, `haiku` → `opencode-go/glm-5`, empty → `opencode-go/minimax-m2.7`)
- Removes Claude-specific fields (`name`, `color`)
- Preserves description, skills, and body content
- Normalizes YAML formatting (adds spaces after colons)

**Skills:**

- No mirror copy — OpenCode reads `.claude/skills/<name>/SKILL.md` natively per [opencode.ai/docs/skills](https://opencode.ai/docs/skills/).
- `validate:sync` `No Synced Skill Mirror` check fails if a stale `.opencode/skill/` or `.opencode/skills/<claude-name>` mirror reappears.

**Performance:** ~25-60x faster than bash scripts (121ms vs 3-5 seconds)

**Flags:**

- `--dry-run` - Preview changes without modifying files
- `--agents-only` - Sync only agents (skip skills)
- `--skills-only` - Sync only skills (skip agents)
- `-o, --output` - Output format: text, json, markdown (default: text)
- `-v, --verbose` - Verbose output with timestamps
- `-q, --quiet` - Quiet mode (errors only)

**Exit codes:**

- `0` - All conversions successful
- `1` - One or more conversions failed

**Replaces:**

This command replaces the bash scripts `scripts/sync-claude-to-opencode.sh` and `scripts/validate-sync.sh` with a faster, more robust Go implementation.

### agents validate-sync

Validate that `.claude/` and `.opencode/` configurations are semantically equivalent.

```bash
# Validate sync
rhino-cli agents validate-sync

# Output as JSON
rhino-cli agents validate-sync -o json

# Verbose mode (show all checks)
rhino-cli agents validate-sync -v

# Quiet mode (show only summary)
rhino-cli agents validate-sync -q
```

**What it does:**

**Agent Validation:**

- Count check: Ensures equal number of agents in both directories
- Equivalence check for each agent:
  - Description matches exactly
  - Model correctly converted (sonnet/opus/empty → opencode-go/minimax-m2.7, haiku → opencode-go/glm-5)
  - Tools correctly mapped (array → boolean map, lowercase)
  - Skills array matches exactly
  - Body content identical

**Skill Validation:**

- Count check: Ensures equal number of skills in both directories
- Identity check: Validates skills are byte-for-byte identical

**Flags:**

- `-o, --output` - Output format: text, json, markdown (default: text)
- `-v, --verbose` - Show all checks (default: show only failures)
- `-q, --quiet` - Quiet mode (show only summary)

**Exit codes:**

- `0` - All validation checks passed
- `1` - One or more validation checks failed

**Example output (text):**

```
Validation Complete
==================================================

Total Checks: 68
Passed: 68
Failed: 0
Duration: 60ms

Status: ✓ VALIDATION PASSED
```

### agents validate-claude

Validate Claude Code agent and skill format in `.claude/` directory.

```bash
# Validate all agents and skills
rhino-cli agents validate-claude

# Output as JSON
rhino-cli agents validate-claude -o json

# Verbose mode (show all checks)
rhino-cli agents validate-claude -v

# Validate only agents
rhino-cli agents validate-claude --agents-only

# Validate only skills
rhino-cli agents validate-claude --skills-only
```

**What it validates:**

**Agents (.claude/agents/):**

- YAML frontmatter syntax
- Required fields: name, description, tools, model, color, skills
- Field order (exact sequence required)
- Valid tool names (Read, Write, Edit, Glob, Grep, Bash, TodoWrite, WebFetch, WebSearch)
- Valid model names (empty, sonnet, opus, haiku)
- Valid colors (blue, green, yellow, purple)
- Filename matches name field
- Agent name uniqueness
- Skills references exist
- No YAML comments
- Special rules (e.g., generated-reports/ tools)

**Skills (.claude/skills/):**

- SKILL.md file exists
- Required fields: name, description (name must match directory name)
- YAML syntax validity

**Flags:**

- `--agents-only` - Validate only agents (skip skills)
- `--skills-only` - Validate only skills (skip agents)
- `-o, --output` - Format: text, json, markdown
- `-v, --verbose` - Show all checks
- `-q, --quiet` - Summary only

**Exit codes:**

- `0` - All valid
- `1` - One or more invalid

**Example output (text):**

```
Validation Complete
==================================================

Total Checks: 513
Passed: 513
Failed: 0
Duration: 49ms

Status: ✓ VALIDATION PASSED
```

### governance vendor-audit

Scan all `.md` files under a path for forbidden vendor-specific terms in prose.

```bash
# Audit governance/ (default path)
rhino-cli governance vendor-audit

# Audit a specific path
rhino-cli governance vendor-audit governance/

# Output as JSON
rhino-cli governance vendor-audit -o json

# Via Nx (cached)
npx nx run rhino-cli:validate:governance-vendor-audit
```

**What it detects:**

Forbidden vendor terms in prose that violate the
[governance-vendor-independence convention](../../governance/conventions/structure/governance-vendor-independence.md):

| Forbidden term | Suggested replacement         |
| -------------- | ----------------------------- |
| `Claude Code`  | "the coding agent"            |
| `OpenCode`     | "the secondary coding agent"  |
| `Anthropic`    | neutral description or remove |
| `Sonnet`       | "execution-grade model tier"  |
| `Opus`         | "planning-grade model tier"   |
| `Haiku`        | "fast model tier"             |
| `.claude/`     | "primary binding directory"   |
| `.opencode/`   | "secondary binding directory" |

**Exempted regions (not scanned):**

- Code fences (any language tag, including `binding-example`)
- Sections under "Platform Binding Examples" headings
- Inline code spans (backtick-delimited)
- Link URL portions
- HTML comments (single-line and multi-line)
- YAML frontmatter
- The convention file itself (`governance-vendor-independence.md`)

**Exit codes:**

- `0` - No violations found
- `1` - One or more violations found

**Example output (violation):**

```
GOVERNANCE VENDOR AUDIT FAILED: 1 violation(s) found
  governance/README.md:31  .claude/  →  "primary binding directory"
```

**Example output (clean):**

```
GOVERNANCE VENDOR AUDIT PASSED: no violations found
```

### test-coverage merge

Merge multiple coverage files from different formats into a single LCOV output.

```bash
# Merge two LCOV files
rhino-cli test-coverage merge cov1.info cov2.info --out-file merged.info

# Merge and validate threshold
rhino-cli test-coverage merge unit.info integration.info --out-file merged.info --validate 90

# Merge with file exclusion
rhino-cli test-coverage merge coverage.info --exclude "generated/*" --out-file merged.info
```

**Flags:**

- `--out-file <path>` - Output file path (LCOV format)
- `--validate <threshold>` - Validate merged coverage against threshold
- `--exclude <glob>` - Exclude files matching glob pattern (repeatable)

### test-coverage diff

Calculate coverage for only the lines changed in the current branch.

```bash
# Diff coverage against main
rhino-cli test-coverage diff apps/myapp/coverage/lcov.info

# Diff against specific branch with threshold
rhino-cli test-coverage diff apps/myapp/coverage/lcov.info --base develop --threshold 80

# Diff staged changes with per-file breakdown
rhino-cli test-coverage diff apps/myapp/coverage/lcov.info --staged --per-file
```

**Flags:**

- `--base <ref>` - Git ref to diff against (default: main)
- `--threshold <pct>` - Fail if diff coverage below threshold
- `--staged` - Diff staged changes instead of branch diff
- `--per-file` - Show per-file diff coverage breakdown
- `--exclude <glob>` - Exclude files matching glob pattern (repeatable)

### spec-coverage validate

Validate that all BDD feature spec files have matching test implementations. Designed to enforce
the spec-to-test direction for test suites that use explicit file loading (e.g. vitest-cucumber).

```bash
# Check organiclever-web spec coverage
rhino-cli spec-coverage validate specs/apps/organiclever-web apps/organiclever-web

# Output as JSON
rhino-cli spec-coverage validate specs/apps/organiclever-web apps/organiclever-web -o json

# Output as markdown
rhino-cli spec-coverage validate specs/apps/organiclever-web apps/organiclever-web -o markdown

# Quiet mode
rhino-cli spec-coverage validate specs/apps/organiclever-web apps/organiclever-web -q

# Shared steps mode (for E2E projects with shared step files)
rhino-cli spec-coverage validate specs/apps/organiclever/be/gherkin apps/organiclever-be-e2e --shared-steps
```

**What it does:**

- Walks `<specs-dir>` recursively for `.feature` files
- For each spec, checks if any file under `<app-dir>` has a base name starting with
  `{stem}.` (e.g. `user-login.feature` → matches `user-login.integration.test.tsx`)
- Reports each uncovered spec with a hint for the expected test file stem
- For matched specs, checks **scenario-level** coverage:
  - TypeScript/JavaScript files: every `Scenario:` title must appear as `Scenario("title", ...)` in
    the matching test file
  - Go files: every `Scenario:` title must appear as a `// Scenario: title` comment in the matching
    `_test.go` file
- For matched specs, checks **step-level** coverage: every step line (`Given/When/Then/And/But`)
  must appear as a step definition anywhere in the app's source files —
  - TypeScript/JavaScript (`.ts`, `.tsx`, `.js`, `.jsx`): `Given("step text", fn)` exact-match
  - Go (`.go`): `sc.Step(\`^regex pattern$\`, fn)` compiled as regex
- Both paths are resolved relative to the git repository root

**Why this command exists:**

Three test suites consume the `specs/` directory:

- **playwright-bdd** (E2E): auto-discovers all `.feature` files via glob → already enforced
- **Cucumber JVM** (Spring Boot): auto-discovers via classpath → already enforced
- **vitest-cucumber** (Next.js): uses explicit `loadFeature()` per file → **gap**: a new
  `.feature` in `specs/` is silently ignored unless a matching integration test is created

This command closes that gap for any app using explicit feature loading.

**Arguments:**

- `<specs-dir>` - Path to specs folder (relative to repo root, e.g. `specs/apps/organiclever-web`)
- `<app-dir>` - Path to app folder (relative to repo root, e.g. `apps/organiclever-web`)

**Flags:**

- `-o, --output` - Output format: text, json, markdown (default: text)
- `-v, --verbose` - Verbose output with timestamps
- `-q, --quiet` - Quiet mode (success is silent, only errors shown)

**Exit codes:**

- `0` - All specs have matching test files
- `1` - One or more specs lack matching test files

**Example output (success):**

```
✓ Spec coverage valid! 9 specs, 47 scenarios, 203 steps — all covered.
```

**Example output (failure):**

```
✗ Spec coverage gaps found!

Missing test files (1):
  - specs/apps/organiclever-web/auth/new-feature.feature
    (expected test file with stem: new-feature)

Missing scenarios (1):
  - specs/apps/organiclever-web/auth/user-login.feature
    → Scenario: "Login with SSO"

Missing steps (2):
  - specs/apps/organiclever-web/members/member-list.feature
    → Scenario: "Export member list"
      · Given the member list has been loaded
      · When the user clicks "Export CSV"
```

**Example output (JSON):**

```json
{
  "status": "success",
  "timestamp": "2026-03-04T10:00:00+07:00",
  "total_specs": 9,
  "total_scenarios": 47,
  "total_steps": 203,
  "gap_count": 0,
  "scenario_gap_count": 0,
  "step_gap_count": 0,
  "duration_ms": 12,
  "gaps": [],
  "scenario_gaps": [],
  "step_gaps": []
}
```

### doctor

Check that all required development tools are installed with the correct versions.
Reads version requirements from existing repository config files so it stays in sync automatically.

```bash
# Runs automatically after every npm install (postinstall hook)
npm install

# Or run manually from repo root
npm run doctor

# Or directly after building
rhino-cli doctor

# Output as JSON
rhino-cli doctor -o json

# Output as markdown report
rhino-cli doctor -o markdown

# Verbose output (includes duration)
rhino-cli doctor --verbose

# Quiet mode (suppresses header)
rhino-cli doctor --quiet
```

**What it does:**

- Checks 7 development tools: git, volta, node, npm, java, maven, golang
- Reads required versions dynamically from existing config files
- Reports each tool as: ✓ ok, ⚠ warning (wrong version), or ✗ missing (not in PATH)
- Only exits non-zero when a tool is missing; version warnings are advisory
- Supports multiple output formats (text, json, markdown)

**Tools checked:**

| Tool   | Binary  | Required Version Source                  | Comparison |
| ------ | ------- | ---------------------------------------- | ---------- |
| git    | `git`   | (no config file — any version OK)        | any        |
| volta  | `volta` | (no config file — any version OK)        | any        |
| node   | `node`  | `package.json` → `volta.node`            | exact      |
| npm    | `npm`   | `package.json` → `volta.npm`             | exact      |
| maven  | `mvn`   | (no config file — any version OK)        | any        |
| golang | `go`    | `apps/rhino-cli/go.mod` → `go` directive | ≥ (GTE)    |

**Flags:**

- `-o, --output` - Output format: text, json, markdown (default: text)
- `-v, --verbose` - Show duration after summary
- `-q, --quiet` - Suppress the "Doctor Report" header

**Exit codes:**

- `0` - All tools found (warnings about wrong versions are advisory, not failures)
- `1` - One or more tools not found in PATH

**Example output (text):**

```
Doctor Report
=============

✓ git        v2.47.2        (no version requirement)
✓ volta      v2.0.2         (no version requirement)
✓ node       v24.13.1       (required: 24.13.1)
✓ npm        v11.10.1        (required: 11.10.1)
✓ java       v25            (required: 25)
✓ maven      v3.9.9         (no version requirement)
✗ golang     not found      (required: ≥1.24.2)

Summary: 6/7 tools OK, 0 warning, 1 missing
```

**Example output (JSON):**

```json
{
  "status": "missing",
  "timestamp": "2026-02-19T10:00:00+07:00",
  "ok_count": 5,
  "warn_count": 0,
  "missing_count": 1,
  "duration_ms": 312,
  "tools": [
    {
      "name": "volta",
      "binary": "volta",
      "status": "ok",
      "installed_version": "2.0.2",
      "source": "(no config file)",
      "note": "no version requirement"
    }
  ]
}
```

### env backup

Back up all `.env*` files from the repository to an external directory, preserving the relative
directory structure. Auto-generated directories (node_modules, dist, build, .next, etc.) are
skipped. Symlinks and files larger than 1 MB are skipped with a warning.

If destination files already exist, the user is prompted for confirmation before overwriting.
Use `--force` to skip the prompt. JSON and markdown output modes imply `--force`.

Use `--include-config` to also back up known uncommitted local configuration files (AI tool
settings, Docker overrides, version managers, direnv).

```bash
# Back up to default directory ~/ose-open-env-backup
rhino-cli env backup

# Back up to a custom directory
rhino-cli env backup --dir /tmp/my-env-backup

# Namespace backup by worktree/repo name
rhino-cli env backup --worktree-aware

# Skip overwrite confirmation
rhino-cli env backup --force

# Include uncommitted config files
rhino-cli env backup --include-config

# JSON output (implies --force)
rhino-cli env backup -o json
```

**Flags:**

- `--dir <path>` - Backup directory (default: `~/ose-open-env-backup`)
- `--worktree-aware` - Namespace backup by worktree/repo directory name
- `--force` / `-f` - Skip overwrite confirmation prompt
- `--include-config` - Also back up known uncommitted config files

**Config file patterns** (backed up with `--include-config`):

| Category         | File                                                                                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI Tools         | `.claude/settings.local.json`, `.claude/settings.local.json.bkup`, `.cursor/mcp.json`, `.windsurfrules`, `.clinerules`, `.aider.conf.yml`, `.aiderignore`, `.continue/config.json`, `.gemini/settings.json`, `.amazonq/mcp.json`, `.roomodes` |
| Docker           | `docker-compose.override.yml`                                                                                                                                                                                                                 |
| Version Managers | `mise.local.toml`                                                                                                                                                                                                                             |
| Environment      | `.envrc`                                                                                                                                                                                                                                      |

### env restore

Restore previously backed-up `.env*` files from the backup directory back to their original
repository paths. Only files whose basename starts with `.env` are restored.

If destination files already exist, the user is prompted for confirmation before overwriting.
Use `--force` to skip the prompt. JSON and markdown output modes imply `--force`.

Use `--include-config` to also restore known uncommitted local configuration files.

```bash
# Restore from default directory ~/ose-open-env-backup
rhino-cli env restore

# Restore from a custom directory
rhino-cli env restore --dir /tmp/my-env-backup

# Restore from worktree-namespaced backup
rhino-cli env restore --worktree-aware

# Skip overwrite confirmation
rhino-cli env restore --force

# Include config files
rhino-cli env restore --include-config

# JSON output (implies --force)
rhino-cli env restore -o json
```

**Flags:**

- `--dir <path>` - Backup source directory (default: `~/ose-open-env-backup`)
- `--worktree-aware` - Read from worktree-namespaced backup
- `--force` / `-f` - Skip overwrite confirmation prompt
- `--include-config` - Also restore known uncommitted config files

### DDD enforcement

`rhino-cli` provides two subcommands to enforce Domain-Driven Design conventions in `organiclever-web`. Both run automatically as part of `nx run organiclever-web:test:quick`.

#### `bc validate`

Validates bounded-context structural parity between `apps/organiclever-web/src/contexts/` and the registry.

```bash
rhino-cli bc validate organiclever
```

Checks for each registered context: code directory with declared layer subfolders, glossary file, Gherkin directory. Detects orphan directories and asymmetric relationships.

#### `ul validate`

Validates ubiquitous-language glossary parity between `specs/apps/organiclever/ubiquitous-language/` and the codebase.

```bash
rhino-cli ul validate organiclever
```

Checks: frontmatter presence, terms table structure, stale code identifiers (via ripgrep), missing feature references, cross-context term collisions, forbidden-synonym misuse.

**Severity**: both default to `error`. Override locally: `ORGANICLEVER_RHINO_DDD_SEVERITY=warn`.

**See**: [`apps-organiclever-web-developing-content` skill](../../.claude/skills/apps-organiclever-web-developing-content/SKILL.md) § Domain-Driven Design for authoring rules and the BC registry at [`specs/apps/organiclever/bounded-contexts.yaml`](../../specs/apps/organiclever/bounded-contexts.yaml).

## Help Commands

```bash
# General help
rhino-cli --help
rhino-cli help

# Command-specific help
rhino-cli docs validate-links --help

# Version
rhino-cli --version
```

## Architecture

```
apps/rhino-cli/
├── cmd/
│   ├── root.go                                   # Cobra root command, global flags
│   ├── root_test.go                              # Unit tests for root command
│   ├── helpers.go / _test.go                     # Shared cmd helpers
│   ├── doctor.go / _test.go                          # Doctor command + unit tests
│   ├── doctor.integration_test.go                   # godog BDD tests (4 scenarios)
│   ├── test_coverage_validate.go / _test.go           # Coverage threshold command + unit tests
│   ├── test_coverage_validate.integration_test.go    # godog BDD tests (6 scenarios)
│   ├── docs_validate_links.go / _test.go              # Link validation command + unit tests
│   ├── docs_validate_links.integration_test.go       # godog BDD tests (4 scenarios)
│   ├── agents_sync.go / _test.go                     # Agent/skill sync command + unit tests
│   ├── agents_sync.integration_test.go               # godog BDD tests (4 scenarios)
│   ├── agents_validate_sync.go / _test.go            # Sync validation command + unit tests
│   ├── agents_validate_sync.integration_test.go      # godog BDD tests (3 scenarios)
│   ├── agents_validate_claude.go / _test.go          # Claude Code validation command + unit tests
│   ├── agents_validate_claude.integration_test.go    # godog BDD tests (5 scenarios)
│   ├── spec_coverage_validate.go / _test.go          # BDD spec coverage command + unit tests
│   ├── spec_coverage_validate.integration_test.go    # godog BDD tests (4 scenarios)
│   ├── java_validate_annotations.go / _test.go       # Java annotation validation + unit tests
│   ├── java_validate_annotations.integration_test.go # godog BDD tests (4 scenarios)
│   ├── contracts.go                                    # Parent contracts command
│   ├── contracts_java_clean_imports.go / _test.go     # Java import cleaning + unit tests
│   ├── contracts_java_clean_imports.integration_test.go # godog BDD tests (5 scenarios)
│   ├── contracts_dart_scaffold.go / _test.go          # Dart scaffolding + unit tests
│   └── contracts_dart_scaffold.integration_test.go    # godog BDD tests (3 scenarios)
├── internal/
│   ├── doctor/               # Development environment checks
│   │   ├── types.go          # ToolStatus, ToolCheck, DoctorResult, CommandRunner types
│   │   ├── tools.go          # Tool definitions list — add new tools here
│   │   ├── checker.go        # Config readers, version parsers, comparators, runOneDef, CheckAll
│   │   ├── checker_test.go   # Unit tests for all parsers, comparisons, and checkers
│   │   ├── reporter.go       # Output formatting (text, JSON, markdown)
│   │   ├── reporter_test.go  # Reporter tests
│   │   └── testdata/         # Test fixtures (package.json, pom.xml, go.mod)
│   ├── docs/                 # Documentation link validation logic
│   │   ├── links_types.go    # Core type definitions (links)
│   │   ├── links_scanner.go  # Link extraction from markdown
│   │   ├── links_scanner_test.go
│   │   ├── links_validator.go # Link validation logic
│   │   ├── links_validator_test.go
│   │   ├── links_categorizer.go # Link categorization
│   │   ├── links_categorizer_test.go
│   │   ├── links_reporter.go # Output formatting (links)
│   │   └── links_reporter_test.go
│   ├── speccoverage/         # BDD spec coverage validation
│   │   ├── types.go          # ScanOptions, CoverageGap, ScenarioGap, StepGap, CheckResult
│   │   ├── parser.go         # Gherkin feature file parser (line-by-line, no external dep)
│   │   ├── parser_test.go    # Unit tests for parser
│   │   ├── checker.go        # Walk specs dir, match test files, check scenario/step gaps
│   │   ├── checker_test.go   # Unit tests (temp dir fixtures)
│   │   ├── reporter.go       # Output formatting (text, JSON, markdown)
│   │   └── reporter_test.go  # Reporter unit tests
│   ├── contracts/            # Contract codegen post-processing
│   │   ├── types.go          # Options/Result structs for both commands
│   │   ├── java_clean_imports.go # Java import cleaning (port of AWK script)
│   │   ├── java_clean_imports_test.go
│   │   ├── dart_scaffold.go  # Dart package scaffolding
│   │   ├── dart_scaffold_test.go
│   │   ├── reporter.go       # Output formatting (text, JSON, markdown)
│   │   └── reporter_test.go
│   ├── java/                 # Java null-safety annotation validation
│   │   ├── types.go          # PackageEntry, ValidationResult, ValidationOptions
│   │   ├── scanner.go        # Walk source tree, find Java package directories
│   │   ├── scanner_test.go
│   │   ├── validator.go      # Check package-info.java and annotation presence
│   │   ├── validator_test.go
│   │   ├── reporter.go       # Output formatting (text, JSON, markdown)
│   │   └── reporter_test.go
│   ├── testcoverage/             # Test coverage measurement (Go cover.out + LCOV)
│   │   ├── types.go          # Format, Result types
│   │   ├── detect.go         # Auto-detect format from filename/content
│   │   ├── go_coverage.go    # Go cover.out parser + standard line-based algorithm
│   │   ├── go_coverage_test.go
│   │   ├── lcov_coverage.go  # LCOV parser + standard line-based algorithm
│   │   ├── lcov_coverage_test.go
│   │   ├── reporter.go       # Output formatting (text, JSON, markdown)
│   │   └── reporter_test.go
│   └── agents/               # Agent configuration management (.claude/ ↔ .opencode/)
│       ├── types.go          # All data structures (merged from former sync/ and claude/ packages)
│       ├── types_test.go
│       ├── sync.go           # Sync orchestration
│       ├── sync_test.go
│       ├── converter.go      # Claude → OpenCode conversion
│       ├── converter_test.go
│       ├── copier.go         # Skills copying
│       ├── copier_test.go
│       ├── sync_validator.go      # Sync equivalence validation (.claude/ vs .opencode/)
│       ├── sync_validator_test.go
│       ├── reporter.go            # Output formatting (text, JSON, markdown)
│       ├── reporter_test.go
│       ├── claude_validator.go    # .claude/ format validation orchestration
│       ├── claude_validator_test.go
│       ├── agent_validator.go     # Agent validation rules (11 rules)
│       ├── agent_validator_test.go
│       ├── skill_validator.go     # Skill validation rules (7 rules)
│       ├── skill_validator_test.go
│       └── yaml_formatting.go     # YAML formatting validation helper
├── dist/                     # Built binary (gitignored)
├── main.go                   # CLI entry point
├── go.mod                    # Go module definition (includes gopkg.in/yaml.v3)
├── go.sum                    # Go module checksums
├── project.json              # Nx project configuration
└── README.md                 # Documentation
```

## Development

### Build

```bash
go build -o dist/rhino-cli
```

### Test

```bash
# Run unit tests with coverage (via Nx)
nx run rhino-cli:test:quick

# Run all godog BDD integration tests (via Nx, cached)
nx run rhino-cli:test:integration

# Run a single integration suite during development
go test -v -tags=integration -run TestIntegrationDoctor ./cmd/...

# Run unit tests directly
go test ./...
```

**Test Coverage:**

- `cmd`: Root command tests, docs validate-links integration tests, doctor integration tests
- `internal/doctor`: 95%+ coverage (checker, reporter — all pure functions tested with fake runner)
- `internal/docs`: 90%+ coverage (links: links_scanner, links_validator, links_categorizer, links_reporter)
- `internal/agents`: 95%+ coverage (converter, copier, sync_validator, reporter, claude_validator, agent_validator, skill_validator)
- `internal/speccoverage`: ≥95% coverage (parser, checker with temp dir fixtures, reporter for all formats)
- `internal/testcoverage`: ≥95% coverage (detect, go_coverage, lcov_coverage, reporter — all pure functions with temp dir fixtures)

### Lint

```bash
# Run directly
golangci-lint run ./...

# Run via Nx
nx lint rhino-cli
```

Linting uses the shared configuration at `.golangci.yml` in the repository root. golangci-lint discovers it automatically by walking up parent directories from the app's working directory.

### Run without building

```bash
go run main.go say "hello"
```

## Nx Integration

The CLI is integrated into the Nx workspace:

```bash
# Build via Nx
nx build rhino-cli

# Run fast quality gate via Nx
nx run rhino-cli:test:quick

# Run via Nx
nx run rhino-cli

# Install dependencies via Nx
nx install rhino-cli
```

**Available Nx Targets:**

- `build` - Build the CLI binary to `dist/`
- `test:quick` - Run unit tests with ≥95% coverage enforcement
- `test:integration` - Run all 47 godog BDD scenarios (cached; only re-runs when sources or specs change)
- `lint` - Static analysis via golangci-lint
- `run` - Run the CLI directly (`go run main.go`)
- `install` - Install Go dependencies (`go mod tidy`)

## Testing

The project uses two complementary test tiers. Both consume the same Gherkin specs from
`specs/apps/rhino/` via [godog](https://github.com/cucumber/godog) — only the step
implementations differ:

| Level       | Test File Pattern                           | Step Implementation                             | Nx Target          |
| ----------- | ------------------------------------------- | ----------------------------------------------- | ------------------ |
| Unit        | `cmd/{domain}_{action}_test.go`             | Mocked I/O via package-level function variables | `test:unit`        |
| Integration | `cmd/{domain}_{action}.integration_test.go` | Real filesystem via `/tmp` fixtures             | `test:integration` |

- **Unit tests** (no build tag, runs in `test:quick`): godog BDD scenarios with all I/O mocked
  via package-level function variables. Also includes pure function tests for logic not covered by
  Gherkin scenarios. Run via `nx run rhino-cli:test:quick` with ≥95% line coverage enforcement.
- **Integration tests** (`//go:build integration`): godog BDD tests that drive each command
  in-process via `cmd.RunE()` against controlled `/tmp` filesystem fixtures. 47 scenarios total
  across 11 suites. Run via `nx run rhino-cli:test:integration` (cached).

Both tiers are co-located in `cmd/` (not a separate folder): they are in `package cmd` to access
unexported flag variables (`output`, `quiet`, `verbose`) that each command sets before calling
`RunE()`. Exporting those variables or switching to subprocess testing would add unnecessary
complexity.

### Test Suite

**Doctor Tests (`cmd/doctor_test.go`, `internal/doctor/`):**

- Command initialization (Use, Short)
- Text output contains "Doctor Report" and all 6 tool names
- JSON output is valid with correct structure and "tools" array
- Markdown output contains `| Tool |` table
- Missing git root returns error mentioning "git"
- All version parsers (Java, Maven, Go) with multiple real-world patterns
- All comparison helpers (exact, major) with match/mismatch/empty cases
- All 6 individual checkers with fake runner (found/mismatch/missing)
- `CheckAll` orchestration with all-OK and all-missing runner
- Config file readers (package.json, pom.xml, go.mod) with valid/invalid/missing inputs

**Root Command Tests (`cmd/root_test.go`):**

- Command initialization
- Global flags parsing (--verbose, --quiet, --output, --no-color, --say)
- Version output
- Say flag functionality (basic output, multiple words, empty message)
- Say flag with verbose mode (timestamps)
- Say flag with quiet mode
- Say flag with combined flags
- Say flag special characters handling
- Say flag long message handling

### Running Tests

```bash
# Run all tests
go test ./... -v

# Run tests with coverage
go test ./... -coverprofile=coverage.out

# View coverage report
go tool cover -html=coverage.out
```

## Say Flag Behavior

**Basic usage:**

```bash
rhino-cli --say "hello world"
# Output: hello world
```

**With verbose flag:**

```bash
rhino-cli --say "hello" --verbose
# Output: [2026-01-05 14:30:00] INFO: Executing say command
#         [2026-01-05 14:30:00] INFO: Message: hello
#         hello
```

**With quiet flag:**

```bash
rhino-cli --say "hello" --quiet
# Output: hello
```

**With verbose flag:**

```bash
rhino-cli say "hello" --verbose
# Output: [2025-01-05 12:00:00] INFO: Executing say command
#         [2025-01-05 12:00:00] INFO: Message: hello
#         hello
```

**With quiet flag:**

```bash
rhino-cli say "hello" --quiet
# Output: hello
```

**Error case:**

```bash
rhino-cli say
# Output: Error: requires at least 1 arg(s), only received 0
```

## Version History

### v0.14.0 (2026-03-31)

- Added `env backup` command: recursively finds and backs up all `.env*` files to an external
  directory, preserving relative paths. Skips auto-generated dirs, symlinks, and oversized files
- Added `env restore` command: restores previously backed-up `.env*` files to their original
  repository paths
- Both commands support `--dir` (custom backup location), `--worktree-aware` (namespace backup by
  worktree/repo name), and all output formats (text, JSON, markdown)
- New `internal/envbackup` package with complete test suite
- 18 godog BDD scenarios (11 backup + 7 restore) at both unit and integration levels

### v0.12.0 (2026-03-19)

- Added `contracts java-clean-imports` command: removes unused, same-package, and duplicate imports
  from generated Java files (replaces `scripts/clean-generated-java-imports.sh`)
- Added `contracts dart-scaffold` command: creates pubspec.yaml and barrel library for generated Dart
  contracts (replaces `apps/a-demo-fe-dart-flutterweb/scripts/post-codegen.sh`)
- Updated `a-demo-be-java-springboot`, `a-demo-be-java-vertx`, and `a-demo-fe-dart-flutterweb` codegen
  targets to use rhino-cli instead of shell scripts
- 8 new godog BDD scenarios (5 Java import cleaning + 3 Dart scaffolding)
- Deleted `scripts/` directory and `apps/a-demo-fe-dart-flutterweb/scripts/` directory

### v0.11.0 (2026-03-05)

- Added godog BDD integration tests for all 9 rhino-cli commands (39 scenarios)
- Each command has a `{stem}.integration_test.go` file in `cmd/` with `//go:build integration`
- In-process `cmd.RunE()` execution pattern — no binary build required; contributes to coverage
- `spec-coverage validate` extended: recognizes Go test files via `_test.go`-only matching,
  `// Scenario:` comments for scenario titles, and `sc.Step(\`regex\`)` for step coverage
- `test:integration` Nx target added to `project.json` with caching (inputs: cmd/\*_/_.go + specs)
- Fixed `findMatchingTestFile` to exclude Go implementation files (e.g., `doctor.go`) so only
  `_test.go` files are considered test file matches for a given spec stem

### v0.10.0 (2026-03-05)

- Added `test-coverage validate` command for standard line-based coverage enforcement
- Supports Go `cover.out` and LCOV formats with auto-detection from filename
- Implements standard line-based coverage algorithm (covered/partial/missed classification)
- Go-specific line filtering: excludes blank, comment-only, and brace-only lines
- Three output formats: text, JSON, markdown
- Replaces `scripts/validate-test-coverage.py`, eliminating the Python dependency
- Integrated into `test:quick` targets for all Go projects and `organiclever-web`

### v0.9.0 (2026-03-05)

- Absorbed `javaproject-cli` as `java validate-annotations` subcommand
- Validates Java packages have required null-safety annotation in `package-info.java`
- Supports text, JSON, and markdown output formats; `--annotation` flag for custom annotations
- Integrates into `a-demo-be-java-springboot` `typecheck` target (replaces standalone `javaproject-cli`)
- `javaproject-cli` standalone project removed from workspace

### v0.8.0 (2026-03-04)

- Extended `spec-coverage validate` with scenario-level and step-level coverage checking
- Every `Scenario:` title in a feature file must appear as `Scenario("title", ...)` in the
  matching test file — missing scenarios are reported as `ScenarioGap`
- Every step line must appear as a step definition anywhere in the app's TS/JS files
  (including shared `defineSteps()` helpers) — missing steps are reported as `StepGap`
- New Gherkin parser (`parser.go`) — line-by-line, no external dependencies
- Updated text/JSON/markdown output with scenario and step counts
- JSON output extended: `total_scenarios`, `total_steps`, `scenario_gap_count`, `step_gap_count`,
  `scenario_gaps`, `step_gaps`
- Version bump: `0.7.0` → `0.8.0`

### v0.7.0 (2026-03-04)

- Added `spec-coverage validate` command for BDD spec-to-test coverage validation
- Walks any `<specs-dir>` for `.feature` files and checks for matching test files under `<app-dir>`
- Closes the vitest-cucumber gap: new specs silently ignored unless matched by an integration test
- Integrated into `organiclever-web` `test:quick` target
- Three output formats: text, JSON, markdown
- ≥85% test coverage with temp dir fixtures

### v0.5.0 (2026-02-19)

- Added `doctor` command for development environment verification
- Checks 6 tools: volta, node, npm, java, maven, golang
- Reads required versions from package.json, pom.xml, and go.mod dynamically
- Injectable `CommandRunner` for hermetic unit testing (no subprocess spawning)
- Three output formats: text, JSON, markdown
- Distinguishes missing tools (exit 1) from version warnings (advisory only)
- 95%+ test coverage with 55+ tests across checker and reporter packages

### v0.4.0 (2026-01-22)

- Added `agents validate-claude` command for Claude Code format validation
- YAML frontmatter validation (11 rules for agents, 3 for skills)
- Integrated into pre-commit git hook with work avoidance
- Performance: ~49ms for 45 agents + 21 skills (meets <50ms target)
- Auto-sync .claude/ to .opencode/ on pre-commit
- Comprehensive test suite with 92.6% coverage

### v0.3.0 (2026-01-22)

- Added `agents sync` command for syncing Claude Code → OpenCode formats
- Added `agents validate-sync` command for validating semantic equivalence
- YAML frontmatter conversion (tools, model mapping, normalization)
- 25-60x performance improvement over bash scripts (121ms vs 3-5s)
- Comprehensive test suite (85%+ coverage for sync logic)
- Replaces `scripts/sync-claude-to-opencode.sh` and `scripts/validate-sync.sh`
- Added dependency: gopkg.in/yaml.v3

### v0.2.0 (2026-01-21)

- Added `docs validate-links` command for markdown link validation
- Ported from Python to Go for better performance and maintainability
- Comprehensive test suite (85%+ coverage for link validation)
- Multiple output formats (text, JSON, markdown)
- Staged-only mode for git hooks
- Replaces `scripts/validate-docs-links.py`

### v0.1.0 (2026-01-05)

- Initial release
- `--say` global flag for echoing messages
- Global flags: --verbose, --quiet, --output, --no-color
- Nx integration
- Comprehensive unit tests (100% coverage)

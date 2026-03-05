# rhino-cli

**RHINO** – Repository Hygiene & INtegration Orchestrator

Command-line tools for repository management and automation.

## What is rhino-cli?

A Go-based CLI tool that provides utilities for repository management and automation tasks. Built with Cobra CLI framework for powerful command-line interfaces.

## Quick Start

```bash
# Check test coverage against a threshold (Codecov-compatible algorithm)
rhino-cli validate-test-coverage apps/rhino-cli/cover.out 85

# Check all required development tools are installed
rhino-cli doctor

# Validate Claude Code format
rhino-cli validate-claude

# Sync Claude Code → OpenCode configurations
rhino-cli sync-agents

# Validate sync is correct
rhino-cli validate-sync

# Validate markdown links in the repository
rhino-cli validate-docs-links

# Validate only staged files (useful in git hooks)
rhino-cli validate-docs-links --staged-only

# Validate BDD spec coverage (all specs have matching test files)
rhino-cli validate-spec-coverage specs/organiclever-web apps/organiclever-web

# Validate Java packages have @NullMarked in package-info.java
rhino-cli validate-java-annotations apps/organiclever-be/src/main/java

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

### validate-test-coverage

Check test coverage against a minimum threshold using Codecov's exact line coverage algorithm.
Supports both Go `cover.out` and LCOV formats; auto-detects from filename.

```bash
# Check Go cover.out (path relative to git root)
rhino-cli validate-test-coverage apps/rhino-cli/cover.out 85

# Check LCOV coverage from Vitest
rhino-cli validate-test-coverage apps/organiclever-web/coverage/lcov.info 85

# Output as JSON
rhino-cli validate-test-coverage apps/rhino-cli/cover.out 85 -o json

# Output as markdown
rhino-cli validate-test-coverage apps/rhino-cli/cover.out 85 -o markdown

# Quiet mode
rhino-cli validate-test-coverage apps/rhino-cli/cover.out 85 -q
```

**What it does:**

- Auto-detects format: `.info` or filename containing `lcov` → LCOV; otherwise → Go cover.out
- Implements Codecov's line coverage algorithm exactly:
  - **Covered**: hit count > 0 AND all branches taken (or no branches)
  - **Partial**: hit count > 0 but some branches not taken
  - **Missed**: hit count = 0
  - Coverage % = covered / (covered + partial + missed)
  - Partial lines count as NOT covered (matching Codecov's badge calculation)
- Go-specific filtering (matching Codecov's file fixes): excludes blank lines, comment-only
  lines (`//`), and brace-only lines (`{` or `}`)
- Supports multiple output formats (text, JSON, markdown)

**Arguments:**

- `<coverage-file>` - Path to coverage file relative to git root (e.g. `apps/rhino-cli/cover.out`)
- `<threshold>` - Minimum coverage percentage (e.g. `85`)

**Flags:**

- `-o, --output` - Output format: text, json, markdown (default: text)
- `-v, --verbose` - Verbose output with timestamps
- `-q, --quiet` - Quiet mode (errors only)

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
  "status": "pass",
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

### validate-docs-links

Validate markdown links in the repository. Scans markdown files for broken internal links and generates a categorized report.

```bash
# Validate all markdown files
rhino-cli validate-docs-links

# Validate only staged files (useful in pre-commit hooks)
rhino-cli validate-docs-links --staged-only

# Output as JSON
rhino-cli validate-docs-links -o json

# Output as markdown report
rhino-cli validate-docs-links -o markdown

# Verbose mode
rhino-cli validate-docs-links -v

# Quiet mode (errors only)
rhino-cli validate-docs-links -q
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

1. **Old ex-ru-\* prefixes** - Links containing `ex-ru-` or `ex__ru__`
2. **Missing files** - Common files like CODE_OF_CONDUCT.md, CHANGELOG.md
3. **General/other paths** - All other broken links
4. **workflows/ paths** - Links to workflows/ (not governance/workflows/)
5. **vision/ paths** - Links to vision/ (not governance/vision/)
6. **conventions README** - Links to conventions/README.md

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

### sync-agents

Sync Claude Code agents and skills to OpenCode format. Converts `.claude/` configuration to `.opencode/` format with proper YAML frontmatter transformation.

```bash
# Sync all agents and skills
rhino-cli sync-agents

# Preview changes without modifying files
rhino-cli sync-agents --dry-run

# Sync only agents (skip skills)
rhino-cli sync-agents --agents-only

# Sync only skills (skip agents)
rhino-cli sync-agents --skills-only

# Output as JSON
rhino-cli sync-agents -o json

# Verbose mode
rhino-cli sync-agents -v
```

**What it does:**

**Agents (`.claude/agents/` → `.opencode/agent/`):**

- Converts tools array to boolean map (`Read, Write` → `read: true, write: true`)
- Maps models (`sonnet`/`opus` → `zai/glm-4.7`, `haiku` → `zai/glm-4.5-air`, empty → `inherit`)
- Removes Claude-specific fields (`name`, `color`)
- Preserves description, skills, and body content
- Normalizes YAML formatting (adds spaces after colons)

**Skills (`.claude/skills/` → `.opencode/skill/`):**

- Direct byte-for-byte copy (formats are identical)
- Converts `SKILL.md` → `{skill-name}.md`

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

### validate-sync

Validate that `.claude/` and `.opencode/` configurations are semantically equivalent.

```bash
# Validate sync
rhino-cli validate-sync

# Output as JSON
rhino-cli validate-sync -o json

# Verbose mode (show all checks)
rhino-cli validate-sync -v

# Quiet mode (show only summary)
rhino-cli validate-sync -q
```

**What it does:**

**Agent Validation:**

- Count check: Ensures equal number of agents in both directories
- Equivalence check for each agent:
  - Description matches exactly
  - Model correctly converted (empty/sonnet/opus → inherit/zai/glm-4.7)
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

### validate-claude

Validate Claude Code agent and skill format in `.claude/` directory.

```bash
# Validate all agents and skills
rhino-cli validate-claude

# Output as JSON
rhino-cli validate-claude -o json

# Verbose mode (show all checks)
rhino-cli validate-claude -v

# Validate only agents
rhino-cli validate-claude --agents-only

# Validate only skills
rhino-cli validate-claude --skills-only
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
- Required field: description
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

### validate-spec-coverage

Validate that all BDD feature spec files have matching test implementations. Designed to enforce
the spec-to-test direction for test suites that use explicit file loading (e.g. vitest-cucumber).

```bash
# Check organiclever-web spec coverage
rhino-cli validate-spec-coverage specs/organiclever-web apps/organiclever-web

# Output as JSON
rhino-cli validate-spec-coverage specs/organiclever-web apps/organiclever-web -o json

# Output as markdown
rhino-cli validate-spec-coverage specs/organiclever-web apps/organiclever-web -o markdown

# Quiet mode
rhino-cli validate-spec-coverage specs/organiclever-web apps/organiclever-web -q
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

- `<specs-dir>` - Path to specs folder (relative to repo root, e.g. `specs/organiclever-web`)
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
  - specs/organiclever-web/auth/new-feature.feature
    (expected test file with stem: new-feature)

Missing scenarios (1):
  - specs/organiclever-web/auth/user-login.feature
    → Scenario: "Login with SSO"

Missing steps (2):
  - specs/organiclever-web/members/member-list.feature
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

### validate-java-annotations

Validate that all Java packages in a source tree have the required null-safety annotation in
`package-info.java`. Used by `organiclever-be`'s `typecheck` target.

```bash
# Validate with default annotation (@NullMarked)
rhino-cli validate-java-annotations apps/organiclever-be/src/main/java

# Use a custom annotation
rhino-cli validate-java-annotations apps/organiclever-be/src/main/java --annotation NonNull

# Output as JSON
rhino-cli validate-java-annotations apps/organiclever-be/src/main/java -o json

# Output as markdown report
rhino-cli validate-java-annotations apps/organiclever-be/src/main/java -o markdown

# Quiet mode (suppress "0 violations found" on success)
rhino-cli validate-java-annotations apps/organiclever-be/src/main/java -q
```

**What it does:**

- Walks the source tree and finds every directory containing at least one `.java` file
- For each package directory checks: (1) `package-info.java` exists, (2) it contains `@<annotation>`
- Reports each violation with the failure reason
- Supports multiple output formats (text, json, markdown)

**Arguments:**

- `<source-root>` - Path to the Java source root (e.g. `apps/organiclever-be/src/main/java`)

**Flags:**

- `--annotation` - Annotation name to require (default: `NullMarked`)
- `-o, --output` - Output format: text, json, markdown (default: text)
- `-v, --verbose` - Verbose output
- `-q, --quiet` - Quiet mode (suppress "0 violations found" on success)

**Exit codes:**

- `0` - All packages valid
- `1` - One or more violations found

**Example output (text):**

```
✓ com/example package-info.java present, @NullMarked found
✗ com/example/service package-info.java missing

1 violation(s) found.
```

**Example output (JSON):**

```json
{
  "status": "failure",
  "timestamp": "2026-03-05T10:00:00+07:00",
  "total_packages": 2,
  "valid_packages": 1,
  "annotation": "NullMarked",
  "violations": [
    {
      "package_dir": "com/example/service",
      "violation_type": "missing_package_info"
    }
  ]
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

| Tool   | Binary  | Required Version Source                           | Comparison |
| ------ | ------- | ------------------------------------------------- | ---------- |
| git    | `git`   | (no config file — any version OK)                 | any        |
| volta  | `volta` | (no config file — any version OK)                 | any        |
| node   | `node`  | `package.json` → `volta.node`                     | exact      |
| npm    | `npm`   | `package.json` → `volta.npm`                      | exact      |
| java   | `java`  | `apps/organiclever-be/pom.xml` → `<java.version>` | major only |
| maven  | `mvn`   | (no config file — any version OK)                 | any        |
| golang | `go`    | `apps/rhino-cli/go.mod` → `go` directive          | ≥ (GTE)    |

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

## Help Commands

```bash
# General help
rhino-cli --help
rhino-cli help

# Command-specific help
rhino-cli validate-docs-links --help

# Version
rhino-cli --version
```

## Architecture

```
apps/rhino-cli/
├── cmd/
│   ├── root.go                                   # Cobra root command, global flags
│   ├── root_test.go                              # Unit tests for root command
│   ├── helpers.go                                # Shared cmd helpers
│   ├── doctor.go / _test.go                      # Doctor command + unit tests
│   ├── doctor.integration_test.go               # godog BDD tests (4 scenarios)
│   ├── validate_test_coverage.go / _test.go       # Coverage threshold command + unit tests
│   ├── validate-test-coverage.integration_test.go # godog BDD tests (6 scenarios)
│   ├── validate_docs_links.go / _test.go              # Link validation command + unit tests
│   ├── validate-docs-links.integration_test.go       # godog BDD tests (4 scenarios)
│   ├── sync_agents.go / _test.go                 # Agent/skill sync command + unit tests
│   ├── sync-agents.integration_test.go          # godog BDD tests (4 scenarios)
│   ├── validate_sync.go / _test.go               # Sync validation command + unit tests
│   ├── validate-sync.integration_test.go        # godog BDD tests (3 scenarios)
│   ├── validate_claude.go / _test.go             # Claude Code validation command + unit tests
│   ├── validate-claude.integration_test.go      # godog BDD tests (5 scenarios)
│   ├── validate_spec_coverage.go / _test.go      # BDD spec coverage command + unit tests
│   ├── validate-spec-coverage.integration_test.go # godog BDD tests (4 scenarios)
│   ├── validate_java_annotations.go / _test.go   # Java annotation validation + unit tests
│   ├── validate-java-annotations.integration_test.go # godog BDD tests (4 scenarios)
│   ├── validate_docs_naming.go / _test.go        # Docs naming validation + unit tests
│   └── validate-docs-naming.integration_test.go # godog BDD tests (5 scenarios)
├── internal/
│   ├── doctor/               # Development environment checks
│   │   ├── types.go          # ToolStatus, ToolCheck, DoctorResult, CommandRunner types
│   │   ├── tools.go          # Tool definitions list — add new tools here
│   │   ├── checker.go        # Config readers, version parsers, comparators, runOneDef, CheckAll
│   │   ├── checker_test.go   # Unit tests for all parsers, comparisons, and checkers
│   │   ├── reporter.go       # Output formatting (text, JSON, markdown)
│   │   ├── reporter_test.go  # Reporter tests
│   │   └── testdata/         # Test fixtures (package.json, pom.xml, go.mod)
│   ├── docs/                 # Documentation validation logic (naming + links)
│   │   ├── types.go          # Core type definitions (naming)
│   │   ├── scanner.go        # File scanning for naming validation
│   │   ├── scanner_test.go
│   │   ├── validator.go      # Naming validation logic
│   │   ├── validator_test.go
│   │   ├── reporter.go       # Output formatting (naming)
│   │   ├── reporter_test.go
│   │   ├── prefix_rules.go   # Prefix rules for naming
│   │   ├── prefix_rules_test.go
│   │   ├── link_updater.go   # Link update logic
│   │   ├── link_updater_test.go
│   │   ├── fixer.go          # Fix orchestration
│   │   ├── fixer_test.go
│   │   ├── links_types.go    # Core type definitions (links)
│   │   ├── links_scanner.go  # Link extraction from markdown
│   │   ├── links_scanner_test.go
│   │   ├── links_validator.go # Link validation logic
│   │   ├── links_validator_test.go
│   │   ├── links_categorizer.go # Link categorization
│   │   ├── links_categorizer_test.go
│   │   ├── links_reporter.go # Output formatting (links)
│   │   ├── links_reporter_test.go
│   │   └── testdata/         # Test fixtures
│   ├── claude/               # Claude Code format validation
│   │   ├── types.go          # Data structures (ClaudeAgentFull, ClaudeSkill, constants)
│   │   ├── validator.go      # Main validation orchestration
│   │   ├── agent_validator.go # Agent validation (11 rules)
│   │   └── skill_validator.go # Skill validation (3 rules)
│   ├── speccoverage/         # BDD spec coverage validation
│   │   ├── types.go          # ScanOptions, CoverageGap, ScenarioGap, StepGap, CheckResult
│   │   ├── parser.go         # Gherkin feature file parser (line-by-line, no external dep)
│   │   ├── parser_test.go    # Unit tests for parser
│   │   ├── checker.go        # Walk specs dir, match test files, check scenario/step gaps
│   │   ├── checker_test.go   # Unit tests (temp dir fixtures)
│   │   ├── reporter.go       # Output formatting (text, JSON, markdown)
│   │   └── reporter_test.go  # Reporter unit tests
│   ├── java/                 # Java null-safety annotation validation
│   │   ├── types.go          # PackageEntry, ValidationResult, ValidationOptions
│   │   ├── scanner.go        # Walk source tree, find Java package directories
│   │   ├── scanner_test.go
│   │   ├── validator.go      # Check package-info.java and annotation presence
│   │   ├── validator_test.go
│   │   ├── reporter.go       # Output formatting (text, JSON, markdown)
│   │   └── reporter_test.go
│   ├── coverage/             # Test coverage measurement (Go cover.out + LCOV)
│   │   ├── types.go          # Format, Result types
│   │   ├── detect.go         # Auto-detect format from filename/content
│   │   ├── go_coverage.go    # Go cover.out parser + Codecov algorithm
│   │   ├── go_coverage_test.go
│   │   ├── lcov_coverage.go  # LCOV parser + Codecov algorithm
│   │   ├── lcov_coverage_test.go
│   │   ├── reporter.go       # Output formatting (text, JSON, markdown)
│   │   └── reporter_test.go
│   └── sync/                 # Agent/skill sync logic
│       ├── types.go          # Data structures (ClaudeAgent, OpenCodeAgent, etc.)
│       ├── types_test.go
│       ├── converter.go      # Claude → OpenCode conversion
│       ├── converter_test.go
│       ├── copier.go         # Skills copying
│       ├── copier_test.go
│       ├── validator.go      # Semantic validation
│       ├── validator_test.go
│       ├── reporter.go       # Output formatting
│       ├── sync.go           # Orchestration
│       └── testdata/         # Test fixtures
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

- `cmd`: Root command tests, validate-docs-links integration tests, doctor integration tests
- `internal/doctor`: 95%+ coverage (checker, reporter — all pure functions tested with fake runner)
- `internal/docs`: 85%+ coverage (naming: scanner, validator, reporter, prefix_rules, fixer; links: links_scanner, links_validator, links_categorizer, links_reporter)
- `internal/sync`: 85%+ coverage (converter, copier, validator, reporter)
- `internal/claude`: 92.6% coverage (validator, agent_validator, skill_validator)
- `internal/speccoverage`: ≥85% coverage (parser, checker with temp dir fixtures, reporter for all formats)
- `internal/java`: ≥85% coverage (scanner, validator, reporter — all pure functions tested with temp dir fixtures)
- `internal/coverage`: ≥85% coverage (detect, go_coverage, lcov_coverage, reporter — all pure functions with temp dir fixtures)

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
- `test:quick` - Run unit tests with ≥85% coverage enforcement
- `test:integration` - Run all 39 godog BDD scenarios (cached; only re-runs when sources or specs change)
- `lint` - Static analysis via golangci-lint
- `run` - Run the CLI directly (`go run main.go`)
- `install` - Install Go dependencies (`go mod tidy`)

## Testing

The project uses two complementary test tiers:

- **Unit tests** (`go test ./...`, no build tag): pure function tests with temp dir fixtures.
  Run via `nx run rhino-cli:test:quick` with ≥85% line coverage enforcement.
- **Integration tests** (`//go:build integration`, `go test -tags=integration -run TestIntegration ./cmd/...`):
  godog BDD tests that drive each command in-process via `cmd.RunE()` against controlled filesystem
  fixtures. One file per command in `apps/rhino-cli/cmd/`, 39 scenarios total across 9 suites.
  Run via `nx run rhino-cli:test:integration` (cached). Integration tests are co-located with the
  implementation in `cmd/` (not a separate folder): they are in `package cmd` to access unexported
  flag variables (`output`, `quiet`, `verbose`) that each command sets before calling `RunE()`.
  Exporting those variables or switching to subprocess testing would add unnecessary complexity.

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

### v0.11.0 (2026-03-05)

- Added godog BDD integration tests for all 9 rhino-cli commands (39 scenarios)
- Each command has a `{stem}.integration_test.go` file in `cmd/` with `//go:build integration`
- In-process `cmd.RunE()` execution pattern — no binary build required; contributes to coverage
- `validate-spec-coverage` extended: recognizes Go test files via `_test.go`-only matching,
  `// Scenario:` comments for scenario titles, and `sc.Step(\`regex\`)` for step coverage
- `test:integration` Nx target added to `project.json` with caching (inputs: cmd/\*_/_.go + specs)
- Fixed `findMatchingTestFile` to exclude Go implementation files (e.g., `doctor.go`) so only
  `_test.go` files are considered test file matches for a given spec stem

### v0.10.0 (2026-03-05)

- Added `validate-test-coverage` command for Codecov-compatible line coverage enforcement
- Supports Go `cover.out` and LCOV formats with auto-detection from filename
- Implements exact Codecov line coverage algorithm (covered/partial/missed classification)
- Go-specific line filtering: excludes blank, comment-only, and brace-only lines
- Three output formats: text, JSON, markdown
- Replaces `scripts/validate-test-coverage.py`, eliminating the Python dependency
- Integrated into `test:quick` targets for all Go projects and `organiclever-web`

### v0.9.0 (2026-03-05)

- Absorbed `javaproject-cli` as `validate-java-annotations` subcommand
- Validates Java packages have required null-safety annotation in `package-info.java`
- Supports text, JSON, and markdown output formats; `--annotation` flag for custom annotations
- Integrates into `organiclever-be` `typecheck` target (replaces standalone `javaproject-cli`)
- `javaproject-cli` standalone project removed from workspace

### v0.8.0 (2026-03-04)

- Extended `validate-spec-coverage` with scenario-level and step-level coverage checking
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

- Added `validate-spec-coverage` command for BDD spec-to-test coverage validation
- Walks any `<specs-dir>` for `.feature` files and checks for matching test files under `<app-dir>`
- Closes the vitest-cucumber gap: new specs silently ignored unless matched by an integration test
- Integrated into `organiclever-web` `test:quick` target
- Three output formats: text, JSON, markdown
- ≥85% test coverage with temp dir fixtures

### v0.6.0

- Added `validate-docs-naming` command for documentation file naming conventions

### v0.5.0 (2026-02-19)

- Added `doctor` command for development environment verification
- Checks 6 tools: volta, node, npm, java, maven, golang
- Reads required versions from package.json, pom.xml, and go.mod dynamically
- Injectable `CommandRunner` for hermetic unit testing (no subprocess spawning)
- Three output formats: text, JSON, markdown
- Distinguishes missing tools (exit 1) from version warnings (advisory only)
- 95%+ test coverage with 55+ tests across checker and reporter packages

### v0.4.0 (2026-01-22)

- Added `validate-claude` command for Claude Code format validation
- YAML frontmatter validation (11 rules for agents, 3 for skills)
- Integrated into pre-commit git hook with work avoidance
- Performance: ~49ms for 45 agents + 21 skills (meets <50ms target)
- Auto-sync .claude/ to .opencode/ on pre-commit
- Comprehensive test suite with 92.6% coverage

### v0.3.0 (2026-01-22)

- Added `sync-agents` command for syncing Claude Code → OpenCode formats
- Added `validate-sync` command for validating semantic equivalence
- YAML frontmatter conversion (tools, model mapping, normalization)
- 25-60x performance improvement over bash scripts (121ms vs 3-5s)
- Comprehensive test suite (85%+ coverage for sync logic)
- Replaces `scripts/sync-claude-to-opencode.sh` and `scripts/validate-sync.sh`
- Added dependency: gopkg.in/yaml.v3

### v0.2.0 (2026-01-21)

- Added `validate-docs-links` command for markdown link validation
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

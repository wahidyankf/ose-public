---
title: "Repository Validation Methodology Convention"
description: Standard validation methods and patterns for repository consistency checking
category: explanation
subcategory: development
tags:
  - validation
  - consistency
  - bash
  - awk
  - frontmatter
  - automation
created: 2025-12-14
updated: 2025-12-14
---

# Repository Validation Methodology Convention

This document defines the standard validation methods and patterns used by repository validation agents (repo-governance-checker, repo-governance-fixer, and related tools) to ensure consistency across the codebase. Following these patterns prevents false positives, improves accuracy, and maintains reliable automated checks.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Standard validation patterns enable accurate automated consistency checking. AWK commands reliably extract frontmatter, bash scripts verify conventions automatically. Machines handle repetitive validation instead of humans.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Frontmatter extraction pattern (`awk 'BEGIN{p=0}...'`) is explicitly documented as the canonical method. Validation logic is transparent and reproducible. No magic regex or undocumented checking methods.

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices to documentation standards.

This practice implements/respects the following conventions:

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Validation methods verify files use lowercase kebab-case basenames with standard extensions, matching the GitHub-compatible filename rule.

- **[Linking Convention](../../conventions/formatting/linking.md)**: Link validation checks verify relative paths with .md extension exist and target files are accessible.

- **[Timestamp Format Convention](../../conventions/formatting/timestamp.md)**: Validation patterns verify UTC+7 timestamps in YAML frontmatter match ISO 8601 format with timezone offset.

- **[Indentation Convention](../../conventions/formatting/indentation.md)**: Frontmatter extraction assumes 2-space YAML indentation when parsing nested structures.

## Overview

### Why Standardized Validation Methods?

Without consistent validation approaches, automated checks can:

- **Produce false positives** - Flag legitimate content as violations
- **Miss real issues** - Fail to detect actual problems
- **Behave inconsistently** - Different agents check the same thing differently
- **Create maintenance burden** - Each agent implements validation differently

Standardized methods ensure:

- PASS: **Accuracy** - Correct identification of actual issues
- PASS: **Reliability** - Consistent behavior across all agents
- PASS: **Efficiency** - Reusable patterns reduce duplication
- PASS: **Maintainability** - Single source of truth for validation logic

### Scope

This convention applies to:

- **Validation agents** - repo-governance-checker, docs-checker, docs-link-general-checker, etc.
- **Fix agents** - repo-governance-fixer and similar automated fix tools
- **Content agents** - Any agent that validates file structure or conventions
- **Custom scripts** - Bash scripts performing repository consistency checks

## The Frontmatter Extraction Pattern (CRITICAL)

### The Standard AWK Command

This is THE canonical pattern for extracting YAML frontmatter from markdown files:

```bash
awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' file.md
```

**What it does:**

1. Starts with `p=0` (print flag off)
2. When it sees first `---`, sets `p=1` (print flag on) and skips that line
3. Prints all lines while `p==1` (content between the two `---` delimiters)
4. When it sees second `---`, exits (stops processing)

**Result:** Outputs ONLY the YAML frontmatter content, excluding the `---` delimiters.

### Why This Pattern Exists

Markdown files contain many `#` symbols, hyphens, and other characters that can appear in both frontmatter and document body. Searching the entire file produces false positives.

**Problem:** Need to check if frontmatter contains YAML comments (`#` symbols)

**Common Mistake:**

```bash
# FAIL: WRONG: Searches entire file including markdown body
grep "#" .opencode/agent/agent-name.md
# This incorrectly flags markdown headings like "# Agent Title" as violations
```

**Correct Method:**

```bash
# PASS: CORRECT: Extract frontmatter first, then search
awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' .opencode/agent/agent-name.md | grep "#"

# If grep returns results → VIOLATION (YAML comment in frontmatter)
# If grep returns nothing → COMPLIANT (clean frontmatter)
```

### What to Flag vs What NOT to Flag

**FAIL: VIOLATION - Comment in frontmatter:**

```yaml
---
name: agent-name
description: Description here
tools: Read, Write # This comment is a violation
model: sonnet
color: blue
---
```

**PASS: COMPLIANT - Clean frontmatter with markdown headings in body:**

```yaml
---
name: agent-name
description: Description here
tools: Read, Write
model: sonnet
color: blue
---
# Agent Title  ← This is a markdown heading, NOT a violation
## Section      ← This is also NOT a violation

# Why This Matters  ← Still NOT a violation (markdown body)
```

### Verification Steps

1. Extract frontmatter using awk (lines between first two `---`)
2. Search extracted frontmatter for target pattern
3. If found → report as violation with line number and context
4. If not found → mark as compliant
5. Never flag content in markdown body (after second `---`)

## Standard Validation Checks

### 1. Frontmatter Comment Detection

**Purpose:** Detect `#` symbols in YAML frontmatter (where they indicate comments, which are forbidden in certain contexts like agent frontmatter).

**Pattern:**

```bash
# Extract frontmatter and search for # symbols
awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' "$file" | grep "#"

# If no output → No comments (VALID)
# If output → Comments found (INVALID)
```

**Why it works:** AWK extracts only the YAML block, grep finds any `#` in that isolated content.

**Common pitfall:** Searching entire file flags legitimate markdown headings.

### 2. Missing Frontmatter Field Check

**Purpose:** Verify required frontmatter fields exist (e.g., `name`, `description`, `tools`).

**Pattern:**

```bash
# Extract frontmatter and check for field
awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' "$file" | \
  grep "^${field_name}:"

# If no output → Field missing (INVALID)
# If output → Field present (VALID)
```

**Key details:**

- Use `^${field_name}:` to match field at start of line (prevents false positives from values containing the field name)
- Escape field name if it contains regex metacharacters
- Consider case sensitivity (YAML is case-sensitive)

**Example:**

```bash
# Check if 'model' field exists
field_name="model"
awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' .opencode/agent/docs-maker.md | \
  grep "^model:"
```

### 3. Wrong Field Value Check

**Purpose:** Verify frontmatter field has expected value (e.g., `model: sonnet`, `color: blue`).

**Pattern:**

```bash
# Extract field value
actual_value=$(awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' "$file" | \
  grep "^${field_name}:" | cut -d: -f2- | tr -d ' ')

# Compare with expected
if [ "$actual_value" = "$expected_value" ]; then
  echo "VALID"
else
  echo "INVALID - wrong value: got '$actual_value', expected '$expected_value'"
fi
```

**Key details:**

- `cut -d: -f2-` extracts everything after first `:` (the value)
- `tr -d ' '` removes leading/trailing spaces
- Use exact string comparison (`=`) for field values
- Handle quoted values appropriately

**Example:**

```bash
# Check if model field is 'sonnet'
field_name="model"
expected_value="sonnet"
actual_value=$(awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' .opencode/agent/docs-maker.md | \
  grep "^model:" | cut -d: -f2- | tr -d ' ')

if [ "$actual_value" = "$expected_value" ]; then
  echo "Model field is correct: $actual_value"
else
  echo "Model field mismatch: got '$actual_value', expected '$expected_value'"
fi
```

### 4. Broken Link Detection

**Purpose:** Verify markdown links point to existing files.

**Pattern:**

```bash
# Extract link target from markdown
link_target=$(echo "$link" | sed 's/.*(\(.*\))/\1/')

# Resolve relative path
resolved_path=$(dirname "$file")/"$link_target"

# Check if file exists
if [ -f "$resolved_path" ]; then
  echo "VALID"
else
  echo "INVALID - broken link: $link_target"
fi
```

**Key details:**

- Extract target from `[text](target)` format using sed
- Resolve relative paths from file's directory (not working directory)
- Use `-f` test for file existence (not `-e` which matches directories too)
- Handle absolute paths differently (start with `/`)
- Normalize paths (e.g., `./file.md` vs `file.md`)

**Example:**

```bash
# Validate link from governance/conventions/formatting/linking.md
file="governance/conventions/formatting/linking.md"
link="[Indentation](../../conventions/formatting/indentation.md)"

# Extract target
link_target=$(echo "$link" | sed 's/.*(\(.*\))/\1/')
# Result: ./indentation.md

# Resolve path
resolved_path=$(dirname "$file")/"$link_target"
# Result: governance/conventions/./indentation.md

# Check existence
if [ -f "$resolved_path" ]; then
  echo "Link valid: $link_target"
else
  echo "Broken link: $link_target (resolved to: $resolved_path)"
fi
```

### 5. File Naming Convention Check

**Purpose:** Verify files use lowercase kebab-case basenames with a standard extension (see [File Naming Convention](../../conventions/structure/file-naming.md)).

**Pattern:**

```bash
# Extract basename without extension
basename=$(basename "$file" .md)

# Check: lowercase letters, digits, hyphens only (no underscores, no uppercase, no spaces)
if [[ "$basename" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "VALID"
else
  echo "INVALID - not kebab-case: $basename"
fi
```

**Key details:**

- Allowed characters in basename: `a-z`, `0-9`, `-`
- No underscores, no uppercase, no spaces, no leading/trailing hyphens
- Handle special cases: `README.md`, `docs/metadata/`, date-prefixed files (`YYYY-MM-DD-*`)
- Directory hierarchy encodes category — no prefix required on filenames

## Best Practices

### Always Extract Frontmatter First

**Rule:** When checking frontmatter content, ALWAYS extract it first before searching.

```bash
# PASS: CORRECT
awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' "$file" | grep "pattern"

# FAIL: WRONG
grep "pattern" "$file"
```

**Why:** Prevents false positives from markdown body content.

### Use Proper Regex Escaping

**Rule:** Escape regex metacharacters in field names and search patterns.

**Metacharacters:** `. * [ ] ^ $ \ + ? { } | ( )`

```bash
# If field name contains special chars, escape them
field_name="some.field.name"
escaped_field=$(echo "$field_name" | sed 's/\./\\./g')

# Then use in grep
awk '...' "$file" | grep "^${escaped_field}:"
```

### Verify File Existence Before Checking Content

**Rule:** Always verify file exists before attempting to read/validate content.

```bash
# PASS: CORRECT
if [ ! -f "$file" ]; then
  echo "ERROR: File not found: $file"
  exit 1
fi

# Then proceed with validation
awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' "$file" | grep "#"
```

### Handle Edge Cases

**Rule:** Account for special cases and exceptions.

**Common edge cases:**

- **Files without frontmatter** - Not all markdown files have YAML frontmatter
- **Empty frontmatter** - Frontmatter exists but contains no fields
- **Malformed frontmatter** - Missing opening/closing `---` delimiters
- **Special directories** - `metadata/`, exempted from naming conventions
- **Special files** - `README.md`, `index.md` exempt from naming conventions

```bash
# Check if frontmatter exists
if ! grep -q "^---$" "$file"; then
  echo "WARNING: No frontmatter found in $file"
  # Decide: skip check or report missing frontmatter
fi
```

### Use Consistent Error Reporting

**Rule:** Report violations with consistent format including file path, line number, and context.

**Standard format:**

```
FILE: path/to/file.md
LINE: 42
ISSUE: [VIOLATION_TYPE] Description of the issue
CONTEXT: |
  actual line content here
EXPECTED: What should be present instead
```

**Example:**

```
FILE: .opencode/agent/docs-maker.md
LINE: 5
ISSUE: [FRONTMATTER_COMMENT] YAML comment found in agent frontmatter
CONTEXT: |
  tools: Read, Write # These are the tools
EXPECTED: Clean frontmatter without comments (no # symbols)
```

## Common Pitfalls

### False Positives from Markdown Headings

**Problem:** Searching entire file for `#` flags markdown headings as violations.

**Solution:** Extract frontmatter first, then search isolated content.

**Example:**

```bash
# FAIL: Produces false positive
grep "#" .opencode/agent/agent.md
# Flags: # Agent Title (markdown heading, NOT a violation)

# PASS: Correct - no false positive
awk 'BEGIN{p=0} /^---$/{if(p==0){p=1;next}else{exit}} p==1' .opencode/agent/agent.md | grep "#"
# Only flags actual YAML comments in frontmatter
```

### Case Sensitivity Issues

**Problem:** YAML field names and values are case-sensitive. Searches may miss violations if case doesn't match.

**Solution:** Use exact case matching or explicitly handle case-insensitive scenarios.

**Example:**

```bash
# Exact match (case-sensitive)
grep "^model:" frontmatter.txt

# Case-insensitive (if needed)
grep -i "^model:" frontmatter.txt
```

### Path Resolution Problems

**Problem:** Relative links may resolve incorrectly if working directory differs from file location.

**Solution:** Always resolve paths from file's directory, not current working directory.

**Example:**

```bash
# FAIL: WRONG - resolves from pwd
resolved="$link_target"

# PASS: CORRECT - resolves from file's directory
resolved="$(dirname "$file")/$link_target"
```

### Regex Metacharacter Issues

**Problem:** Field names or patterns containing regex metacharacters cause unexpected matches.

**Solution:** Escape metacharacters or use fixed-string matching.

**Example:**

```bash
# Field name: "some.field"
field="some.field"

# FAIL: WRONG - '.' matches any character
grep "^$field:" frontmatter.txt

# PASS: CORRECT - escape the dot
escaped=$(echo "$field" | sed 's/\./\\./g')
grep "^$escaped:" frontmatter.txt

# OR use fixed-string matching
grep -F "^$field:" frontmatter.txt
```

## Related Conventions

- [AI Agents Convention](../agents/ai-agents.md) - Agents that use these validation methods
- [File Naming Convention](../../conventions/structure/file-naming.md) - What we validate (naming patterns)
- [Linking Convention](../../conventions/formatting/linking.md) - What we validate (link formats)
- [Temporary Files Convention](../infra/temporary-files.md) - Where validation reports are stored

## Maintenance Notes

When adding new validation checks:

1. **Document the pattern** in this convention
2. **Provide working examples** with correct and incorrect usage
3. **Explain the pitfalls** and how to avoid them
4. **Test edge cases** before deploying to agents
5. **Update related agents** to use the standardized pattern

When existing checks fail:

1. **Verify the pattern** matches this convention
2. **Check for edge cases** not covered by standard pattern
3. **Update this convention** if pattern needs refinement
4. **Propagate changes** to all agents using the pattern

This convention is the single source of truth for validation logic. All agents should reference and implement these patterns consistently.

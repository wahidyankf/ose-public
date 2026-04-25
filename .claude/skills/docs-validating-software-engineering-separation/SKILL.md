---
name: docs-validating-software-engineering-separation
description: Validates software engineering documentation separation between OSE Platform style guides (docs/explanation/) and AyoKoding educational content (apps/ayokoding-web/). Ensures no duplication, proper prerequisite statements, and style guide focus on repository-specific conventions only.
created: 2026-02-07
---

# Validating Software Engineering Documentation Separation

This Skill provides comprehensive guidance for validating the separation between repository-specific style guides (docs/explanation/software-engineering/) and educational content (apps/ayokoding-web/), as defined in the [Programming Language Documentation Separation Convention](../../../governance/conventions/structure/programming-language-docs-separation.md).

## Purpose

Use this Skill when:

- Implementing style guide separation validation in checker agents
- Validating docs/explanation content doesn't duplicate AyoKoding educational content
- Ensuring prerequisite knowledge statements exist and are correct
- Checking style guides focus on repository-specific conventions only
- Understanding content separation patterns

## Validation Scope

**CRITICAL**: Only validate relationships **explicitly listed** in the Software Design Reference prerequisite table.

**Authoritative Source**: [Software Design Reference - Specific Prerequisites](../../../docs/explanation/software-engineering/software-design-reference.md#specific-prerequisites)

**Current explicit relationships to validate**:

1. docs/explanation/programming-languages/java/ ↔ ayokoding-web/.../java/
2. docs/explanation/programming-languages/golang/ ↔ ayokoding-web/.../golang/
3. docs/explanation/programming-languages/elixir/ ↔ ayokoding-web/.../elixir/
4. docs/explanation/platform-web/tools/jvm-spring/ ↔ ayokoding-web/.../jvm-spring/
5. docs/explanation/platform-web/tools/jvm-spring-boot/ ↔ ayokoding-web/.../jvm-spring-boot/

**DO NOT validate** languages/frameworks not in this table (TypeScript, Python, etc.) until they are explicitly added to the Software Design Reference.

## Core Validation Principle

**CRITICAL**: docs/explanation/ content MUST NOT duplicate AyoKoding educational content.

**Separation Pattern**:

- **AyoKoding** = Educational (language syntax, by-example tutorials, generic patterns)
- **docs/explanation/** = Style guides (OSE Platform naming, framework choices, repository patterns)

See [Programming Language Documentation Separation Convention](../../../governance/conventions/structure/programming-language-docs-separation.md) for complete rules.

## What to Validate

### 1. Prerequisite Mapping Table Validation

**Validate Software Design Reference table**:

1. Read [Software Design Reference](../../../docs/explanation/software-engineering/software-design-reference.md)
2. Extract "Specific Prerequisites" table
3. For EACH row in table:
   - Verify docs/explanation path exists
   - Verify AyoKoding path exists
   - Both paths must be valid directories

**Only validate entries explicitly in this table** - do not check other languages/frameworks.

### 2. Prerequisite Knowledge Statements

**For each docs/explanation path in the table**:

- Check README.md has "Prerequisite Knowledge" section
- Section references correct AyoKoding path from table
- Section explains "style guides, not tutorials" distinction
- Cross-reference links work

### 3. No Content Duplication

**For each docs/explanation path in the table**:

- Read all .md files in directory
- Check for language syntax tutorials (VIOLATION)
- Check for by-example annotated code (VIOLATION)
- Check for generic patterns without OSE Platform context (VIOLATION)
- Verify content focuses on repository-specific conventions

**FAIL patterns**:

- Teaching language syntax
- By-example learning content
- Generic error handling (not OSE Platform-specific)

**PASS patterns**:

- OSE Platform naming conventions
- Framework choice rationale ("We use X because...")
- Repository-specific architecture patterns

### 4. AyoKoding Learning Path Completeness

**For each AyoKoding path in the table**:

- Check required files exist:
  - \_index.md
  - initial-setup.md
  - quick-start.md
- Check required directories exist:
  - by-example/
  - in-the-field/
- Optional content:
  - overview.md
  - release-highlights/

### 5. Cross-Reference Link Validation

**For each relationship in the table**:

- docs/explanation README links to AyoKoding (REQUIRED)
- Links use correct paths from table
- Links resolve to existing files
- Link text is descriptive

## Validation Workflow

### Step 1: Extract Validation Scope from Software Design Reference

```bash
# Read Software Design Reference
# Extract "Specific Prerequisites" table
# Parse table rows to get:
#   - docs/explanation paths
#   - ayokoding-web paths
# Store as validation scope (ONLY validate these)
```

### Step 2: Validate Each Explicit Relationship

For each row in the prerequisite table:

1. Verify paths exist
2. Check prerequisite statement in docs/explanation README
3. Detect content duplication
4. Validate AyoKoding completeness
5. Check cross-reference links

### Step 3: Report Findings

- Report on ONLY the explicit relationships in table
- Do NOT report on other languages/frameworks
- Group findings by criticality

## Common Separation Violations

### Violation 1: Duplicating Educational Content

**FAIL** (docs/explanation/.../golang/):

```markdown
## Variables in Go

Go variables can be declared multiple ways:
var x int = 10
y := 20
```

**Why**: Teaching Go syntax (belongs in AyoKoding)

**PASS** (docs/explanation/.../golang/):

```markdown
**Prerequisite**: Complete [AyoKoding Golang](...)

## Variable Naming in OSE Platform

- Domain entities: ZakatPayment, WaqfDonation
- Repository variables: zakatRepo, waqfRepo
```

**Why**: OSE Platform naming conventions (not syntax tutorial)

### Violation 2: Missing Prerequisite Statement

**FAIL**:

```markdown
# Java

Java is used for...

## Best Practices
```

**Why**: No prerequisite statement

**PASS**:

```markdown
# Java

## Prerequisite Knowledge

**REQUIRED**: Complete [AyoKoding Java learning path](...)

These are OSE Platform-specific style guides, not educational tutorials.
```

## Criticality Levels

**CRITICAL**:

- Prerequisite mapping missing from Software Design Reference table
- Prerequisite statement missing in docs/explanation README
- Content duplication detected (educational content in style guides)

**HIGH**:

- Wrong AyoKoding path in prerequisite statement
- Style guide content lacks OSE Platform context
- Required AyoKoding content missing

**MEDIUM**:

- Prerequisite statement poorly formatted
- Cross-reference links suboptimal

**LOW**:

- Enhanced prerequisite explanations
- Additional cross-references

## Related Conventions

**Primary**: [Programming Language Documentation Separation Convention](../../../governance/conventions/structure/programming-language-docs-separation.md)

**Supporting**:

- [Software Design Reference](../../../docs/explanation/software-engineering/software-design-reference.md)
- [Diátaxis Framework](../../../governance/conventions/structure/diataxis-framework.md)
- [Content Quality Standards](../../../governance/conventions/writing/quality.md)

## Related Skills

- repo-assessing-criticality-confidence
- repo-applying-maker-checker-fixer
- repo-generating-validation-reports
- apps-ayokoding-web-developing-content

## Related Agents

- docs-software-engineering-separation-checker - Validates explicit relationships
- docs-software-engineering-separation-fixer - Fixes violations
- docs-maker - Creates style guide content
- apps-ayokoding-web-general-maker - Creates educational content

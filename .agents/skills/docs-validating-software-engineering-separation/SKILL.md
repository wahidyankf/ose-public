---
name: docs-validating-software-engineering-separation
description: Validates software engineering documentation separation between OSE Platform style guides (docs/explanation/) and AyoKoding educational content (apps/ayokoding-www/). Ensures no duplication, proper prerequisite statements, and style guide focus on repository-specific conventions only.
created: 2026-02-07
---

# Validating Software Engineering Documentation Separation

This Skill provides comprehensive guidance for validating the separation between repository-specific style guides (docs/explanation/software-engineering/) and educational content (apps/ayokoding-www/), as defined in the [Programming Language Documentation Separation Convention](../../../repo-governance/conventions/structure/programming-language-docs-separation.md).

## Purpose

Use this Skill when:

- Implementing style guide separation validation in checker agents
- Validating docs/explanation content doesn't duplicate AyoKoding educational content
- Ensuring prerequisite knowledge statements exist and are correct
- Checking style guides focus on repository-specific conventions only
- Understanding content separation patterns

## Validation Scope

### Lifecycle Delegation

For a quality-gate handoff, accept exact `delegated-gate-ids` and `lifecycle-evidence`. No
lifecycle gate validates internal links, so path and fragment checks stay here alongside the
semantic correctness of prerequisite relationships and all separation checks.
`./rhino md internal-link validate` (on demand) reports missing target files but does not check
`#fragment` anchors. Checkers preserve
the ledger; fixers return a scope-intersected `updated-lifecycle-evidence`. Omitted delegation
preserves standalone full behaviour.

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

See [Programming Language Documentation Separation Convention](../../../repo-governance/conventions/structure/programming-language-docs-separation.md) for complete rules.

## What to Validate

See [What to Validate and Validation Workflow](./reference/what-to-validate-and-workflow.md) for the five validation checks (prerequisite mapping, prerequisite statements, content duplication, AyoKoding completeness, cross-reference links) and the three-step validation workflow.

## Common Separation Violations

See [Common Separation Violations](./reference/common-separation-violations.md) for worked FAIL/PASS examples of duplicated educational content and missing prerequisite statements.

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

## Fixing Violations

Guidance for `docs-software-engineering-separation-fixer`: see
[Fixing Separation Violations — Confidence and What to Fix](./reference/fixing-confidence-and-scope.md)
and [Fixing Separation Violations — Workflow and Patterns](./reference/fixing-workflow-and-patterns.md).

## Related Conventions

**Primary**: [Programming Language Documentation Separation Convention](../../../repo-governance/conventions/structure/programming-language-docs-separation.md)

**Supporting**:

- [Software Design Reference](../../../docs/explanation/software-engineering/software-design-reference.md)
- [Diátaxis Framework](../../../repo-governance/conventions/structure/diataxis-framework.md)
- [Content Quality Standards](../../../repo-governance/conventions/writing/quality.md)

## Related Skills

- repo-assessing-criticality-confidence
- repo-applying-maker-checker-fixer
- repo-generating-validation-reports
- apps-ayokoding-www-developing-content

## Related Agents

- docs-software-engineering-separation-checker - Validates explicit relationships
- docs-software-engineering-separation-fixer - Fixes violations
- docs-maker - Creates style guide content
- apps-ayokoding-www-general-maker - Creates educational content

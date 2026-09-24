---
name: docs-validating-links
description: Link validation methodology for markdown links including format requirements, path validation, broken link detection, external link verification, and checker implementation patterns
created: 2025-01-22
---

# Validating Markdown Links

This Skill provides comprehensive guidance for validating markdown links across the repository, including internal link validation, external link verification, and checker implementation strategies.

## Purpose

Use this Skill when:

- Implementing link validation in checker agents
- Validating internal documentation links
- Verifying external URL accessibility
- Checking site link formatting
- Implementing link caching strategies
- Understanding link validation patterns

## Link Validation Principles

### Lifecycle Delegation

Quality-gate invocations may pass `delegated-gate-ids` from
[Lifecycle Validation Ownership](../../../repo-governance/workflows/meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md).
Match exact IDs only. No lifecycle gate validates internal links (`./rhino gate list` declares
none), so internal paths and fragments are never delegated and always stay in scope here.
`./rhino md internal-link validate` runs on demand only: it reports links whose target file is
missing, skips links in code spans and fenced blocks and the sources `repo-config.yml` excludes, and
does not check `#fragment` anchors, so verify anchors yourself. Continue external HTTP
reachability and cache maintenance. If the parameter is omitted, preserve standalone full
validation.

Also accept `lifecycle-evidence`: checkers preserve it unchanged; fixers scope-intersect changed
files and return `updated-lifecycle-evidence`, invalidating only affected entries.

### Why Link Validation Matters

**Broken links**:

- Break user navigation experience
- Reduce documentation credibility
- Create maintenance burden (hard to find broken links manually)
- Indicate structural issues (moved/deleted files)

**Link validation**:

- Prevents broken links from reaching production
- Catches file renames and moves
- Validates external resources still exist
- Ensures consistent link formatting

### Validation Scope

**What to validate**:

- Internal markdown links (docs/, repo-governance/, plans/)
- Content links (apps/ayokoding-www/, apps/ose-www/)
- External URLs (HTTP/HTTPS)
- Image links (relative paths)
- Anchor links (same-page headings)

**What NOT to validate**:

- Links in code blocks (examples, not actual links)
- Links in quoted text (preserved formatting)
- Commented-out links (intentionally disabled)

## Internal Link Validation

See [Internal Link Validation](./reference/internal-link-validation.md) for the required link format, three-step validation methodology, and the four common internal-link errors with criticality/detection.

## External Link Validation

See [External Link Validation](./reference/external-link-validation.md) for verification strategy, HTTP request pattern/status-code handling, link caching strategy (TTLs), and common external-link errors.

## Checker Implementation Patterns

See [Checker Implementation Patterns](./reference/checker-implementation-patterns.md) for the 5-step checker workflow, progressive-writing requirement, required tools, criticality categorization, and the dual-label (verification + criticality) pattern.

## docs-link-checker Agent Contract

`docs-link-checker` diverges from this Skill's generic cache sketch. See
[docs-link-checker Cache and Workflow](./reference/cache-and-workflow.md) for its specific
6-month per-link expiry cache contract, required outputs, discovery/extraction patterns, and
fixing workflow.

## Related Conventions

**Linking Standards**:

- Linking Convention - Complete linking standards
- Linking Convention - Standard linking patterns for docs/ and app content

**Validation Standards**:

- Repository Validation Methodology - Standard validation patterns
- Criticality Levels Convention - Criticality classification

**Quality Standards**:

- Content Quality Principles - Link text quality requirements

## Related Skills

**Validation Skills**:

- repo-assessing-criticality-confidence - Criticality and confidence levels
- repo-applying-maker-checker-fixer - Checker workflow patterns
- repo-generating-validation-reports - Report format and progressive writing

**Domain Skills**:

- apps-ayokoding-www-developing-content - ayokoding-web content linking patterns (Next.js)

## Related Agents

**Link Validation Agents**:

- docs-link-checker - Validates links in docs/, repo-governance/, plans/
- apps-ayokoding-www-link-checker - Validates links in ayokoding-web content

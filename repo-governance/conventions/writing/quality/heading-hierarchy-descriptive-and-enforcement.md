---
description: "Writing descriptive (not vague) headings, using headings only for structure, and where heading hierarchy is mechanically enforced"
when_to_use: "Read this when naming a heading, or to check whether a given file path is covered by the automated heading-hierarchy gate."
---

# Heading Hierarchy: Descriptive Headings, Semantic Structure, and Machine Enforcement

## Descriptive Headings

**Headings MUST be descriptive and specific** - avoid vague titles.

PASS: **Good (Descriptive)**:

```markdown
## Installing Dependencies with npm

## Configuring Authentication Settings

## Troubleshooting Database Connection Errors
```

FAIL: **Avoid (Vague)**:

```markdown
## Installation

## Configuration

## Troubleshooting
```

**Why**: Descriptive headings improve scannability and help readers find information quickly.

## Semantic Structure

**Use headings for structure, NOT for styling** - headings convey document hierarchy.

FAIL: **Incorrect (Using Heading for Emphasis)**:

```markdown
This is important content.

#### NOTICE: READ THIS CAREFULLY <!-- WRONG! This isn't a section heading -->

More content continues here...
```

PASS: **Correct (Use Blockquote or Callout)**:

```markdown
This is important content.

> **NOTICE**: Read this carefully - this is a critical step.

More content continues here...
```

## Machine Enforcement

Heading hierarchy is mechanically enforced on a **prose allowlist** (default-deny) of paths:

- `docs/` — all documentation
- `repo-governance/` — all governance docs
- `plans/` (excluding `plans/done/`) — active and backlog plans
- `specs/` — specification files
- Root `*.md` files (no directory separator in path)
- `apps/*/README.md` — per-app README files
- `libs/*/README.md` — per-lib README files
- `apps/*/docs/**` — per-app docs directories
- `libs/*/docs/**` — per-lib docs directories

**Exempt paths** (skipped by the heading validator):

- `.claude/**` — agent definition and skill files
- `apps/ayokoding-www/content/` — educational content
- `apps/ose-www/content/` — site content
- `plans/done/` — frozen archived plans
- All other paths not in the allowlist above

**Gate locations**: Runs at **pre-commit (staged `.md` files within the prose allowlist, via
lint-staged)** via `npx nx run Rhino:headings:hierarchy-validation`. Does NOT run at pre-push or
in a standalone CI workflow — heading-hierarchy validation is folded into lint-staged and
`pr-quality-gate.yml`.

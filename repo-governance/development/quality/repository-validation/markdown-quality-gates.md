---
description: "The markdown-specific quality gates and their commands."
when_to_use: "Use when locating a markdown quality gate's command or exclusions."
---

# Markdown Quality Gates

Eight gates carry `ci-group: markdown` in `repo-config.yml`: `markdownlint`, `md-mermaid`,
`md-mermaid-strict`, `md-heading-hierarchy`, `md-naming`, `md-frontmatter`, `md-links`, and
`governance-readme-index`.
The registry is the source of truth for every command, argument, and surface below — read
`repo-config.yml` when this page and the registry disagree.

Nothing invokes these by hand. The registry's `gate run --surface=pre-commit` and `--surface=pre-push`,
which the hooks reach through `./rhino gate run`, and the CI matrix derived from `ci-group` execute them; the commands below are what those surfaces run.

## 1. Mermaid Diagram Validation

**Command**: `md mermaid validate`

A split command. F# selects the Markdown files in scope that hold a Mermaid block and hands each to
the pinned RHINO as `--file`; RHINO applies the `md-mermaid` section of `repo-config.yml`:
`accTitle` and `accDescr` on every diagram, node and edge labels of at most 30 graphemes, and the
colour palette. When no selected file holds a diagram, RHINO is not started. F# then checks maximum
horizontal width (4 nodes per rank), single diagram per fenced block, and valid syntax. Diagram
types covered: `flowchart`/`graph` (all directions) and `stateDiagram-v2`/`stateDiagram` (v1) —
state node count contributes to width.

**Registry exclusions**: `apps/rhino-cli/tests/fixtures`, `plans/done`,
`apps/ayokoding-www/content`. The `--exclude` flag is repeatable; pass extra prefixes to suppress
noise in project-specific runs.

**Surfaces**: pre-commit (staged `.md` files) and CI (all `.md` files).

## 1a. Mermaid Label Length, Strict

**Command**: `md mermaid validate --max-label-len 20` (gate `md-mermaid-strict`)

`md-mermaid` above leaves labels to RHINO's limit of 30 — Mermaid's `wrappingWidth` baseline, a
backstop. The binding limit is 20 (see
[Rule 3](../../../conventions/formatting/diagrams/common-syntax-errors-label-constraints-rule-3-line-length.md));
this gate closes that gap: with an explicit `--max-label-len`, F# checks node labels, state display
names and transition edge labels too. Same command, same exclusions, same surfaces — but scoped to **changed**
`.md` files on both, so it ratchets new and edited diagrams to 20 without failing on the untouched
legacy corpus.

## 2. Markdown Link Validation

**Command**: `md links validate`

Full-repo link scan. Validates all relative `[text](path.md)` links resolve to existing files. Also
validates `#fragment` anchor references using the GitHub slug algorithm — underscores and Unicode
letters/digits are kept, spaces map to hyphens, duplicates receive `-1`, `-2`, … suffixes (verified
against the `github-slugger` v2 reference implementation). A fragment with no matching heading
emits a `broken-anchor` finding.

**Registry exclusions**: `plans/done`.

**Surfaces**: pre-push (all `.md` files) and CI (all `.md` files). Deliberately **not** at
pre-commit — a repo-wide link scan is too slow for every commit.

## 3. Heading Hierarchy Validation

**Command**: `md heading-hierarchy validate`

Validates heading nesting on a prose allowlist (default-deny): `docs/`, `repo-governance/`,
`plans/` (excluding `plans/done/`), `specs/`, root `*.md`, `apps/*/README.md`, `libs/*/README.md`,
`apps/*/docs/**`, `libs/*/docs/**`. All other paths (including `.claude/**`,
`apps/ayokoding-www/content/`, `apps/ose-www/content/`, `plans/done/`) are skipped.

**Surfaces**: pre-commit (staged `.md` files) and CI (all `.md` files).

## CI Enforcement

There is no standalone `markdown-validate.yml` workflow. Every markdown gate runs in the
`markdown` matrix job of `pr-quality-gate.yml`, which derives its members from `ci-group` at
runtime — adding a gate with `ci-group: markdown` puts it in that job with no workflow edit.

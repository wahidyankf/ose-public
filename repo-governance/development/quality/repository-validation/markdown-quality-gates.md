---
description: "The markdown-specific quality gates and their commands."
when_to_use: "Use when locating a markdown quality gate's command or exclusions."
---

# Markdown Quality Gates

Five Markdown gates are declared in `repo-config.yml` `gates.entries`: `markdownlint`, `md-mermaid`,
`md-heading-hierarchy`, `md-naming`, and `md-frontmatter`. The registry is the source of truth for
every command, argument, and surface below — read `repo-config.yml` when this page and the registry
disagree, and run `./rhino gate list` to see the current surfaces.

Nothing invokes these by hand. Each runs on the `pre-commit` and `pull-request` surfaces, which the
hooks and `pr-quality-gate.yml` reach through `./rhino gate run`. Every `./rhino` command below runs
the pinned external RHINO executable, which reads its policy from `repo-config.yml`
`policies.markdown`.

## 1. Mermaid Diagram Validation

**Command**: `./rhino md mermaid validate --file <path>` (gate `md-mermaid`)

`scripts/validate-mermaid-files` receives the staged (pre-commit) or changed (pull-request) paths,
keeps the `.md` files, and hands each to RHINO as `--file`. RHINO applies
`policies.markdown.mermaid`: `accTitle` and `accDescr` on every diagram, node and edge labels of at
most 30 graphemes, and the declared colour palette. The binding authoring limit is stricter — see
[Rule 3](../../../conventions/formatting/diagrams/common-syntax-errors-label-constraints-rule-3-line-length.md).

## 2. Markdown Link Validation

**Command**: `./rhino md internal-link validate`

Full-repo link scan. Validates that every local Markdown link's target path resolves inside the
repository; it does not check `#fragment` anchors. Sources matching `policies.markdown.internal-link.exclude-sources`
(`plans/done/**`, the published content trees, and the skill trees) are skipped.

**Surfaces**: none today — it is not a declared gate, so run it directly before pushing link
changes. A repo-wide scan belongs outside pre-commit because adding, deleting, or renaming any
file can break links in untouched files.

## 3. Heading Hierarchy Validation

**Command**: `./rhino md heading-hierarchy validate` (gate `md-heading-hierarchy`)

Checks heading nesting on the surfaces declared under `policies.markdown.heading-hierarchy`
(single H1, at most one level per jump). Paths outside those surfaces, including the published
content trees, are skipped.

## CI Enforcement

There is no standalone `markdown-validate.yml` workflow. The Repository policy job of
`pr-quality-gate.yml` runs `./rhino gate run --surface pull-request`, which executes every gate
declared for that surface.

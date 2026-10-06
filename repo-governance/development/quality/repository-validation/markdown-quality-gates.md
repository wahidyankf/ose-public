---
description: "The markdown-specific quality gates and their commands."
when_to_use: "Use when locating a markdown quality gate's command or exclusions."
---

# Markdown Quality Gates

Eight Markdown gates are declared in `repo-config.yml` `gates.entries`: `markdownlint`, `md-mermaid`,
`md-mermaid-repository`, `md-internal-link`, `md-readme-index`, `md-heading-hierarchy`, `md-naming`, and
`md-frontmatter`. The registry is the source of truth for
every command, argument, and surface below — read `repo-config.yml` when this page and the registry
disagree, and run `./rhino gate list` to see the current surfaces.

Nothing invokes these by hand. Each runs on the `pull-request` surface, and every one except the repo-wide
`md-mermaid-repository` also runs at `pre-commit`; the hooks and
`pr-quality-gate.yml` reach them through `./rhino gate run`. Every `./rhino` command below runs
the pinned external RHINO executable, which reads its policy from `repo-config.yml`
`policies.markdown`.

## 1. Mermaid Diagram Validation

**Command**: `./rhino md mermaid validate --file <path>` (gate `md-mermaid`)

`scripts/validate-mermaid-files` receives the staged (pre-commit) or changed (pull-request) paths,
keeps the `.md` files, and hands each to RHINO as `--file`. RHINO applies
`policies.markdown.mermaid`: `accTitle` and `accDescr` on every diagram, node and edge label
segments of at most 20 graphemes
([Rule 3](../../../conventions/formatting/diagrams/common-syntax-errors-label-constraints-rule-3-line-length.md)),
and the declared colour palette.

The same gate also enforces `mermaid.require-default-class`: a `flowchart`, `graph`,
`classDiagram`, `erDiagram`, or `requirementDiagram` must declare a `classDef default` setting
`fill`, `stroke`, and `color`. It skips diagram types whose renderer never applies `default`, and
mermaid fences nested in another code block. `mermaid.allowed-types`,
`mermaid.forbid-theme-overrides`, and `mermaid.canvas-colors` refuse undeclared types and theme
overrides and measure non-text contrast.

It does not parse diagram syntax: RHINO v0.11.0 reports a diagram with a malformed shape or an unclosed
bracket clean, the same as a well-formed one. A green result shows the rules above hold, never that the
diagram renders.

The `md-mermaid-repository` gate runs a bare `./rhino md mermaid validate` on the pull-request surface
only. It scans every live diagram outside `mermaid.exclude`, so a diagram that drifts outside the
palette in an untouched file still fails; pre-commit stays narrowed to staged paths. Its pull-request
composition is `at-least` because this surface holds a gate pre-commit does not.

## 2. Markdown Link Validation

**Command**: `./rhino md internal-link validate` (gate `md-internal-link`)

Full-repo link scan. Validates that every local Markdown link's target path resolves inside the
repository; it does not check `#fragment` anchors. Sources matching `policies.markdown.internal-link.exclude-sources`
(`plans/done/**`, the published content trees, and the generated `.claude/skills/**` route stubs) are skipped.

**Surfaces**: `pre-commit` and `pull-request`, as gate `md-internal-link`. Both scan the whole tree,
because adding, deleting, or renaming any file can break links in untouched files; the full scan
takes about two seconds, so the commit that breaks a link is the one that fails.

## 3. README Index Validation

**Command**: `./rhino md readme-index validate` (gate `md-readme-index`)

Checks that each tree in `policies.markdown.readme-index.trees` has a root `README.md` linking every direct child file and
subdirectory; see [README Completeness](../../../conventions/structure/governance-readme-completeness.md).

**Surfaces**: `pre-commit` and `pull-request`, each over every declared tree, for the same reason as link
validation: adding or removing a directory changes an index the staged paths never touch.

## 4. Heading Hierarchy Validation

**Command**: `./rhino md heading-hierarchy validate` (gate `md-heading-hierarchy`)

Checks heading nesting on the surfaces declared under `policies.markdown.heading-hierarchy`
(single H1, at most one level per jump). Paths outside those surfaces, including the published
content trees, are skipped.

## CI Enforcement

There is no standalone `markdown-validate.yml` workflow. The Repository policy job of
`pr-quality-gate.yml` runs `./rhino gate run --surface pull-request`, which executes every gate
declared for that surface.

---
description: Nx naming scheme, governance-currency checklist, Mermaid rules.
when_to_use: Use when naming a target or writing a state diagram.
---

# Toolchain Checklist — Invariants E, F, and G

## Invariant E — Nx Target Naming (`{domain}:{work}`)

Governance, validation, lint, and format targets use the `{domain}:{work}` scheme.
`spec-coverage` is renamed `test:coverage:behaviour` repo-wide.

Rust-specific renames applied to all Rust `project.json` files:

| Old name     | New name                                        |
| ------------ | ----------------------------------------------- |
| `fmt:check`  | removed; formatting is the `format-staged` gate |
| `check:msrv` | `compat:min-version`                            |
| `deny:check` | `deps:audit`                                    |

The full naming rationale and complete target catalog are documented in
[Nx Target Standards](../nx-targets.md).

## Invariant F — Governance Documentation Currency

All documentation in `repo-governance/` must reflect the converged toolchain. After any P10-class
rename or command-surface change, update:

1. `repo-governance/development/infra/ci-conventions.md` (this file) — pre-push section + checklist
2. `repo-governance/development/infra/nx-targets.md` — target name tables + `{domain}:{work}` naming section
3. `AGENTS.md` — Cross-Language Lint Gates section + Rhino command surface
4. The pinned Rhino release documentation — command surface table + architecture notes
5. Any index READMEs that reference renamed targets

Stale `validate:*` or `spec-coverage` references in any of the above are bugs caught by the
toolchain checklist in the plan delivery process. `./rhino md internal-link validate` checks only
that a link's target file exists, so a stale name in prose, or a `#fragment` anchor, passes it.

## Invariant G — Mermaid State Diagram Validation

`stateDiagram-v2` diagrams are subject to the same label limit as flowcharts; `stateDiagram` (v1)
is not an allowed type. Width and the full label rules live in
[State Diagram Width and Label Constraints](../../../conventions/formatting/diagrams/mermaid-state-diagram-width-and-label-constraints.md).

- **Label length**: node and edge label segments are limited to **20 graphemes**, each
  `<br/>`-separated segment measured separately (`policies.markdown.mermaid` in `repo-config.yml`).
  Use abbreviations or split composite states when labels exceed this limit.
- **Width**: no gate measures width; authors and reviewers count by hand against the same convention.

The `md-mermaid` gate (`./rhino md mermaid validate`) enforces the limit only on `state "…" as id`
labels, not on `id : name` display names or transition labels. On the pull-request surface
`md-mermaid-repository` scans every diagram outside `mermaid.exclude`.

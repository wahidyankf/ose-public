# BRD: Mermaid Diagram Validation

## Problem Statement

Mermaid flowchart diagrams in repository markdown files degrade silently:

1. **Label overflow**: Long node labels render truncated or overflow the box in GitHub
   preview, VS Code, and Mermaid Live Editor — the diagram becomes unreadable without
   the viewer knowing text was clipped. This repo has already experienced this: production
   C4 diagrams in `governance/conventions/formatting/diagrams.md` show labels clipping at
   ~22 characters in Hugo/Hextra rendering. Mermaid's `wrappingWidth` config defaults to
   200 px; at the default 16 px font that accommodates ~28–30 characters before wrapping
   or overflow begins. Setting the default warning at **30 characters** is grounded in
   this official Mermaid configuration value (not an arbitrary pick).
   (Source: Mermaid config schema — `wrappingWidth` default 200:
   https://mermaid.js.org/config/schema-docs/config-defs-flowchart-diagram-config-properties-wrappingwidth.html
   — accessed 2026-04-22.)

2. **Diagram too wide (parallel axis)**: Flowcharts with many parallel nodes at the same
   rank (e.g., 6 nodes at rank 2 in a TB diagram) compress each node so small that the
   diagram is illegible at normal viewing sizes. A maximum of 3 parallel nodes per rank
   keeps diagrams readable at standard document widths. **The sequential depth (chain
   length along the primary flow axis) is not independently limited** — authors can have
   as many sequential steps as needed. However, a diagram that is _both_ too wide AND too
   deep is an intentionally complex architectural overview with no single clear fix; the
   validator emits a non-blocking **warning** in that case (both span > `--max-width` AND
   depth > `--max-depth`) so authors are advised to simplify without being blocked.

3. **Accidental multi-diagram blocks**: A second `flowchart`/`graph` keyword inside the
   same fenced code block produces undefined parser behavior (some renderers silently
   drop the second diagram; others show a parse error). Authors rarely do this
   intentionally — when it happens it is always a mistake.

## Business Impact

Mermaid diagram quality has a direct impact on documentation legibility. Undetected
structural violations create a poor reader experience and require manual post-merge
fixes. An automated gate prevents regressions from reaching `main` without slowing
the documentation author's workflow.

## Affected Roles

| Role                  | How they are affected                                                    |
| --------------------- | ------------------------------------------------------------------------ |
| Documentation authors | Immediate feedback on diagrams that will render badly                    |
| Reviewers             | Catch diagram issues in CI before merge — no manual visual review needed |
| Readers               | Consistently readable, correctly rendered diagrams across all docs       |

## Success Metrics

- Zero truncated-label or overcrowded-width diagrams reach `main` after the validator
  is in the pre-push hook.
- False-positive rate: non-flowchart mermaid blocks (sequence, class, gantt) never
  flagged.
- _Judgment call:_ full-repo scan completes in under 2 seconds on a typical laptop
  (all `.md` files in `ose-public` ≈ 400 files — estimate based on I/O-bound file
  scanning at typical SSD speeds; no formal baseline measured).
- _Judgment call:_ `--changed-only` mode enables pre-push gate to complete in < 500 ms
  for a typical PR (1–10 changed `.md` files — estimate from linear extrapolation of
  full-scan estimate).

## Business Risks

| Risk                      | Description                                                                                                         | Mitigation                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| False-positive violations | Custom regex parser may misidentify valid label syntax (e.g., markdown-in-labels, escaped characters) as violations | Thorough unit test coverage of all node shape regexes; authors can increase limit via flag |
| Performance regression    | Validator adds latency to the pre-push hook; if scan is slow, developers may skip it                                | Conditional execution on `--changed-only`; limit applies only to changed `.md` files       |
| Parser maintenance burden | New Mermaid node shapes or keyword syntax in future Mermaid versions will not be detected until regex is updated    | Document as known limitation in tech-docs; monitor Mermaid release notes                   |

## Out of Scope

- **Auto-fixing**: The command is a read-only checker. It reads files and reports
  conformance. It never modifies any file. Auto-fixing is out of scope for all versions.
- **Other Mermaid diagram types**: `sequenceDiagram`, `classDiagram`, `gantt`, `gitGraph`,
  `pie`, `mindmap`, `timeline`, and all other non-flowchart Mermaid types are silently ignored —
  they pass through the validator without any checks. This is a hard design constraint.
- Validating Mermaid syntax correctness beyond the three structural rules.
- Edge-weight labels / link text length validation.
- Independent enforcement of depth alone: depth > `--max-depth` with no width violation
  does not produce a warning or error.

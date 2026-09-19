# Mermaid state-diagram label render-clipping WARN rule

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: add a WARN-level heuristic to `./rhino md mermaid validate` that flags
`stateDiagram-v2` edge labels at risk of clipping in GitHub's renderer, using a threshold derived by
measurement rather than assumption.

> De-promoted 2026-07-21 from a full backlog plan (full detail preserved in git history).

## Problem / context

A `stateDiagram-v2` edge label can be source-correct and render-wrong: it passes every text-based
validator yet displays clipped in GitHub's renderer. No text validator can observe this, because the
defect exists only in rendered output, and character count does not predict it — during the
originating plan a 30-char label clipped, a 33-char label clipped, but a 40-char label rendered fine.
Clipping depends on glyph width and layout, not raw length. The existing label rule (a ≤ 30 raw-char
proxy) neither catches nor explains the real failure, and the repo's actual state-diagram edge labels
break down as: 31 labels over 40 chars, 202 in the 31–40 band, 983 in the 26–30 band, and ~11,800 at
or under 25 chars.

## Why now

The defect was discovered live during `parallel-orchestration-shared-machine-governance`, where a
valid-but-clipped diagram shipped unnoticed. Every state diagram authored across the three repos is
another chance to reintroduce it, and today there is no signal at all — the gap is silent by
construction.

## Prior art / precedents

- **Mermaid stateDiagram-v2 transition labels** — the exact label construct whose rendered clipping the
  WARN rule targets. [mermaid.js.org](https://mermaid.js.org/syntax/stateDiagram.html)
- **GitHub native Mermaid rendering** — the specific renderer whose clipping no text validator can
  observe. [GitHub blog](https://github.blog/developer-skills/github/include-diagrams-markdown-files-mermaid/)
- **Diagrams convention (§Render-Fidelity Caveat)** — the repo doc the shipped rule would be pointed at.
  [diagrams](../../../repo-governance/conventions/formatting/diagrams.md)

## Proposed direction (sketch)

- Derive the threshold empirically: render a calibration sweep of `stateDiagram-v2` labels, observe
  which clip in GitHub's renderer, and characterize the real predictor (likely rendered glyph width,
  not character count).
- Add the rule to `./rhino md mermaid validate` at WARN severity only — message emitted, exit 0.
- Record the derivation method and calibration data in the plan's `tech-docs.md` so a future
  maintainer can re-derive when the renderer changes, and point
  `diagrams.md` §Render-Fidelity Caveat at the shipped rule.

## Rough scope & non-goals

In scope: the empirical calibration, a WARN-only state-diagram rule, and documenting the derivation.

Out of scope (for now): any FAIL-level enforcement (a failing gate would block the ~1,200 labels in
the warn bands on a defect it cannot actually detect); bulk-rewriting those existing labels
(remediation stays opportunistic); flowchart and sequence-diagram labels (calibration is
state-diagram-specific until measured otherwise).

## Risks & open questions

- The calibration is renderer-specific — GitHub's Mermaid version can shift the clipping boundary, so
  the threshold needs a documented re-derivation path rather than a hard-coded magic number. (open)
- The rule touches `apps/rhino-cli/**`, which must stay byte-identical across `ose-public` and
  the private sibling — execution is a coordinated two-repo change plus companion Gherkin.
- What predictor actually generalizes (glyph-width estimate vs. something layout-dependent) is
  unknown until the sweep is run. (open)

## What success looks like + promotion signal

Success: an author writing a state-diagram label likely to clip gets a warning naming the file, line,
and label, while the build still passes; below-threshold labels stay silent (the negative-direction
falsifiability control). Ready to re-promote to a `backlog/` plan once the calibration approach is
scoped well enough to design against — the WARN wiring itself is straightforward; the open work is
the measurement, not the plumbing.

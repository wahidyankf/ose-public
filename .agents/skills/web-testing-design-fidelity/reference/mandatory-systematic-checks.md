# Mandatory Systematic Checks (Forcing Functions)

The dimensions checklist gives breadth; these two checks force the design-fidelity failures that fall
**between** "token drift" (wrong token) and "reinvented primitive" (bespoke re-build) and that a
colour/mockup sweep misses. Run both every `standard`/`thorough` pass, **enumerate** the elements (do
not sample), and record their matrices in the coverage map.

## A. Raw / unstyled native-element audit

Enumerate every interactive native element on the rendered page — `select`, `input`, `textarea`,
`button`, checkbox/radio. For each, read its **computed styles** and class list and assert it carries
the design system's styling (a `libs/web-ui` primitive, or the app's token/utility classes) — NOT
browser default chrome. A native control rendered with UA defaults (no border-radius from the scale,
no token background, no consistent padding; an empty or UA-only class list) is a finding citing
**Heuristic 4 (internal Consistency & Standards)**: a raw `<select>`/`<input>` beside styled siblings
fragments the design language. This is distinct from token drift and primitive reinvention — it is the
**absence** of any design-system styling. Report the rendered symptom (computed style + bare class
list); leave the source fix to `swe-reviewer`.

> Class this catches: _the min-role baseline inputs rendered as bare unstyled HTML controls while the
> cost/savings inputs were fully styled._

## B. Intra-form & cross-surface styling-consistency matrix

1. **Within a form/region** — enumerate controls of the same kind (all selects, all number inputs, all
   primary buttons) and assert they share the same computed styling tuple (background, border, radius,
   font-size, padding within tolerance). An outlier is a consistency finding.
2. **Across surfaces** — for each control kind that recurs on multiple tabs/views, assert the rendered
   styling matches across surfaces; a control styled one way on tab A and differently on tab B is a
   cross-surface consistency finding (Heuristic 4). Record the control-kind × surface styling matrix in
   the coverage map.

Industry practice for this is visual-regression baselining (e.g. Chromatic); absent that tooling, read
**computed-style tuples** via Playwright and compare within tolerance.

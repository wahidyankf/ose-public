# Output Modes: `delivery` and `local-tmp`, and Procedure Summary

## Mode `delivery` — fold findings into an existing plan's `delivery.md`

Selected with `output-mode: delivery` and a `plan-path` (a plan folder already in
`plans/in-progress/` or `plans/backlog/`). This mode is the single mechanism behind the **rule-15
web-UI near-end three-tester retest** (see the
[User-Facing Delivery Hardening Convention](../../../../repo-governance/development/quality/user-facing-delivery-hardening.md)
and the
[Web UX Test-Fixing Planning workflow](../../../../repo-governance/workflows/quality/ux-review-fix-planning.md)).
Do not create a new plan folder and do not author `README`/`brd`/`prd`/`tech-docs`/`delivery` — the
host plan already has them. Instead:

- Append each finding to the host plan's `delivery.md` as a **new unchecked checkbox**, one finding per
  checkbox, source-attributed: `- [ ] DWT-NNN: <defect summary> — fix before archival`, inside a
  clearly-labelled `## Rule-15 three-tester retest follow-ups` section (create it if absent).
- Fold each spec-gap (`SG-###`) into that same section as its own unchecked checkbox tied to the host
  plan's `specs/**` coverage steps.
- Write cited screenshots into the **host plan's** `evidence/` subfolder (same
  `phase-N-<description>-<locale>-<breakpoint>px.png` naming), so the evidence travels with the plan it
  belongs to.
- Run `npm run lint:md` over the edited `delivery.md`, and return the same severity-count summary to
  the orchestrator.

## Mode `local-tmp` — a throwaway findings file for direct fixing

Selected with `output-mode: local-tmp`. Write a single
`local-tmp/<YYYY-MM-DD>__<slug>/findings.md` carrying the full finding catalog (same anatomy,
severity/priority, steps-to-reproduce) plus an `evidence/` subfolder beside it for cited screenshots.
Emit **no** `README`/`brd`/`prd`/`spec-gaps`/`tech-docs`/`delivery`, and make **no** entry in
`plans/backlog/README.md`. The folder is gitignored and ephemeral — the calling session reads
`findings.md` and applies the fixes directly in the same run. Return the same severity-count summary
plus the `local-tmp/` path to the orchestrator.

## Procedure Summary

1. Confirm URL(s) + design goal; resolve depth, breakpoints, locales, design ground truth, and
   **output mode before any capture**. An omitted mode resolves to `local-tmp`; `delivery` requires an
   existing `plan-path`; `plan` requires explicit selection plus literal authorization to create a
   plan artifact.
2. Establish the baseline (`WebFetch`): structure, routes, locale-prefix.
3. Render, measure computed styles, and screenshot each route across EVERY supported locale × EVERY
   breakpoint (375 / 768 / 1280, plus 320/1440 when `thorough`), saving cited screenshots under the
   resolved evidence root: local findings `evidence/` by default, host-plan `evidence/` in
   `delivery` mode, or new-plan `evidence/` only in explicitly authorized `plan` mode.
4. Compare every observation against the five ground-truth sources; for design practice, cite the
   principle (delegating to `web-researcher` when unsure). Deliberately probe spacing/density ("not
   cramped"), alignment, hierarchy, and cross-surface consistency — not just colour/mockup match.
5. Run the two **Mandatory Systematic Checks** (enumerate, never sample): the raw/unstyled
   native-element audit and the intra-form & cross-surface styling-consistency matrix; record each in
   the coverage map.
6. Detect design-spec gaps: catalog on-design behaviours worth protecting that `specs/**` does not
   cover, and draft proposed Gherkin for each.
7. Triage findings with severity + proposed priority, each citing its violated ground truth/principle;
   de-duplicate.
8. Write to the resolved destination: `local-tmp/.../findings.md` plus `evidence/` by default;
   unchecked host-plan follow-ups plus host evidence in `delivery` mode; or the full plan document
   set and its index entry only in explicitly authorized `plan` mode. Preserve reproduction steps
   and Gherkin ACs for the on-design result where supported.
9. Return a concise summary to the orchestrator: counts by severity, the spec-gap count, the top
   design risks, the resolved output path, and what was _not_ covered.

---
description: "How plan-maker grills the user then authors tech-docs.md, a TDD-shaped delivery.md with Rule-15 retest follow-ups, and (when UI-bearing) the both-tier assets/ mockup folder."
when_to_use: "Use when checking exactly what Phase 4 authors, the UI-bearing gate's mockup requirements, or how new vs merge plan-mode is handled during solidification."
---

# Phase 4 — Solidify — Tech-Docs, Delivery, and (Conditional) UI Assets

**Agent**: `plan-maker` — grills the user (multiple-choice, per the
[Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md)) on scope,
prioritization, fix approach, and any UI direction, then authors:

- `tech-docs.md` — root-cause analysis and the chosen fix approach per finding (or per finding
  cluster), naming the affected files/components and the design-system primitives involved.
- `delivery.md` — TDD-shaped delivery checklist (RED/GREEN/REFACTOR per code item, file path +
  verbatim command + acceptance criterion), tagged `[AI]`/`[HUMAN]`, with Phase 0 first and the
  **Specs & Gherkin completeness** coverage steps that fold the exploratory `SG-###` proposals into
  `specs/**` Gherkin (per [feature-change-completeness](../../../development/quality/feature-change-completeness.md)).
  For a web-UI feature-change plan, the checklist also ends with a **"Rule-15 three-tester retest
  follow-ups"** section: run the three live-site testers (`web-exploratory-tester`,
  `web-usability-tester`, `web-design-tester` — i.e. this `web-ux-test-fixing-planning` round) against
  the running target URL(s) across all locales after the fixes land and the visual sign-off is
  recorded, append each finding as a **new unchecked task-list checkbox** (source-attributed
  `EWT-###`/`UWT-###`/`DWT-###`), and fix/tick each before archival — per the
  [User-Facing Delivery Hardening Convention](../../../development/quality/user-facing-delivery-hardening.md)
  (Rule 15).
- Finalize `README.md` so its risk summary labels each top risk `[Exploratory]`, `[Usability]`, or `[Design]`,
  and the document map lists every file including (when present) the `assets/` folder.

**Conditional — UI-bearing gate**: if **any** finding's fix adds or changes a user-facing screen or
component under `apps/`/`libs/`, the plan is **UI-bearing** and MUST carry an `assets/` folder with
the both-tiers mockups required by the
[UI Mockups in Plan Docs convention](../../../conventions/formatting/diagrams/ui-mockups-principles-and-scope.md#ui-mockups-in-plan-docs-principles-in-practice-and-scope),
exactly as the originating
salary-savings-calculator plan
does:

- **Tier 1 (low-fidelity)** — ASCII/Unicode wireframes inline, plus a `ui-<screen>-low-fi-alternatives.md`
  capturing the design-funnel divergence for each changed screen.
- **Tier 2 (high-fidelity)** — `assets/ui-<screen>-option-<x>-<name>.excalidraw.png` for the
  finalists, referenced from `tech-docs.md`/`delivery.md` via `./assets/...png` with descriptive alt
  text. Mobile, tablet, and desktop are all designed (mobile-first); a desktop-only mockup fails.
- **Grounding (R5)** — build every mockup from the existing `libs/web-ui` kit, the target app's
  shell/theme/i18n, and sibling screens; name any net-new component explicitly. Mockup colors use
  design-system tokens (`bg-primary`, `text-destructive`), never raw hex.

If **no** finding touches UI, the plan is non-UI and the `assets/` folder is omitted (the
convention's exemption for non-UI plans applies).

**plan-mode handling**:

- **new**: the full document set lands at `plans/in-progress/<plan-identifier>/`.
- **merge**: new findings are appended to `target-plan-path` by ID continuation (never renumber prior
  findings); prior findings are re-verified as STILL-PRESENT / FIXED with the result recorded; then
  `tech-docs.md`, `delivery.md`, and any `assets/` mockups are extended to cover the new findings.

**Output**: Complete plan document set under `plan-path`; `exploratory-findings-count`,
`usability-findings-count`, and `design-findings-count` tallied.

---
description: "Defines the grounding rule (R5) tying mockups to real data/components, and the design funnel (R6) process."
when_to_use: "Use when a mockup needs to be grounded in real data or components, or when running the diverge-narrow-select-justify design funnel."
---

# UI Mockups in Plan Docs: Grounding Rule and Design Funnel

## Grounding Rule (R5)

Before drafting **either** tier, the author MUST survey the existing UI in the related app(s) and
lib(s) and build the mockup from what is already there:

- **Shared kit** — `libs/web-ui`: the canonical component inventory (shadcn/ui + Radix + Tailwind),
  its design tokens, and its Storybook. Reuse real components (tabs, inputs, toggles, radio groups,
  combobox, badges, alerts, cards, table) and token-driven spacing and color instead of inventing
  visual language.
- **Target app** — the app's existing pages, layout shell, theme, and locale/i18n structure so the
  new screen matches the surrounding site.
- **Sibling screens** — any existing page the new screen should visually match.
- **Skill reference** — `developing-frontend-ui` documents token usage, component patterns, and
  the brand context to honour.

Any **net-new component** the mockup introduces MUST be named explicitly (for example the `Table`
primitive the salary-savings plan adds to `libs/web-ui`), so the build gap is visible before
development begins. This is rule 2 of the
[User-Facing Delivery Hardening Convention](../../../development/quality/user-facing-delivery-hardening.md).

**Mockup colors must use design-system tokens** (e.g., `bg-primary`, `text-destructive`), not raw
hex or CSS color values — raw values in mockups drift away from the implemented design. This is
rule 8 of the [User-Facing Delivery Hardening Convention](../../../development/quality/user-facing-delivery-hardening.md).

## Design Funnel (R6)

The both-tiers rule describes the **artefacts**. The **design funnel** is the process that produces
them. Low-fidelity is cheap, so design divergence happens there; high-fidelity is more expensive, so
only the shortlist receives that treatment. The funnel keeps the design space wide early and the
commitment explicit late.

Every stage of the funnel is visible in the plan. No alternative is silently discarded.

| Stage      | Fidelity | Count       | What lands in the plan                                                  |
| ---------- | -------- | ----------- | ----------------------------------------------------------------------- |
| 1. Diverge | Low-fi   | ≥ 2 (aim 3) | Named ASCII alternatives (Option A / B / C), genuinely different        |
| 2. Narrow  | Hi-fi    | 2 finalists | `.excalidraw.png` mockups of the two strongest; one-line drop reasons   |
| 3. Select  | —        | 1 (named)   | The chosen design, **named** (e.g. "Selected: Option A — Ranked Table") |
| 4. Justify | —        | 1 record    | Rationale: why the winner won, why each runner-up lost                  |

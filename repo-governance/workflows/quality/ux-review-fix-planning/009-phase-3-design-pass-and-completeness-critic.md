---
description: "Runs swe-web-tester (design charter) after Phase 2 integrates, then folds its DWT-### findings and SG-### design-spec proposals into the same plan, keeping all three sources in labelled sections."
when_to_use: "Use when checking what the design-aware tester is dispatched with, or how its findings stay attributed distinctly from the exploratory and usability sources."
---

# Phase 3 — Design Pass + Integrate

## 3. Design Pass + Integrate (Sequential, delegated)

Only after Phase 2 has integrated, run the design-aware tester and fold its results into the **same**
plan. Also passive / non-destructive.

**Agent**: `swe-web-tester` (design charter) — design-aware. Judges whether the **running** rendered page matches its
design and follows good design practice, against five ground-truth sources (committed plan-folder
mockups, design tokens/theme at runtime, design-system primitives `libs/web-ui`, an optional external
Figma/mockup source passed at invocation, and general design best-practice grounded by
`web-researcher`); produces a findings catalog `DWT-###` (mockup fidelity, runtime token/theme fidelity,
design-system-primitive reuse, visual hierarchy, alignment, spacing/density "not cramped", typography,
colour, cross-surface visual consistency) plus design-spec proposals `SG-###` (Gherkin for on-design
behaviours worth protecting). It is the **runtime** counterpart to `swe-reviewer`'s **static** source
audit and never audits component source.

- **Args**: same as Phase 1, plus an optional `design-source` (Figma link / mockup URL) when one is
  provided.
- **Output**: Returns its findings (README/brd/prd/findings/spec-gaps bodies) as structured text.

**Integrate**: Add a **separate** `## Design findings (DWT-###)` section to `findings.md`, merge the
design slice into README/brd/prd, and extend the cross-reference note flagging where an EWT, a UWT, and
a DWT describe the same underlying defect (e.g. a responsive issue all three touch) so the shared root
cause is fixed once. The three sources MUST remain in their own labelled sections — a reader must always
be able to tell an exploratory finding from a usability finding from a design finding. Carry the design
tester's `SG-###` design-spec proposals into the plan's spec coverage, kept distinct from the usability
`USS-###` suggestions.

**Success criteria**: All three findings sections present and source-attributed in one `findings.md`;
design `SG-###` proposals captured.
**On failure**: If the tester fails, record the gap prominently in the plan README and proceed to
solidification with the exploratory + usability perspectives — never silently drop a perspective.

Continued in [Phase 3.5 — Cross-Tester Completeness Critic](./010-phase-3-5-completeness-critic.md).

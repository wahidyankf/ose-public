---
description: "States the principles behind requiring visible UI design records in plan docs and the scope of that requirement."
when_to_use: "Use when you need to understand why plan docs must show UI design exploration, and which plans this applies to."
---

# UI Mockups in Plan Docs: Principles in Practice and Scope

This section governs how draft UI screens are represented inside plan documents (files under
`plans/`). It is part of the diagrams convention because plan UI mockups are a third visualization
category alongside Mermaid diagrams and ASCII art, and keeping them here avoids convention sprawl.

Originating plan: `plans/done/2026-06-16__plan-doc-ui-mockup-convention/`

## Principles in Practice (UI Mockups)

This section applies the convention's canonical principles (see the top-level
[Principles Implemented/Respected](./principles-implemented-respected.md)) to UI mockups specifically:

- **[Accessibility First](../../../principles/content/accessibility-first.md)**: ASCII wireframes
  render identically in every surface including screen readers and terminal output. Excalidraw PNG
  mockups bake in the design-system color palette and token-driven spacing for readers who rely on
  visual clarity.
- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**: Only
  two formats are approved. Ruled-out options are named explicitly so authors do not spend effort
  on approaches that fail on GitHub.
- **[Documentation First](../../../principles/content/documentation-first.md)**: Every UI-bearing
  plan must document the design exploration visibly — alternatives considered, selection made,
  rationale preserved — so later readers can trace why a layout was chosen.

## Scope

This section applies to **UI-bearing plans**: plans that add or change user-facing screens or
components under `apps/` or `libs/`. Pure refactors, non-UI plans, and governance-only changes
are exempt.

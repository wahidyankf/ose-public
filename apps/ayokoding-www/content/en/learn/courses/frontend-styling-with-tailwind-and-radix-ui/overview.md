---
title: "Overview"
date: 2026-10-25T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough TypeScript](../just-enough-typescript/learning/overview.md) (types,
  functions, and modules -- every runnable model in this course is a TypeScript file);
  [Frontend Essentials](../frontend-essentials/learning/overview.md) (basic CSS and React component
  ideas); [Advanced Frontend](../advanced-frontend/learning/overview.md) (component composition
  habits this course builds on). Every worked example is TypeScript and CSS using Tailwind CSS
  and Radix UI inside a React component, so all three priors earn their place from the first page.
- **Tools & environment**: Node.js with the pinned TypeScript toolchain (the harness runs every
  example with Node and no network); a text editor. No browser is needed: the runnable models
  check accessible roles, focus order, and keyboard behaviour as data, and the lesson text maps
  each model line to the real Tailwind class or Radix UI primitive prop it stands for.
- **Assumed knowledge**: basic CSS (selectors, the box model) and React component concepts
  (props, state, composition).

## Why this exists -- the big idea

**The problem before the solution**: teams style two ways and both drift. Hand-written CSS
spreads one-off values across stylesheets until no two buttons share a blue; a component
library ships pixels but locks the team into its look. Meanwhile accessible widgets --
dialogs that trap focus, menus that answer arrow keys, tabs that expose the right roles --
get rebuilt by hand, and every rebuild drops a keyboard behaviour the library primitives
already had. Tailwind CSS fixes the styling half with constrained utilities; Radix UI
fixes the behaviour half with unstyled primitives. Neither replaces the other, and the
composition of the two is its own skill.

**The one idea worth keeping if you forget everything else**: Tailwind styles the pixels;
Radix UI supplies the accessible behaviour. Reach for a Radix UI primitive before you
reach for a `<div>` with manual keyboard handlers, and express every visual choice as a
Tailwind utility drawn from the token set -- never as a custom value, never as a
reimplemented widget.

This course is **deliberately a composition course, not a CSS course**. General CSS
fundamentals and general accessibility live in `frontend-essentials` and
`advanced-frontend`; this course assumes them and teaches only the two libraries and
their joint: utility-first styling, token constraints, responsive and state variants,
four Radix UI primitives with their focus and keyboard contracts, Tailwind-on-Radix
composition, light and dark theming, and automated accessibility testing. The sixteen
concepts below are the whole vocabulary; every example names the ones it exercises, and
the drilling page makes you use each one twice.

## How this course is organized

- **[Learning](./learning/overview.md)** -- 48 worked examples in nine themes, each a
  runnable TypeScript model with its exact recorded output:
  - **Theme A -- [Utility-First Styling Basics](./learning/theme-a-utility-first-styling-basics.md)**
    (Examples 1-5) -- composing small utilities, the spacing scale, typographic utilities.
  - **Theme B -- [Design Tokens and Constraints](./learning/theme-b-design-tokens-and-constraints.md)**
    (Examples 6-10) -- reading tokens, the constrained palette, configuring the theme,
    blocking arbitrary values, auditing drift.
  - **Theme C -- [Responsive and State Variants](./learning/theme-c-responsive-and-state-variants.md)**
    (Examples 11-15) -- mobile-first breakpoints, responsive grids, hover and focus,
    dark-mode variants, disabled and ARIA states.
  - **Theme D -- [Radix UI Primitives Dialog and Dropdown](./learning/theme-d-radix-ui-primitives-dialog-and-dropdown.md)**
    (Examples 16-21) -- dialog anatomy, focus into the dialog, Escape to close, dropdown
    keyboard maps, controlled and uncontrolled state.
  - **Theme E -- [Radix UI Primitives Tabs and Tooltip](./learning/theme-e-radix-ui-primitives-tabs-and-tooltip.md)**
    (Examples 22-27) -- tabs anatomy, arrow-key navigation, tab panels and ARIA, tooltip
    delay and naming, tooltip keyboard behaviour, portal rendering.
  - **Theme F -- [Focus Management and Keyboard Patterns](./learning/theme-f-focus-management-and-keyboard-patterns.md)**
    (Examples 28-33) -- the focus-trap cycle, returning focus, menu typeahead,
    outside-dismiss, roving tabindex, nested-dialog focus stacks.
  - **Theme G -- [Composing Tailwind onto Radix Primitives](./learning/theme-g-composing-tailwind-onto-radix-primitives.md)**
    (Examples 34-38) -- styling through `className`, `asChild` forwarding, merging
    conditional classes, `data-state` attributes, state-driven animation.
  - **Theme H -- [Theming Light and Dark](./learning/theme-h-theming-light-and-dark.md)**
    (Examples 39-43) -- CSS variables as tokens, the class-strategy dark mode, a theme
    toggle, contrast checks, surface and text pairs.
  - **Theme I -- [Accessibility Testing](./learning/theme-i-accessibility-testing.md)**
    (Examples 44-48) -- role queries, scripted keyboard walkthroughs, focus-order
    assertions, accessible-name checks, the utility-CSS size budget.
  - **[Capstone](./learning/capstone/overview.md)** -- a small settings-panel UI (a dialog,
    a dropdown menu, and tabs) styled with Tailwind on Radix UI primitives, shipped with
    an automated accessibility and keyboard-behaviour test suite and a light and dark theme.

- **[Drilling](./drilling/overview.md)** -- recall questions, applied composition problems,
  five hands-on katas, a self-check checklist, and design trade-off prompts.

## What this course is not

General CSS (the cascade, specificity wars, selectors) lives in `frontend-essentials`;
general accessibility (contrast theory, screen-reader tours) lives in
`advanced-frontend`. This course assumes both and spends its pages on the two libraries:
Tailwind's utility and token model, Radix UI's unstyled primitives and their behaviour
contracts, and the composition rules that keep styled primitives accessible.

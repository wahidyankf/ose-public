---
title: "Learning Overview"
date: 2026-10-25T00:00:00+07:00
draft: false
weight: 1
---

Forty-eight worked examples in nine themes take the reader from the first utility
class to a tested, themed, composed interface. Each example pairs a short explanation
with a runnable TypeScript model, its exact recorded output, and the concept tags it
exercises: read the idea, run the model, check the transcript. Theme A (Examples 1-5)
composes utilities; Theme B (Examples 6-10) constrains them to tokens; Theme C
(Examples 11-15) varies them by width and state; Themes D and E (Examples 16-27)
introduce the four Radix UI primitives with their keyboard and focus contracts;
Theme F (Examples 28-33) systematizes focus and keyboard patterns; Theme G
(Examples 34-38) composes Tailwind onto the primitives; Theme H (Examples 39-43)
themes light and dark; Theme I (Examples 44-48) tests it all. The
[capstone](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/capstone/overview)
assembles a settings-panel UI from the same primitives with the same test suite.

## How to read an example

Every example follows the same five-part shape: the number and concept tags, a short
explanation naming the real construct, an optional diagram of the idea, the heavily
commented model, and the key takeaway. Each model runs on the pinned Node.js
toolchain with the pinned TypeScript toolchain and no network, against no fixtures
beyond its own source file, so every printed value on these pages is a genuine,
captured transcript, never a fabricated one. The models check accessible roles,
focus order, and keyboard behaviour as data -- there is no real browser in the
harness -- and the lesson text maps each model line to the real Tailwind class or
Radix UI primitive prop it stands for. When the text names a construct
(`data-[state=open]`, `asChild`, `aria-selected`), that construct is the production
behaviour the primitive or engine provides for real; paste the classes into a real
component and they do what the transcript shows. Each theme ends with a pointer to
the next, so the forty-eight examples form one path rather than nine islands:
utilities lead to tokens, tokens to variants, variants to primitives, primitives to
focus contracts, contracts to composition, composition to themes, themes to tests.

## Concept coverage

Sixteen concepts run through the 48 examples, each exercised by at least two examples
so no idea appears only once: co-01 utility-first styling (Examples 1-5); co-02
design token (Examples 4, 6-8, 39); co-03 responsive variant (Examples 11, 12); co-04
state variant (Examples 13-15, 37, 38, 40); co-05 design-system constraint (Examples
8-10); co-06 unstyled primitive (Examples 16, 19, 22, 25); co-07 accessible focus
management (Examples 17, 18, 28, 29, 31, 33, 46); co-08 keyboard-interaction pattern
(Examples 18, 19, 23, 26, 30, 32, 45); co-09 composition over configuration
(Examples 34, 35, 37, 38); co-10 portal rendering (Examples 27, 31, 33); co-11
controlled vs uncontrolled state (Examples 20, 21, 41); co-12 ARIA role and label
(Examples 15, 24, 25, 42, 47); co-13 class merging (Examples 36, 37); co-14 theming
(Examples 14, 39-43); co-15 accessibility testing (Examples 44-47); co-16
performance of utility CSS (Examples 3, 48). The concept list and source mapping
(Tailwind CSS and Radix UI documentation, the pinned Node and TypeScript toolchain)
live in the course syllabus.

## Examples by theme

### Theme A: utility-first styling basics

- [Worked Example 1: First Utility Classes](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-a-utility-first-styling-basics#worked-example-1-first-utility-classes) -- one utility, one declaration, zero new CSS.
- [Worked Example 2: Card From Utilities](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-a-utility-first-styling-basics#worked-example-2-card-from-utilities) -- layout, surface, and spacing in one sentence.
- [Worked Example 3: Utilities Beat Custom CSS](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-a-utility-first-styling-basics#worked-example-3-utilities-beat-custom-css) -- eight hand-written lines versus zero new rules.
- [Worked Example 4: Spacing Scale](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-a-utility-first-styling-basics#worked-example-4-spacing-scale) -- every spacing value is steps times 0.25rem.
- [Worked Example 5: Typography Utilities](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-a-utility-first-styling-basics#worked-example-5-typography-utilities) -- size, weight, and rhythm in three classes.

### Theme B: design tokens and constraints

- [Worked Example 6: Read a Design Token](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-b-design-tokens-and-constraints#worked-example-6-read-a-design-token) -- one name, one value, loud failure otherwise.
- [Worked Example 7: Constrained Palette](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-b-design-tokens-and-constraints#worked-example-7-constrained-palette) -- a closed list of legal colors.
- [Worked Example 8: Configure Theme Tokens](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-b-design-tokens-and-constraints#worked-example-8-configure-theme-tokens) -- extend with names, never with hex.
- [Worked Example 9: Block Arbitrary Values](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-b-design-tokens-and-constraints#worked-example-9-block-arbitrary-values) -- the linter closes the bracket-syntax hatch.
- [Worked Example 10: Token Drift Audit](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-b-design-tokens-and-constraints#worked-example-10-token-drift-audit) -- count the strangers, resolve each one.

### Theme C: responsive and state variants

- [Worked Example 11: Mobile-First Breakpoint](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-c-responsive-and-state-variants#worked-example-11-mobile-first-breakpoint) -- base everywhere, `md:` above 768px.
- [Worked Example 12: Responsive Grid](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-c-responsive-and-state-variants#worked-example-12-responsive-grid) -- one column, then three, same markup.
- [Worked Example 13: Hover and Focus States](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-c-responsive-and-state-variants#worked-example-13-hover-and-focus-states) -- pointer and keyboard each get a variant.
- [Worked Example 14: Dark-Mode Variant](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-c-responsive-and-state-variants#worked-example-14-dark-mode-variant) -- one `.dark` ancestor re-themes everything.
- [Worked Example 15: Disabled and ARIA States](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-c-responsive-and-state-variants#worked-example-15-disabled-and-aria-states) -- styling follows attributes.

### Theme D: Radix UI primitives dialog and dropdown

- [Worked Example 16: Dialog Anatomy](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-d-radix-ui-primitives-dialog-and-dropdown#worked-example-16-dialog-anatomy) -- seven parts, zero pixels.
- [Worked Example 17: Dialog Focus on Open](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-d-radix-ui-primitives-dialog-and-dropdown#worked-example-17-dialog-focus-on-open) -- focus moves inside, ticket kept.
- [Worked Example 18: Dialog Escape to Close](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-d-radix-ui-primitives-dialog-and-dropdown#worked-example-18-dialog-escape-to-close) -- close, then restore, in that order.
- [Worked Example 19: Dropdown Menu Keyboard Map](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-d-radix-ui-primitives-dialog-and-dropdown#worked-example-19-dropdown-menu-keyboard) -- six keys, wraparound, free with the primitive.
- [Worked Example 20: Controlled Dialog State](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-d-radix-ui-primitives-dialog-and-dropdown#worked-example-20-controlled-dialog-state) -- the parent owns open, every change announced.
- [Worked Example 21: Uncontrolled Default Open](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-d-radix-ui-primitives-dialog-and-dropdown#worked-example-21-uncontrolled-default-open) -- the primitive owns open, zero parent votes.

### Theme E: Radix UI primitives tabs and tooltip

- [Worked Example 22: Tabs Anatomy](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-e-radix-ui-primitives-tabs-and-tooltip#worked-example-22-tabs-anatomy) -- four parts, exactly one panel visible.
- [Worked Example 23: Tabs Arrow-Key Navigation](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-e-radix-ui-primitives-tabs-and-tooltip#worked-example-23-tabs-arrow-key-navigation) -- arrows move and select with wraparound.
- [Worked Example 24: Tabs Panels and ARIA](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-e-radix-ui-primitives-tabs-and-tooltip#worked-example-24-tabs-panels-and-aria) -- role, selection, and panel links.
- [Worked Example 25: Tooltip Delay and ARIA](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-e-radix-ui-primitives-tabs-and-tooltip#worked-example-25-tooltip-delay-and-aria) -- 700ms of patience, then a name.
- [Worked Example 26: Tooltip Keyboard Behaviour](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-e-radix-ui-primitives-tabs-and-tooltip#worked-example-26-tooltip-keyboard-behaviour) -- focus shows, Escape hides.
- [Worked Example 27: Portal Rendering](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-e-radix-ui-primitives-tabs-and-tooltip#worked-example-27-portal-rendering) -- overlays mount on body, clips cannot reach.

### Theme F: focus management and keyboard patterns

- [Worked Example 28: Focus Trap Cycle](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-f-focus-management-and-keyboard-patterns#worked-example-28-focus-trap-cycle) -- Tab wraps at both modal edges.
- [Worked Example 29: Return Focus on Close](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-f-focus-management-and-keyboard-patterns#worked-example-29-return-focus-on-close) -- three close paths, one restoration each.
- [Worked Example 30: Menu Typeahead Search](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-f-focus-management-and-keyboard-patterns#worked-example-30-menu-typeahead-search) -- first prefix match wins.
- [Worked Example 31: Focus Outside Dismiss](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-f-focus-management-and-keyboard-patterns#worked-example-31-focus-outside-dismiss) -- overlay press closes, inside never does.
- [Worked Example 32: Roving Tabindex Model](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-f-focus-management-and-keyboard-patterns#worked-example-32-roving-tabindex-model) -- one zero that follows the active member.
- [Worked Example 33: Nested Dialogs Focus Stack](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-f-focus-management-and-keyboard-patterns#worked-example-33-nested-dialogs-focus-stack) -- push on open, pop on close.

### Theme G: composing Tailwind onto Radix primitives

- [Worked Example 34: Style a Primitive with className](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-g-composing-tailwind-onto-radix-primitives#worked-example-34-style-a-primitive-with-classname) -- pixels in, behaviour untouched.
- [Worked Example 35: Forward className Through Slot](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-g-composing-tailwind-onto-radix-primitives#worked-example-35-forward-classname-through-slot) -- your element, its contract, zero wrappers.
- [Worked Example 36: Merge Conditional Classes](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-g-composing-tailwind-onto-radix-primitives#worked-example-36-merge-conditional-classes) -- last wins per group, rest survives.
- [Worked Example 37: data-state Attributes](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-g-composing-tailwind-onto-radix-primitives#worked-example-37-data-state-attributes) -- primitive state, styleable.
- [Worked Example 38: Animation Variants](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-g-composing-tailwind-onto-radix-primitives#worked-example-38-animation-variants) -- entrances by side, one shared exit.

### Theme H: theming light and dark

- [Worked Example 39: CSS Variables as Tokens](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-h-theming-light-and-dark#worked-example-39-css-variables-as-tokens) -- one variable, one value per theme.
- [Worked Example 40: Class-Strategy Dark Mode](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-h-theming-light-and-dark#worked-example-40-class-strategy-dark-mode) -- one `.dark` class, zero theme props.
- [Worked Example 41: Theme Toggle Component](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-h-theming-light-and-dark#worked-example-41-theme-toggle-component) -- flip and announce, atomically.
- [Worked Example 42: Contrast Check](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-h-theming-light-and-dark#worked-example-42-contrast-check) -- 4.5 is the line, in both themes.
- [Worked Example 43: Surface and Text Pairs](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-h-theming-light-and-dark#worked-example-43-surface-and-text-pairs) -- never ship a surface without its text.

### Theme I: accessibility testing

- [Worked Example 44: Role Query Test](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-i-accessibility-testing#worked-example-44-role-query-test) -- query meaning, never markup.
- [Worked Example 45: Keyboard Walkthrough Test](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-i-accessibility-testing#worked-example-45-keyboard-walkthrough-test) -- open, advance, restore in three keys.
- [Worked Example 46: Focus Order Assertion](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-i-accessibility-testing#worked-example-46-focus-order-assertion) -- tab order equals visual order.
- [Worked Example 47: Accessible Name Check](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-i-accessibility-testing#worked-example-47-accessible-name-check) -- label, text, then failure.
- [Worked Example 48: Utility CSS Size Budget](/en/learn/courses/frontend-styling-with-tailwind-and-radix-ui/learning/theme-i-accessibility-testing#worked-example-48-utility-css-size-budget) -- vocabulary-linear beats page-linear.

## References

- Tailwind CSS documentation -- [Tailwind CSS](https://tailwindcss.com/docs) (utility names, responsive and state variants, dark mode, and theme configuration re-verified there at writing time)
- Radix UI Primitives documentation -- [Radix UI](https://www.radix-ui.com/primitives) (dialog, dropdown menu, tabs, and tooltip parts, keyboard interactions, and controlled-state props re-verified there at writing time)
- W3C accessibility guidance -- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) (dialog, menu, tab, and tooltip keyboard patterns the primitives implement)
- Pinned toolchain -- Node.js 24 with the pinned TypeScript toolchain (the runtime every model in this course runs under; version-specific behaviour follows the toolchain pin)

---

← Previous: [Overview](../overview.md) · Next: [Theme A: Utility-First Styling Basics](./theme-a-utility-first-styling-basics.md) →

---
title: Design Tokens Convention
description: Conventions for CSS design tokens across frontend apps in the open-sharia-enterprise monorepo, covering structural shared tokens, per-app brand overrides, dark mode requirements, and Tailwind v4 integration.
category: explanation
subcategory: development/frontend
tags:
  - design-tokens
  - css
  - tailwind
  - theming
  - dark-mode
created: 2026-03-28
updated: 2026-03-28
---

# Design Tokens Convention

Design tokens are the named CSS custom properties that form the shared visual vocabulary across all frontend applications in the monorepo. This document defines which tokens exist, how to name and format them, how apps override shared values, and what to avoid.

## Scope Clarification: Docs Palette vs UI Colors

The [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md) defines a **5-color accessible palette** (`#0173B2`, `#DE8F05`, `#029E73`, `#CC78BC`, `#CA9161`) intended exclusively for documentation diagrams, Mermaid charts, and emoji categorization in `docs/` and `governance/`.

That palette does **not** govern UI application colors. Frontend apps may use any colors provided they meet WCAG AA contrast requirements:

- Normal text: **4.5:1** minimum contrast ratio against its background
- Large text (18 pt / 14 pt bold): **3:1** minimum
- UI components and graphical elements: **3:1** minimum

The `color-accessibility` convention remains the master reference for diagrams. This document governs token-based color decisions within app CSS.

## Token Categories

### Structural Tokens (Shared via `ts-ui-tokens`)

Structural tokens live in the `libs/ts-ui-tokens` library and are imported by every frontend app. They represent values that are layout- and brand-neutral — apps should not override them.

**Border radius**

```css
--radius: 0.5rem;
--radius-lg: 0.75rem;
--radius-md: 0.5rem;
--radius-sm: 0.25rem;
```

**Spacing (4-point system)**

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
```

**Typography scale**

```css
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.25rem;
```

**Base neutrals**

```css
--background: ...;
--foreground: ...;
--border: ...;
--input: ...;
--ring: ...;
```

**Semantic tokens**

```css
--muted: ...;
--muted-foreground: ...;
--destructive: ...;
--destructive-foreground: ...;
```

### Brand Tokens (Per-App Override)

Brand tokens express each app's visual identity. Apps define these in their own `globals.css` by overriding the defaults from `ts-ui-tokens`.

**Core brand palette**

```css
--primary: ...;
--primary-foreground: ...;
--secondary: ...;
--secondary-foreground: ...;
--accent: ...;
--accent-foreground: ...;
```

**App-specific extensions**

- `organiclever-fe`: chart tokens `--chart-1` through `--chart-5`
- `ayokoding-web`: sidebar tokens `--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`

## Naming Convention

The monorepo uses two token levels for Tailwind v4 integration.

**Bare HSL variable** — defined in `:root` and `.dark`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
}
```

**Tailwind theme alias** — defined in `@theme` block, consumes the bare variable:

```css
@theme {
  --color-primary: hsl(var(--primary));
}
```

The `--color-{name}` form is what Tailwind v4 resolves to utility classes like `bg-primary` and `text-primary-foreground`. The bare `--{name}` variable is the overridable value. Keep these two levels strictly separated — bare variables belong in `:root`/`.dark`, Tailwind aliases belong in `@theme`.

## Token Format: Two Current Approaches

The monorepo currently has two formatting approaches in production apps.

**Double indirection** (`organiclever-fe`):

```css
/* globals.css */
:root {
  --primary: 0 0% 9%;
}

@theme {
  --color-primary: hsl(var(--primary));
}
```

The bare variable holds only the HSL components (no `hsl()` wrapper), and the `@theme` alias wraps it.

**Direct value** (`ayokoding-web`):

```css
/* globals.css */
@theme {
  --color-primary: hsl(221.2 83.2% 53.3%);
}
```

The `@theme` alias holds the complete value directly.

**Recommended for `ts-ui-tokens`**: Use the direct value approach. It is simpler to read, easier to override via CSS cascade, and removes the indirection layer that double indirection introduces without measurable benefit. The shared library defines complete `hsl(...)` values; per-app overrides replace the `--color-*` alias in the app's own `@theme` block.

## Dark Mode Requirements

Every visual token must have a `.dark` counterpart. Omitting a dark-mode value causes the light-mode value to persist in dark contexts, which typically fails WCAG AA contrast.

```css
:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(221.2 83.2% 53.3%);
}

.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  --primary: hsl(217.2 91.2% 59.8%);
}
```

Register the dark variant in your Tailwind v4 config using:

```css
@custom-variant dark (&:is(.dark *));
```

Verify WCAG AA contrast (4.5:1 for text, 3:1 for components) independently in both light and dark modes. Do not assume that a passing light-mode contrast automatically satisfies dark mode.

## Per-App Override Pattern

An app imports the shared structural and semantic tokens, then declares its brand overrides in the same `globals.css`:

```css
/* apps/my-app/src/app/globals.css */
@import "@open-sharia-enterprise/ts-ui-tokens/tokens.css";

@theme {
  /* Brand override — replaces the shared default */
  --color-primary: hsl(221.2 83.2% 53.3%);
  --color-primary-foreground: hsl(0 0% 100%);
  --color-secondary: hsl(210 40% 96.1%);
  --color-secondary-foreground: hsl(222.2 47.4% 11.2%);
}
```

The CSS cascade ensures the app's `@theme` declarations take precedence over imported defaults. Structural tokens (`--radius`, spacing, typography) are not overridden — only brand tokens.

## Using Tokens in Tailwind Utilities

Reference tokens through Tailwind utility classes, never through raw CSS custom property access in component files.

```tsx
/* Correct */
<button className="bg-primary text-primary-foreground rounded-md px-4 py-2">
  Save
</button>

<p className="text-muted-foreground text-sm">Optional description</p>

<div className="border border-border bg-background">
  Content area
</div>
```

This keeps component code free of CSS property names and ensures the token layer is the single place to change values.

## When to Create a New Token

Use this decision rule before adding a token:

1. Is the value used in **3 or more places**? If no, use an existing token or a one-off value.
2. Does it represent a **semantic concept** (e.g., "sidebar background", "destructive action")? If no, it is likely a coincidental shared value — do not tokenize it.
3. Does an existing token already cover this semantic concept? If yes, use the existing token.

Only create a new token when all three conditions are met: repeated use, semantic meaning, and no existing token covers it. Tokenizing coincidental shared values creates false coupling between unrelated parts of the UI.

## Anti-Patterns

**Hardcoded hex values in component files**

```css
/* Wrong */
background-color: #f6f8fa;
color: #24292f;
```

These bypass the token system and break dark mode. Use `bg-muted` and `text-foreground` instead.

**`!important` on token definitions**

```css
/* Wrong */
:root {
  --primary: hsl(221.2 83.2% 53.3%) !important;
}
```

`!important` on custom properties prevents the CSS cascade from applying per-app overrides. Token composition depends on the cascade working correctly.

**Duplicating structural tokens in app `globals.css`**

```css
/* Wrong — do not copy-paste structural tokens from ts-ui-tokens */
:root {
  --radius: 0.5rem;
  --space-4: 1rem;
}
```

Import `ts-ui-tokens` and let the shared library own structural values. Duplicating them creates divergence risk when the shared library updates.

**Defining dark-mode values for only some tokens**

If a token appears in `:root`, it must also appear in `.dark`. Partial dark mode coverage creates inconsistent contrast and visual artifacts that are difficult to debug.

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Accessibility First](../../principles/content/accessibility-first.md)**: Every visual token requires a `.dark` counterpart and must meet WCAG AA contrast (4.5:1 text, 3:1 UI components) in both modes. Token-based theming makes contrast verification systematic rather than per-component.
- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Naming tokens by semantic role (`--primary`, `--muted-foreground`, `--destructive`) makes visual intent explicit. Raw hex values in components hide their meaning.
- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: The direct-value token format is preferred over double indirection. The per-app override pattern through CSS cascade avoids build-time configuration complexity.
- **[Immutability Over Mutability](../../principles/software-engineering/immutability.md)**: Structural tokens in `ts-ui-tokens` are not overridden by apps. Only brand tokens vary per app, preserving the shared visual contract.

## Conventions Implemented/Respected

This document implements the following conventions:

- **[Color Accessibility Convention](../../conventions/formatting/color-accessibility.md)**: Clarifies that the 5-color docs palette governs diagrams only. UI apps follow WCAG AA contrast rules using any colors appropriate to their brand.
- **[Indentation Convention](../../conventions/formatting/indentation.md)**: All CSS examples in this document use 2-space indentation per the project CSS standard.

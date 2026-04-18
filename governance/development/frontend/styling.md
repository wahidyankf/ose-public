---
title: Styling Convention
description: CSS and Tailwind v4 styling patterns for frontend applications in the open-sharia-enterprise monorepo
category: explanation
subcategory: development/frontend
tags:
  - styling
  - tailwind
  - css
  - responsive
  - mobile-first
created: 2026-03-28
updated: 2026-03-28
---

# Styling Convention

CSS and Tailwind v4 conventions for all frontend applications in the open-sharia-enterprise monorepo. These rules govern how styles are written, organized, and maintained across `organiclever-fe` and `ayokoding-web`.

## Tailwind v4 Directives

Each app's `globals.css` uses a specific set of Tailwind v4 directives. Use only the directives the app actually needs.

```css
/* Entry point — replaces v3's @tailwind base/components/utilities */
@import "tailwindcss";

/* Content scan path — required when files live outside the default scan root */
/* ayokoding-web uses this because source lives in a non-default location */
@source "../../src/**/*.{ts,tsx}";

/* Tailwind plugins */
/* ayokoding-web uses @tailwindcss/typography for prose content */
@plugin "@tailwindcss/typography";

/* Dark mode variant — class-based (.dark), not media-query-based */
@custom-variant dark (&:is(.dark *));

/* Design tokens — define custom CSS variables for Tailwind to consume */
@theme {
  --color-primary: hsl(221.2 83.2% 53.3%);
  --radius: 0.5rem;
}

/* Base styles — resets and body defaults ONLY */
@layer base {
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom utilities — single-purpose utility definitions */
@utility text-balance {
  text-wrap: balance;
}
```

See `apps/organiclever-fe/src/app/globals.css` and `apps/ayokoding-web/src/app/globals.css` for the full reference implementations.

## Utility-First Approach

Apply styles with Tailwind utility classes directly in TSX components. Do NOT write CSS rules for component styling.

```tsx
/* Correct — utility classes in TSX */
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-card p-6 shadow-sm">{children}</div>;
}
```

```css
/* Wrong — component styles in CSS */
.card {
  border-radius: 0.5rem;
  background: var(--card);
  padding: 1.5rem;
}
```

**Exceptions — CSS is correct in these cases:**

- `@layer base` in `globals.css` for reset and body defaults
- Specificity overrides needed to beat third-party library defaults (e.g., `@tailwindcss/typography` prose styles) — place these outside `@layer` so they win the cascade

## No `!important`

Never use `!important`. Use `@layer` ordering or Tailwind modifiers for specificity control instead.

```css
/* Wrong */
.prose pre {
  background-color: #f6f8fa !important;
}

/* Correct — place outside @layer to beat Tailwind defaults */
.prose pre {
  background-color: #f6f8fa;
}
```

**Known violation**: `ayokoding-web/src/app/globals.css` contains 10 `!important` declarations in code block styles to override `@tailwindcss/typography` defaults. These are scheduled for removal by replacing them with rules placed outside `@layer base`.

## No `@apply` Outside `@layer base`

Use `@apply` only inside `@layer base` for base/reset styles. Using `@apply` inside component styles defeats the utility-first approach and creates hidden CSS dependencies.

```css
/* Correct — @apply inside @layer base */
@layer base {
  body {
    @apply bg-background text-foreground;
  }
}

/* Wrong — @apply in component styles */
.my-button {
  @apply rounded-lg bg-primary px-4 py-2 text-white;
}
```

## No Inline `style={}` Props

Use Tailwind utilities instead of inline styles. Inline styles bypass the design token system and `prettier-plugin-tailwindcss` ordering.

```tsx
/* Wrong */
<div style={{ padding: "1rem", backgroundColor: "var(--card)" }}>

/* Correct */
<div className="bg-card p-4">
```

**Exception**: Apps migrating from a non-Tailwind baseline may use inline styles temporarily. Remove them before the migration is complete.

## Class Ordering

`prettier-plugin-tailwindcss` automatically sorts Tailwind classes into canonical order on save via the pre-commit hook. Do not sort classes manually.

For Tailwind v4, the plugin requires a `tailwindStylesheet` configuration option pointing to the app's `globals.css`:

```json
{
  "tailwindStylesheet": "./src/app/globals.css"
}
```

If classes appear unsorted after a save, verify that `tailwindStylesheet` points to the correct file for that app.

## Defensive CSS Patterns

Apply these patterns proactively to prevent layout breakage:

```tsx
/* Prevent content bleed from overflowing children */
<section className="overflow-hidden">

/* Prevent flex children from expanding past their container */
<div className="flex min-w-0 gap-4">
  <span className="min-w-0 truncate">Long title that might overflow</span>
</div>

/* Single-line text overflow with ellipsis */
<p className="truncate">Long text</p>

/* User-generated content that may contain long words or URLs */
<p className="break-words">User content here</p>
```

## Responsive Design — Mobile-First

Start with mobile styles (no breakpoint prefix) and layer larger screens with `md:` and `lg:`.

**Standard breakpoints:**

| Prefix | Min-width | Target  |
| ------ | --------- | ------- |
| (none) | 375px     | Mobile  |
| `md:`  | 768px     | Tablet  |
| `lg:`  | 1280px    | Desktop |

```tsx
/* Correct — mobile-first */
<div className="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">

/* Wrong — desktop-first (requires max-width overrides) */
<div className="flex flex-row gap-8 max-md:flex-col">
```

All components must render correctly at all three breakpoints. Test on a 375px viewport before considering a component complete.

**Prefer container queries** when a component's layout depends on the space available to it rather than the viewport width:

```tsx
<div className="@container">
  <div className="flex flex-col @md:flex-row">{/* Layout adapts to container width, not screen width */}</div>
</div>
```

## Touch Targets

Interactive elements (buttons, links, form controls) must have a minimum tap target of 44×44px on mobile viewports, per the [Accessibility First](../../principles/content/accessibility-first.md) principle.

```tsx
/* Correct — explicit minimum size */
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Submit
</button>

/* Correct — padding produces a large enough target */
<a className="block px-4 py-3 text-sm">
  Navigation link
</a>
```

Verify touch target sizes at the 375px breakpoint.

## No Content Hiding

Content must be accessible at all viewports. Never use `hidden` or `sr-only` to remove content on mobile — adapt the layout instead.

```tsx
/* Wrong — content removed on mobile */
<aside className="hidden md:block">
  <Navigation />
</aside>

/* Correct — layout adapts; content always present */
<aside className="w-full md:w-64">
  <Navigation />
</aside>
```

If a full sidebar cannot fit on mobile, move it into a slide-over drawer or an accordion — do not amputate it.

## Font Loading

Use `next/font` for all font loading. Do not declare `font-family` in CSS files.

```tsx
/* Correct — next/font in layout.tsx */
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

```css
/* Wrong — font-family in globals.css */
@layer utilities {
  body {
    font-family: Arial, Helvetica, sans-serif;
  }
}
```

**Known violation**: `organiclever-fe/src/app/globals.css` declares `font-family: Arial, Helvetica, sans-serif` inside `@layer utilities`. This is scheduled for removal in favour of a `next/font` declaration in the app's root layout.

## Fluid Typography

Use `clamp()` or Tailwind responsive font-size utilities for text that must scale between breakpoints.

```tsx
/* Tailwind responsive utilities — simple and sufficient for most cases */
<h1 className="text-2xl md:text-4xl lg:text-5xl font-bold">

/* clamp() — for smooth scaling without breakpoint jumps */
<h1 style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)" }}>
```

Prefer Tailwind responsive utilities for headings and body text. Reserve `clamp()` for display text or hero headings where smooth scaling matters.

## Applying the Implementation Workflow

Follow the three-stage [Implementation Workflow](../workflow/implementation.md) when building or refactoring styles:

1. **Make it work** — Apply utility classes directly in TSX. Hard-code values if it gets you to a working component faster.
2. **Make it right** — Extract repeated class combinations into a shared component or a `cva` variant definition. Move one-off overrides out of inline styles and into utilities.
3. **Make it fast** — Audit and remove unused design tokens; eliminate `!important` overrides; consolidate duplicate `@layer base` blocks.

Do not extract patterns in Stage 1. Copy-pasting class strings across components is acceptable while the design is still evolving.

## Principles Implemented/Respected

- [Accessibility First](../../principles/content/accessibility-first.md) — Touch target minimums, no hidden content, and WCAG AA contrast requirements (via design tokens) all enforce this principle directly.
- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) — Utility-first styling keeps style logic in one place (the TSX file) and avoids abstract CSS class hierarchies.
- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) — `@theme` tokens, `@custom-variant dark`, and `prettier-plugin-tailwindcss` ordering make every styling decision visible and auditable.

## Conventions Implemented/Respected

- [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md) — Design token values must meet the WCAG AA contrast ratios defined there. The `@theme` block is the authoritative place to enforce this.
- [Indentation Convention](../../conventions/formatting/indentation.md) — All CSS and TSX code examples in this document use 2-space indentation (language-appropriate for CSS and TypeScript/JSX).

---

**Last Updated**: 2026-03-28

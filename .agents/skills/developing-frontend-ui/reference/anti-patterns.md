# Anti-Patterns Catalog

13 repo-specific UI anti-patterns with severity, codebase examples, and correct approach.

## AP1: Hardcoded Hex in CSS

**Severity**: HIGH

```css
/* WRONG — ayokoding-web globals.css */
.prose pre {
  background-color: #f6f8fa !important;
}

/* CORRECT */
.prose pre {
  background-color: var(--color-muted);
}
```

## AP2: !important in Tailwind Context

**Severity**: HIGH — use @layer specificity instead

## AP3: Font via CSS font-family

**Severity**: MEDIUM — use next/font instead

## AP4: Old Radix Individual Package Imports

**Severity**: MEDIUM — use unified radix-ui package, Slot.Root

## AP5: React.forwardRef Pattern

**Severity**: MEDIUM — use React.ComponentProps instead

## AP6: Missing data-slot Attribute

**Severity**: MEDIUM — add data-slot on root element

## AP7: Inline Styles in Production

**Severity**: MEDIUM — use Tailwind utilities

## AP8: Nested Card Inside Card

**Severity**: LOW — use spacing/dividers

## AP9: Color-Only Status Indicator

**Severity**: HIGH — include text label and shape

## AP10: Unverified Color Contrast

**Severity**: HIGH — use semantic tokens with verified contrast

## AP11: focus: Instead of focus-visible

**Severity**: MEDIUM — keyboard-only focus rings

## AP12: transition-all

**Severity**: LOW — specify explicit properties

## AP13: Bounce/Elastic Easing

**Severity**: LOW — use ease-out or cubic-bezier

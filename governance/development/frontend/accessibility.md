---
title: Accessibility Convention
description: WCAG AA requirements for UI components — focus management, ARIA attributes, reduced motion, form controls, and keyboard navigation for frontend applications
category: explanation
subcategory: development/frontend
tags:
  - accessibility
  - wcag
  - a11y
  - aria
  - focus
created: 2026-03-28
---

# Accessibility Convention

Frontend accessibility requirements for all UI applications in the open-sharia-enterprise monorepo. These requirements implement the [Accessibility First](../../principles/content/accessibility-first.md) principle at the component and interaction layer.

## Governing Principle

The [Accessibility First](../../principles/content/accessibility-first.md) principle establishes WCAG AA compliance as the **minimum standard** — built in from day one, not retrofitted. Every interactive element, every form, every motion effect, and every color decision must satisfy this baseline.

## Scope Clarification

The [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md) defines a 5-color palette that applies exclusively to **documentation** (Mermaid diagrams, charts, visual aids in `docs/` and `governance/`). UI applications are **not** restricted to that palette. Frontend apps may use any colors, design tokens, or brand colors provided they meet the WCAG AA contrast requirements in this document and avoid encoding information through color alone.

## WCAG AA Minimum Requirements

All UI components must satisfy these contrast ratios:

| Text / Element Type                          | Minimum Contrast |
| -------------------------------------------- | ---------------- |
| Normal text (below 18px regular, 14px bold)  | 4.5:1            |
| Large text (18px+ regular or 14px+ bold)     | 3:1              |
| UI components (inputs, buttons, focus rings) | 3:1              |
| Graphical objects that convey meaning        | 3:1              |

Verify contrast ratios with [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) before merging any new color values.

**Preferred algorithm**: APCA (Accessible Perceptual Contrast Algorithm) is preferred over WCAG 2.0 for perceptual accuracy on modern displays. When tooling supports it (e.g., Figma APCA plugin, Polychrome), use APCA. WCAG AA (4.5:1 / 3:1) remains the enforceable floor.

## Focus Management

Every interactive element must be reachable via Tab and activatable via Enter or Space.

**Use `focus-visible`, not `focus`**. The `focus` pseudo-class shows a focus ring on mouse click, which is visually noisy and not needed for pointer users. `focus-visible` limits the ring to keyboard navigation only.

```tsx
// Tailwind — correct focus ring pattern
<button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none">
  Submit
</button>
```

```tsx
// Tailwind — wrong: shows ring on mouse click too
<button className="focus:ring-2 focus:ring-blue-500">Submit</button>
```

Focus rings must meet 3:1 contrast against the adjacent background. Use `ring-offset-2` to create separation from the element's own background, especially on dark surfaces.

## Reduced Motion

Honor the `prefers-reduced-motion` media query. Users who configure this setting experience vestibular disorders or motion sensitivity — ignoring the preference causes real harm.

```tsx
// Tailwind — disable animation for reduced-motion users
<div className="animate-spin motion-reduce:animate-none" />

// Tailwind — simplify transition instead of removing entirely
<div className="transition-all duration-300 motion-reduce:transition-none" />
```

```css
/* CSS — for custom keyframe animations outside Tailwind */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    transition: none;
  }
}
```

Remove or simplify animations; do not merely slow them down. A slow animation is still motion.

## ARIA Attributes by Component Type

| Component        | Required ARIA                                                             | Notes                                                         |
| ---------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Button           | `aria-label` (icon-only), `aria-disabled`, `aria-pressed` (toggles)       | Never use `div` or `span` as a button without `role="button"` |
| Dialog / Modal   | `aria-modal="true"`, `aria-labelledby`, `aria-describedby`                | Requires focus trap; return focus to trigger on close         |
| Input / Textarea | `aria-invalid`, `aria-describedby` (error message id), `aria-required`    | `aria-invalid="true"` only when validation has run and failed |
| Menu / Dropdown  | `aria-expanded`, `aria-haspopup="menu"`, `role="menu"`, `role="menuitem"` | Arrow keys must navigate items; Escape closes                 |
| Tooltip          | `role="tooltip"`, `aria-describedby` on trigger element                   | Must be visible on keyboard focus, not hover only             |
| Tab List         | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`          | Arrow keys switch tabs; Tab moves into panel                  |
| Progress         | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`   | Include `aria-label` if no visible label present              |

```tsx
// Icon-only button — requires aria-label
<button aria-label="Close dialog" className="...">
  <XIcon aria-hidden="true" />
</button>

// Toggle button — aria-pressed reflects state
<button aria-pressed={isActive} className="...">
  Bold
</button>

// Input with validation error
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
    aria-required
  />
  {hasError && (
    <span id="email-error" role="alert">
      Enter a valid email address
    </span>
  )}
</div>
```

## Form Input Requirements

Every `<input>`, `<select>`, and `<textarea>` requires a visible `<label>` element linked via matching `htmlFor` / `id` pair. Placeholder text does not substitute for a label — placeholders disappear on input and have insufficient contrast in many browsers.

```tsx
// Correct — visible label linked to input
<label htmlFor="username">Username</label>
<input id="username" type="text" autoComplete="username" />

// Wrong — placeholder as label substitute
<input type="text" placeholder="Username" />
```

Add `autoComplete` for common fields to support password managers and autofill:

| Field        | `autoComplete` value |
| ------------ | -------------------- |
| Full name    | `name`               |
| Email        | `email`              |
| Phone        | `tel`                |
| Street       | `address-line1`      |
| City         | `address-level2`     |
| Postal code  | `postal-code`        |
| New password | `new-password`       |

Add `inputMode` for mobile keyboards to show the appropriate input type:

```tsx
<input inputMode="numeric" pattern="[0-9]*" /> // number pad
<input inputMode="email" type="email" />        // email keyboard
<input inputMode="tel" type="tel" />            // phone keyboard
<input inputMode="url" type="url" />            // url keyboard
```

## Hit Targets

Interactive elements must meet minimum touch target sizes:

- **Desktop**: 24 × 24 px minimum (WCAG 2.2 Target Size, Level AA)
- **Mobile viewports** (≤768px): 44 × 44 px minimum

Use padding to extend hit area without changing visual size:

```tsx
// Icon button — padding extends hit target to 44px on mobile
<button className="p-2 md:p-1">
  <SearchIcon className="h-5 w-5" aria-hidden="true" />
</button>
```

Verify actual rendered sizes in browser DevTools before merging compact UI components.

## No Color-Only Indicators

Status, errors, warnings, and success states MUST include text labels and/or distinct shapes. Never rely on color alone — approximately 8% of males cannot distinguish red from green.

```tsx
// Correct — color + icon + text label
<span className="text-amber-700 flex items-center gap-1">
  <WarningIcon aria-hidden="true" />
  Incomplete — missing required fields
</span>

// Wrong — color alone conveys error state
<span className="text-red-500">3 errors</span>
```

For status badges, combine background color with a text label or icon:

```tsx
// Correct — shape (badge) + text + color
<Badge variant="destructive">Failed</Badge>
<Badge variant="success">Published</Badge>

// Wrong — colored dot only
<span className="h-2 w-2 rounded-full bg-red-500" />
```

## Image Accessibility

- **Informative images**: Write descriptive `alt` text that conveys the image's meaning, not just its appearance. Include text visible in the image if it is not already in surrounding content.
- **Decorative images**: Use `alt=""` so screen readers skip them. Never omit the `alt` attribute entirely.
- **Complex diagrams**: Supplement with a text summary below the image or via `aria-describedby`.

```tsx
// Informative image
<img
  src="/charts/revenue.png"
  alt="Bar chart showing Q1–Q4 revenue with Q3 peak at $2.4M"
/>

// Decorative image
<img src="/decorations/wave.svg" alt="" />
```

## Screen Reader Compatibility

- DOM order must match visual reading order. CSS `order`, `flex-direction: row-reverse`, and absolute positioning can create mismatches — verify with a screen reader.
- Link text must describe the destination, not the action. Use "View invoice INV-2025-001" not "Click here".
- Provide skip navigation for layouts with repeated headers or sidebars:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2"
>
  Skip to main content
</a>
```

- Use `aria-live="polite"` for dynamic content updates (toast notifications, form validation results) so screen readers announce changes without interrupting the user.

## Keyboard Navigation

All interactive elements must follow these keyboard interaction patterns:

| Key        | Behavior                                           |
| ---------- | -------------------------------------------------- |
| Tab        | Move focus forward through interactive elements    |
| Shift+Tab  | Move focus backward                                |
| Enter      | Activate button, follow link, submit form          |
| Space      | Activate button, toggle checkbox                   |
| Escape     | Dismiss dialog, close dropdown, cancel action      |
| Arrow keys | Navigate within menus, tabs, radio groups, sliders |
| Home/End   | Move to first/last item in a list or menu          |

Dialogs require a **focus trap**: Tab and Shift+Tab must cycle only within the dialog while it is open. Return focus to the triggering element when the dialog closes.

## Principles Implemented/Respected

- [Accessibility First](../../principles/content/accessibility-first.md) — This entire convention exists to implement WCAG AA compliance, keyboard navigation, screen reader support, and inclusive design as mandatory requirements, not optional enhancements.
- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) — ARIA attributes, `htmlFor`/`id` associations, `autoComplete`, and `inputMode` values must be stated explicitly in markup; no implicit browser inference is sufficient.
- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) — Use native HTML elements (`<button>`, `<input>`, `<select>`) over custom implementations where possible. Native elements come with accessibility semantics built in.

## Conventions Implemented/Respected

- [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md) — WCAG AA contrast ratios referenced in this document align with the ratios defined there. That convention is the authoritative source for color-blind friendly palette guidance (for docs); this convention extends the same contrast standards to UI application colors.
- [Indentation Convention](../../conventions/formatting/indentation.md) — All TypeScript/TSX code examples use 2-space indentation per the project standard.

## Related Documentation

- [Design Tokens Convention](./design-tokens.md) — Token naming and dark mode requirements that underpin accessible color choices
- [Component Patterns Convention](./component-patterns.md) — CVA variants and Radix composition patterns that expose accessibility props
- [Accessibility First Principle](../../principles/content/accessibility-first.md) — Governing principle with rationale and moral context
- [Color Accessibility Convention](../../conventions/formatting/color-accessibility.md) — Master reference for color palette and contrast (docs scope)
- [WCAG 2.2 Level AA](https://www.w3.org/WAI/WCAG22/quickref/) — International accessibility standard
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — Verify contrast ratios

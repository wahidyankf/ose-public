---
title: "Overview"
weight: 10000000
date: 2026-03-25T00:00:00+07:00
draft: false
description: "Learn Tailwind CSS through 80 heavily annotated code examples achieving 95% coverage of utility classes, responsive design, customization, and production patterns"
tags: ["tailwindcss", "css", "frontend", "styling", "tutorial", "by-example"]
---

**Want to learn Tailwind CSS through code?** This by-example tutorial provides 80 heavily annotated examples covering 95% of Tailwind CSS. Master utility-first styling, responsive design, customization, and production patterns through working HTML rather than lengthy explanations.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the Tailwind concept
2. **How it works** - A focused, heavily commented code example
3. **Key Takeaway** - A pattern summary highlighting the key takeaway
4. **Why It Matters** - Production context, when to use, deeper significance

This approach works best when you already understand HTML and CSS fundamentals. You learn Tailwind's utility model, responsive system, and customization options by studying real code rather than theoretical descriptions.

## What Is Tailwind CSS?

Tailwind CSS is a **utility-first CSS framework** that provides low-level utility classes for building custom designs directly in HTML. Key distinctions:

- **Not a component library**: Tailwind provides utilities, not pre-built components like Bootstrap
- **Utility-first**: Apply single-purpose classes directly in HTML rather than writing custom CSS
- **Responsive by default**: Every utility has responsive variants (sm:, md:, lg:, xl:, 2xl:)
- **Highly customizable**: Configure design tokens (colors, spacing, typography) in tailwind.config.js or CSS-first in v4
- **JIT engine**: Generates only the CSS you actually use, keeping bundle sizes minimal

## Learning Path

```mermaid
graph TD
  accTitle: Learning Path
  accDescr: Graph with 5 nodes and 4 connections. Nodes: Beginner Core Utilities Examples 1-28, Intermediate Production Patterns Examples 29-55, Advanced Expert Mastery Examples 56-80, 0 No Tailwind Knowledge, 95 Framework Mastery. Connections: Beginner Core Utilities Examples 1-28 to Intermediate Production Patterns Examples 29-55, Intermediate Production Patterns Examples 29-55 to Advanced Expert Mastery Examples 56-80, 0 No Tailwind Knowledge to Beginner Core Utilities Examples 1-28, Advanced Expert Mastery Examples 56-80 to 95 Framework Mastery.
  A["Beginner<br/>Core Utilities<br/>Examples 1-28"] --> B["Intermediate<br/>Production Patterns<br/>Examples 29-55"]
  B --> C["Advanced<br/>Expert Mastery<br/>Examples 56-80"]
  D["0%<br/>No Tailwind<br/>Knowledge"] -.-> A
  C -.-> E["95%<br/>Framework Mastery"]

  classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  class A pal-0173B2
  classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
  class B pal-DE8F05
  classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  class C pal-029E73
  classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
  class D pal-CC78BC
  class E pal-029E73
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Coverage Philosophy: 95% Through 80 Examples

The **95% coverage** means you'll understand Tailwind CSS deeply enough to build production user interfaces with confidence. It doesn't mean you'll know every edge case or plugin—those come with experience.

The 80 examples are organized progressively:

- **Beginner (Examples 1-28)**: Foundation utilities (typography, spacing, sizing, colors, flexbox, grid, responsive design, states)
- **Intermediate (Examples 29-55)**: Production patterns (custom configuration, dark mode, animations, @apply, arbitrary values, group/peer modifiers, gradients)
- **Advanced (Examples 56-80)**: Expert mastery (plugins, design systems, Tailwind v4 CSS-first config, JIT internals, performance, accessibility, migration patterns)

Together, these examples cover **95% of what you'll use** in production Tailwind CSS applications.

## Annotation Density: 1-2.25 Comments Per Code Line

**CRITICAL**: All examples maintain **1-2.25 comment lines per code line PER EXAMPLE** to ensure deep understanding.

**What this means**:

- Simple lines get 1 annotation explaining what the utility class does
- Complex lines get 2+ annotations explaining behavior, responsive breakpoints, and design intent
- Use `<!-- => -->` notation in HTML to show what each class produces

**Example**:

```html
<!-- => Card container with shadow and rounded corners -->
<div class="max-w-sm rounded-xl bg-white p-6 shadow-lg">
  <!-- => bg-white: background-color: #ffffff -->
  <!-- => shadow-lg: box-shadow with larger spread -->
  <!-- => rounded-xl: border-radius: 0.75rem -->
  <!-- => p-6: padding: 1.5rem on all sides -->
  <!-- => max-w-sm: max-width: 24rem (384px) -->

  <!-- => Heading with large bold blue text -->
  <h2 class="text-2xl font-bold text-blue-600">
    <!-- => text-2xl: font-size: 1.5rem, line-height: 2rem -->
    <!-- => font-bold: font-weight: 700 -->
    <!-- => text-blue-600: color: #2563eb -->
    Card Title
  </h2>
</div>
```

This density ensures each example is self-contained and fully comprehensible without external documentation.

## Structure of Each Example

All examples follow a consistent five-part format:

````
### Example N: Descriptive Title

2-3 sentence explanation of the concept.

```html
<!-- Heavily annotated HTML example -->
<!-- showing the Tailwind pattern in action -->
```

**Key Takeaway**: 1-2 sentence summary.

**Why It Matters**: 50-100 words explaining significance in production applications.
````

**Code annotations**:

- `<!-- => -->` shows what each Tailwind class produces (CSS property: value)
- Inline comments explain design intent and when to use each utility
- Class names are self-documenting
- Responsive variants show breakpoint behavior

## What's Covered

### Core Utilities

- **Typography**: font-size, font-weight, text-color, text-align, line-height, letter-spacing
- **Spacing**: padding, margin, gap (all sides, directional, responsive)
- **Sizing**: width, height, min/max constraints, aspect-ratio
- **Colors**: background colors, text colors, border colors, opacity variants

### Layout System

- **Flexbox**: flex, flex-direction, justify-content, align-items, flex-wrap, flex-grow/shrink
- **Grid**: grid-cols, grid-rows, col-span, row-span, grid-flow, place-items
- **Positioning**: relative, absolute, fixed, sticky, inset, z-index
- **Display**: block, inline, inline-block, hidden, flex, grid

### Responsive Design

- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- **Mobile-first**: Default styles apply mobile, breakpoint prefixes apply upward
- **Responsive utilities**: Any utility can have a responsive variant

### Interactive States

- **Pseudo-classes**: hover:, focus:, active:, disabled:, visited:
- **Focus-visible**: Keyboard navigation accessibility
- **Group hover**: Parent-triggered child state changes

### Customization

- **tailwind.config.js**: Extending theme with custom values
- **Custom colors**: Design token integration
- **CSS variables**: Dynamic theming with CSS custom properties
- **@apply**: Extracting repeated utility combinations

### Advanced Patterns

- **Dark mode**: class strategy for controlled dark mode
- **Animations**: transition, animate-\*, custom keyframes
- **Gradients**: bg-gradient-to-_, from-_, via-_, to-_ utilities
- **Ring utilities**: focus rings, outline management
- **Arbitrary values**: [value] syntax for one-off styles

### Production Patterns

- **Component extraction**: When to extract vs inline utilities
- **Design systems**: Consistent tokens, spacing scales, color palettes
- **Performance**: Purging unused CSS, bundle size optimization
- **Tailwind v4**: CSS-first configuration, @theme directive

## What's NOT Covered

We exclude topics that belong in specialized tutorials:

- **Headless UI**: Pre-built accessible components (separate tutorial)
- **shadcn/ui deep dive**: Component library internals (brief integration overview only)
- **PostCSS internals**: Build tooling configuration details
- **CSS-in-JS**: Emotion, styled-components (different paradigm)
- **CSS animations deep dive**: Animation libraries like Framer Motion

For these topics, see dedicated tutorials and library documentation.

## Prerequisites

### Required

- **HTML fundamentals**: HTML structure, semantic elements, class attributes
- **CSS basics**: Box model, display properties, positioning, basic selectors
- **Web development experience**: You've built web pages before

### Recommended

- **Responsive design concepts**: Media queries, mobile-first thinking
- **Design fundamentals**: Spacing scales, color systems, typography basics
- **Modern tooling**: npm/yarn basics, command-line usage

### Not Required

- **Advanced CSS**: Flexbox/grid expertise (Tailwind makes these easy)
- **CSS preprocessors**: Sass/Less experience not needed
- **JavaScript**: Not required for beginner examples (needed for advanced patterns)

## Getting Started

Before starting the examples, ensure you have a basic setup:

```bash
# Install Tailwind CSS in a project
npm install -D tailwindcss
npx tailwindcss init

# Or use a CDN for quick experimentation (not for production)
# Add to HTML <head>:
# <script src="https://cdn.tailwindcss.com"></script>
```

For quick experimentation, the [Tailwind CSS Play](https://play.tailwindcss.com) environment lets you run examples without any local setup.

## How to Use This Guide

### 1. Choose Your Starting Point

- **New to Tailwind?** Start with Beginner (Example 1)
- **CSS framework experience** (Bootstrap, Bulma)? Start with Intermediate (Example 29)
- **Building specific feature?** Search for relevant example topic

### 2. Read the Example

Each example has five parts:

- **Explanation** (2-3 sentences): What Tailwind concept, why it exists, when to use it
- **Code** (heavily commented): Working HTML showing the pattern with class-by-class annotations
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern
- **Why It Matters** (50-100 words): Production context and deeper significance

### 3. Run the Code

Paste each example into [Tailwind CSS Play](https://play.tailwindcss.com) to see results instantly, or run locally:

```bash
# Quick local test with CDN
# Create index.html with <script src="https://cdn.tailwindcss.com"></script>
# Open in browser
```

### 4. Modify and Experiment

Change utility classes, add responsive variants, swap colors. Experimentation builds intuition faster than reading.

### 5. Reference as Needed

Use this guide as a reference when building UIs. Search for relevant examples and adapt utility patterns to your code.

## Ready to Start?

Choose your learning path:

- **Beginner** - Start here if new to Tailwind. Build foundation understanding through 28 core utility examples.
- **Intermediate** - Jump here if you know Tailwind basics. Master production patterns through 27 examples.
- **Advanced** - Expert mastery through 25 advanced examples covering plugins, design systems, and Tailwind v4.

Or jump to specific topics by searching for relevant example keywords (flexbox, grid, responsive, dark mode, animations, etc.).

## Examples by Level

### Beginner (Examples 1–28)

- [Example 1: Your First Tailwind Element](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-1-your-first-tailwind-element)
- [Example 2: Inline Styles vs Utility Classes](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-2-inline-styles-vs-utility-classes)
- [Example 3: Font Size and Weight](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-3-font-size-and-weight)
- [Example 4: Text Color](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-4-text-color)
- [Example 5: Text Alignment and Decoration](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-5-text-alignment-and-decoration)
- [Example 6: Line Height and Letter Spacing](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-6-line-height-and-letter-spacing)
- [Example 7: Padding](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-7-padding)
- [Example 8: Margin](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-8-margin)
- [Example 9: Space Between and Gap](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-9-space-between-and-gap)
- [Example 10: Width and Height](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-10-width-and-height)
- [Example 11: Min/Max Constraints and Screen Sizes](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-11-minmax-constraints-and-screen-sizes)
- [Example 12: Background Colors and Opacity](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-12-background-colors-and-opacity)
- [Example 13: Borders and Divide](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-13-borders-and-divide)
- [Example 14: Border Radius](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-14-border-radius)
- [Example 15: Flex Container Basics](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-15-flex-container-basics)
- [Example 16: Flex Alignment and Justify](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-16-flex-alignment-and-justify)
- [Example 17: Flex Grow, Shrink, and Wrap](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-17-flex-grow-shrink-and-wrap)
- [Example 18: CSS Grid Basics](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-18-css-grid-basics)
- [Example 19: Grid Template Areas and Auto-Fit](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-19-grid-template-areas-and-auto-fit)
- [Example 20: Mobile-First Responsive Prefixes](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-20-mobile-first-responsive-prefixes)
- [Example 21: Responsive Padding, Spacing, and Typography](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-21-responsive-padding-spacing-and-typography)
- [Example 22: Hover and Focus States](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-22-hover-and-focus-states)
- [Example 23: Disabled and Visited States](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-23-disabled-and-visited-states)
- [Example 24: Focus-Visible and Focus-Within](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-24-focus-visible-and-focus-within)
- [Example 25: Display Utilities](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-25-display-utilities)
- [Example 26: Position and Z-Index](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-26-position-and-z-index)
- [Example 27: Overflow Control](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-27-overflow-control)
- [Example 28: Cursor and Pointer Events](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/beginner#example-28-cursor-and-pointer-events)

### Intermediate (Examples 29–55)

- [Example 29: tailwind.config.js Structure](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-29-tailwindconfigjs-structure)
- [Example 30: Custom Colors and Design Tokens](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-30-custom-colors-and-design-tokens)
- [Example 31: Custom Fonts and Typography Scale](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-31-custom-fonts-and-typography-scale)
- [Example 32: Dark Mode with Class Strategy](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-32-dark-mode-with-class-strategy)
- [Example 33: Dark Mode with System Preference Detection](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-33-dark-mode-with-system-preference-detection)
- [Example 34: Transition Utilities](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-34-transition-utilities)
- [Example 35: Transform Utilities](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-35-transform-utilities)
- [Example 36: Tailwind Animation Classes](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-36-tailwind-animation-classes)
- [Example 37: Extracting Component Classes with @apply](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-37-extracting-component-classes-with-apply)
- [Example 38: @layer Directive and CSS Cascade Management](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-38-layer-directive-and-css-cascade-management)
- [Example 39: Arbitrary Value Syntax](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-39-arbitrary-value-syntax)
- [Example 40: CSS Variables in Arbitrary Values](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-40-css-variables-in-arbitrary-values)
- [Example 41: Group Modifier](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-41-group-modifier)
- [Example 42: Peer Modifier](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-42-peer-modifier)
- [Example 43: Linear Gradients](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-43-linear-gradients)
- [Example 44: Ring Utilities for Focus and Outlines](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-44-ring-utilities-for-focus-and-outlines)
- [Example 45: Aspect Ratio Utilities](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-45-aspect-ratio-utilities)
- [Example 46: Object Fit and Object Position](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-46-object-fit-and-object-position)
- [Example 47: Prose Utility (Typography Plugin)](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-47-prose-utility-typography-plugin)
- [Example 48: Responsive Visibility and Show/Hide Patterns](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-48-responsive-visibility-and-showhide-patterns)
- [Example 49: Shadow Utilities](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-49-shadow-utilities)
- [Example 50: Scroll Behavior and Snap](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-50-scroll-behavior-and-snap)
- [Example 51: Alert and Badge Components](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-51-alert-and-badge-components)
- [Example 52: Form Input Styling](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-52-form-input-styling)
- [Example 53: Loading and Skeleton States](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-53-loading-and-skeleton-states)
- [Example 54: Dropdown and Popover Positioning](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-54-dropdown-and-popover-positioning)
- [Example 55: Modal/Dialog Overlay Pattern](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/intermediate#example-55-modaldialog-overlay-pattern)

### Advanced (Examples 56–80)

- [Example 56: Writing a Custom Plugin](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-56-writing-a-custom-plugin)
- [Example 57: Plugin with Dynamic Values from Theme](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-57-plugin-with-dynamic-values-from-theme)
- [Example 58: Tailwind v4 @import and CSS-First Setup](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-58-tailwind-v4-import-and-css-first-setup)
- [Example 59: Tailwind v4 @theme Directive and Design System Tokens](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-59-tailwind-v4-theme-directive-and-design-system-tokens)
- [Example 60: Understanding Content Scanning and Purging](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-60-understanding-content-scanning-and-purging)
- [Example 61: Bundle Size Analysis and Optimization](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-61-bundle-size-analysis-and-optimization)
- [Example 62: Production Build Pipeline Integration](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-62-production-build-pipeline-integration)
- [Example 63: WCAG AA Compliance Patterns](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-63-wcag-aa-compliance-patterns)
- [Example 64: Skip Links and Focus Management](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-64-skip-links-and-focus-management)
- [Example 65: Container Queries with @container](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-65-container-queries-with-container)
- [Example 66: Custom Variant Creation](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-66-custom-variant-creation)
- [Example 67: Tailwind with CSS Modules](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-67-tailwind-with-css-modules)
- [Example 68: Understanding shadcn/ui Architecture](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-68-understanding-shadcnui-architecture)
- [Example 69: Migrating from Traditional CSS to Tailwind](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-69-migrating-from-traditional-css-to-tailwind)
- [Example 70: Migrating from Bootstrap to Tailwind](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-70-migrating-from-bootstrap-to-tailwind)
- [Example 71: Design Token System with Tailwind](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-71-design-token-system-with-tailwind)
- [Example 72: Complex Responsive Dashboard Layout](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-72-complex-responsive-dashboard-layout)
- [Example 73: Tailwind v4 Migration Guide](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-73-tailwind-v4-migration-guide)
- [Example 74: Testing Tailwind-Styled Components](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-74-testing-tailwind-styled-components)
- [Example 75: Tailwind in Monorepo and Shared Component Libraries](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-75-tailwind-in-monorepo-and-shared-component-libraries)
- [Example 76: Performance Profiling and CSS Optimization](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-76-performance-profiling-and-css-optimization)
- [Example 77: Advanced Selectors and the JIT Engine](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-77-advanced-selectors-and-the-jit-engine)
- [Example 78: Tailwind with Server Components and SSR](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-78-tailwind-with-server-components-and-ssr)
- [Example 79: Tailwind Print Styles and Export Patterns](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-79-tailwind-print-styles-and-export-patterns)
- [Example 80: Building a Complete Accessible UI Component](/en/learn/software-engineering/platforms/web/tools/fe-tailwindcss/by-example/advanced#example-80-building-a-complete-accessible-ui-component)

---
title: Component Patterns Convention
description: Standards for building UI components with CVA variants, Radix primitives, and React patterns
category: explanation
subcategory: development/frontend
tags:
  - components
  - react
  - radix
  - cva
  - shadcn
created: 2026-03-28
updated: 2026-03-28
---

# Component Patterns Convention

Standards for building UI components in the open-sharia-enterprise monorepo. These rules govern how components are structured, composed, and styled across `ayokoding-web` and `organiclever-fe`.

## File Structure

Each non-trivial UI component lives in its own directory:

```
components/ui/button/
├── button.tsx          # Component implementation
├── button.variants.ts  # CVA variant definitions
├── button.test.tsx     # Unit tests (Vitest + Testing Library)
└── button.stories.tsx  # Storybook stories
```

Simple, single-variant components may colocate the variant definition inline in `.tsx`. Extract to `.variants.ts` when the `cva()` call exceeds approximately 10 lines or when multiple components share variants.

## Component Pattern

### Use `React.ComponentProps`, Not `forwardRef`

All components use `React.ComponentProps<"element">` for prop spreading. Do NOT use `React.forwardRef` — React 19 passes refs as plain props, making `forwardRef` unnecessary.

```tsx
// Correct — React.ComponentProps, function declaration
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  // ...
}

// Wrong — forwardRef (legacy pattern)
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // ...
  },
);
Button.displayName = "Button";
```

### Import Radix from the Unified Package

Import all Radix primitives from `radix-ui` (the unified package), NOT from individual `@radix-ui/react-*` packages.

```tsx
// Correct — unified package
import { Slot, Dialog, DropdownMenu } from "radix-ui";

// Wrong — individual packages
import { Slot } from "@radix-ui/react-slot";
import * as Dialog from "@radix-ui/react-dialog";
```

**Note**: Always use `Slot.Root` (not bare `Slot`) when rendering the slot component. `Slot` is
imported as a namespace from the unified `radix-ui` package; `Slot.Root` is the composable element.

```tsx
// Correct
const Comp = asChild ? Slot.Root : "button";

// Wrong — bare Slot is a namespace, not a renderable element
const Comp = asChild ? Slot : "button";
```

### `data-slot` Attribute

Every component root element carries a `data-slot` attribute identifying the component part. This enables CSS selection and test targeting without relying on class names.

```tsx
<Comp data-slot="button" ... />
<div data-slot="card" ... />
<header data-slot="card-header" ... />
```

### `cn()` Utility

Merge class names with `cn()` from `src/lib/utils` (or `@/lib/utils`). Always pass `className` last so consumer overrides win.

```tsx
import { cn } from "src/lib/utils";

className={cn(buttonVariants({ variant, size, className }))}
```

## CVA Variants

Define variants with `cva()` from `class-variance-authority`. Export both the variants function and the `VariantProps` type.

### `.variants.ts` Example

```ts
// button.variants.ts
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  // Base classes — always applied
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
```

## Radix Composition

Import the component namespace from `radix-ui` and compose sub-parts directly.

```tsx
// dialog.tsx
import { Dialog } from "radix-ui";

function DialogRoot({ ...props }: React.ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root data-slot="dialog" {...props} />;
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background p-6 shadow-lg",
          className,
        )}
        {...props}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export { DialogRoot as Dialog, DialogContent };
```

## Required States

Every interactive component must cover all meaningful states via Tailwind variant classes:

| State         | Tailwind Modifier                    |
| ------------- | ------------------------------------ |
| Default       | Base classes in `cva()`              |
| Hover         | `hover:`                             |
| Focus-visible | `focus-visible:`                     |
| Active        | `active:`                            |
| Disabled      | `disabled:` (+ `aria-disabled:`)     |
| Loading       | `data-loading:` or `aria-busy:`      |
| Error         | `aria-invalid:` (+ ring color token) |
| Success       | `data-success:` or `aria-checked:`   |

Encode all state styles in the `cva()` base string or in named variants — never apply state classes conditionally with template literals.

## `asChild` Pattern

The `asChild` prop delegates rendering to the consumer's element via `Slot.Root`. Use it when the component must merge its behavior onto an arbitrary element (e.g., wrapping a Next.js `Link` in a `Button`).

```tsx
import { Slot } from "radix-ui";

const Comp = asChild ? Slot.Root : "button";
return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
```

```tsx
// Consumer usage — renders an <a> with button styles
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

## Complete Button Example

The following is the canonical `ayokoding-web` implementation, which all new apps should follow.

```tsx
// components/ui/button.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "src/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

Note: `organiclever-fe` currently uses `React.forwardRef` and `@radix-ui/react-slot`. Migrate it to the `React.ComponentProps` + `radix-ui` pattern described above when updating that component.

## Principles Implemented/Respected

- [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md) — `React.ComponentProps` eliminates the `forwardRef` wrapper boilerplate. CVA centralizes all variant logic in one declarative object instead of scattered conditional class strings.
- [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) — `data-slot` attributes make component structure visible to CSS and tests. `VariantProps` exports make the full variant surface area explicit at the type level.
- [Progressive Disclosure](../../principles/content/progressive-disclosure.md) — The `asChild` prop exposes composition capability only when needed. Consumers start with the default element and opt into polymorphism explicitly.

## Conventions Implemented/Respected

- [Styling Convention](./styling.md) — All variant class strings use Tailwind utilities and follow the utility-first approach. No `@apply` or inline `style={}` props appear in component implementations.
- [Design Tokens Convention](./design-tokens.md) — Variant classes reference semantic tokens (`bg-primary`, `text-destructive`, `ring-ring`) rather than raw color values, ensuring design token governance is respected throughout.
- [Indentation Convention](../../conventions/formatting/indentation.md) — All TypeScript and TSX examples in this document use 2-space indentation per the project standard.

---

**Last Updated**: 2026-03-28

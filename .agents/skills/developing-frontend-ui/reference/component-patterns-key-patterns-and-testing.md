# Component Patterns — Key Patterns and Testing

## Key Patterns

### React.ComponentProps (NOT forwardRef)

```tsx
// CORRECT — modern pattern
function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" className={cn("...", className)} {...props} />;
}

// WRONG — legacy pattern
const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

### Radix UI Unified Import

```tsx
// CORRECT — unified package
import { Slot, Dialog, DropdownMenu } from "radix-ui";
// Use Slot.Root, Dialog.Root, Dialog.Trigger, etc.

// WRONG — individual packages
import { Slot } from "@radix-ui/react-slot";
import * as DialogPrimitive from "@radix-ui/react-dialog";
```

### cn() Usage

```tsx
import { cn } from "@open-sharia-enterprise/web-ui";

// Conditional classes
<div className={cn("flex items-center", isActive && "bg-primary")} />

// Responsive classes
<div className={cn("p-2 md:p-4 lg:p-6")} />

// Variant override
<Button className={cn(buttonVariants({ variant: "outline" }), "custom-class")} />
```

### data-slot Attribute

Every component root element MUST have `data-slot`:

```tsx
<button data-slot="button" />
<div data-slot="card" />
<input data-slot="input" />
<dialog data-slot="dialog-content" />
```

### Required Component States

Every interactive component must handle:

| State         | CSS/Attribute                                      | Required For               |
| ------------- | -------------------------------------------------- | -------------------------- |
| Default       | (base styles)                                      | All components             |
| Hover         | `hover:`                                           | Buttons, links, cards      |
| Focus visible | `focus-visible:ring-*`                             | All interactive elements   |
| Active        | `active:`                                          | Buttons                    |
| Disabled      | `disabled:opacity-50 disabled:pointer-events-none` | Buttons, inputs            |
| Loading       | Custom (spinner + aria-busy)                       | Buttons with async actions |
| Error         | `aria-invalid:border-destructive`                  | Form inputs                |
| Success       | Custom (check icon + aria feedback)                | Form submissions           |

### asChild Pattern

Use Radix `Slot` to render as a different element:

```tsx
// Renders as <a> instead of <button>
<Button asChild>
  <a href="/page">Navigate</a>
</Button>

// Renders as Next.js Link
<Button asChild>
  <Link href="/page">Navigate</Link>
</Button>
```

## Storybook Stories Requirements

Every `component-name.stories.tsx` needs: a default-state story, an all-variants story, an
all-sizes story, a dark-mode story, a disabled-state story, a responsive story (mobile/tablet/desktop
viewports), and an interactive story with args controls.

## Unit Test Coverage

Every `component-name.test.tsx` asserts `toHaveNoViolations()` (vitest-axe), renders every variant
combination without crashing, exercises `asChild` where supported, forwards `className` via `cn()`,
asserts the `data-slot` attribute is present, and confirms icon-only variants carry an accessible
name.

## New Component Checklist

For every new shared component: `component-name.variants.ts` (CVA definitions), `component-name.tsx`
(implementation per the patterns above), `component-name.test.tsx`, `component-name.stories.tsx`,
and a barrel export added to `libs/web-ui/src/index.ts`.

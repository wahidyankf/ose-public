# Quick Reference: Top Rules

## Do

1. **Use semantic tokens** — `bg-primary`, `text-muted-foreground`, `border-border` (not hardcoded colors)
2. **Use `React.ComponentProps<"element">`** — not `React.forwardRef`
3. **Use `radix-ui` unified package** — not `@radix-ui/react-slot` individual packages; use `Slot.Root` from unified
4. **Add `data-slot="component-name"`** on every component root element
5. **Use `focus-visible:`** — not `focus:` (keyboard-only focus rings)
6. **Use `cn()` from shared lib** — `clsx` + `tailwind-merge` for class composition
7. **Define variants with CVA** — export from `.variants.ts` for reuse
8. **Every visual token needs a `.dark` counterpart** — verify contrast in both modes
9. **Mobile-first responsive** — start with base styles, add `md:`, `lg:` prefixes
10. **Minimum hit targets** — 24px desktop, 44px mobile

## Do Not

1. **No hardcoded hex/rgb/hsl** in className or style props — use design tokens
2. **No `!important`** — use `@layer` specificity or Tailwind modifiers
3. **No `@apply` outside `@layer base`** — defeats utility-first purpose
4. **No inline `style={{}}` in production** — use Tailwind utilities
5. **No `focus:` without `visible`** — always `focus-visible:` for keyboard users
6. **No color-only status indicators** — include text labels and/or shapes
7. **No `transition-all`** — specify explicit properties: `transition-colors`, `transition-opacity`
8. **No bounce/elastic easing** — use `ease-out` or custom `cubic-bezier`
9. **No nested Card inside Card** — use spacing/dividers for visual hierarchy
10. **No font via CSS `font-family`** — use `next/font` for optimization

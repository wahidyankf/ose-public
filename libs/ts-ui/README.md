# ts-ui

Shared React component library for the open-sharia-enterprise monorepo. Built on shadcn/ui patterns with Radix UI primitives and Tailwind CSS.

## Components

| Component | Source                       | Pattern                                     |
| --------- | ---------------------------- | ------------------------------------------- |
| Button    | ayokoding-web (reconciled)   | CVA variants, 6 variants, 8 sizes, asChild  |
| Alert     | ayokoding-web                | CVA variants, role="alert"                  |
| Dialog    | ayokoding-web                | Radix Dialog, portal, overlay, close button |
| Input     | ayokoding-web                | focus-visible, aria-invalid                 |
| Card      | organiclever-fe (modernized) | Subcomponents with data-slot                |
| Label     | organiclever-fe (modernized) | Radix Label                                 |

## Usage

```tsx
import { Button, Card, CardHeader, CardTitle, cn } from "@open-sharia-enterprise/ts-ui";
```

## Development

```bash
nx run ts-ui:typecheck        # Type checking
nx run ts-ui:test:unit        # Unit tests with vitest-axe
nx run ts-ui:test:quick       # Tests + coverage validation (>=70%)
```

## Storybook

```bash
nx storybook ts-ui             # Dev server on http://localhost:6006
nx build-storybook ts-ui       # Static build
```

## Visual Regression

Playwright-based screenshot tests compare components against committed baselines.

```bash
nx run ts-ui:test:visual                           # Run visual tests
nx run ts-ui:test:visual -- --update-snapshots     # Update baselines after intentional changes
```

**When to update baselines**: After intentional visual changes to components (new variants, color
changes, layout adjustments). Review the `git diff` on `.png` files before committing.

**Baselines location**: `libs/ts-ui/e2e/screenshots/`

## Conventions

All components follow the patterns in [Component Patterns Convention](../../governance/development/frontend/component-patterns.md):

- `React.ComponentProps<"element">` (not forwardRef)
- `radix-ui` unified imports (not @radix-ui/\* individual packages)
- `data-slot` attribute on every root element
- `cn()` utility for class merging
- Semantic tokens only (no hardcoded colors)

# web-ui

Shared React component library for the open-sharia-enterprise monorepo. Built on shadcn/ui patterns with Radix UI primitives and Tailwind CSS.

## Components

### Base components

| Component | Source                            | Pattern                                                  |
| --------- | --------------------------------- | -------------------------------------------------------- |
| Button    | ayokoding-www (reconciled)        | CVA variants, 6 + 2 OL variants, 8 + 1 OL sizes, asChild |
| Alert     | ayokoding-www                     | CVA variants, 3 + 3 OL semantic variants, role="alert"   |
| Dialog    | ayokoding-www                     | Radix Dialog, portal, overlay, close button              |
| Input     | ayokoding-www                     | focus-visible, aria-invalid, 44 px OL touch target       |
| Card      | organiclever-app-web (modernized) | Subcomponents with data-slot                             |
| Label     | organiclever-app-web (modernized) | Radix Label                                              |

### OrganicLever components

Components specific to the OrganicLever warm design system. Import
`@open-sharia-enterprise/web-ui-token/src/organiclever.css` to activate the warm OKLCH palette.

| Component    | Props                                           | Description                               |
| ------------ | ----------------------------------------------- | ----------------------------------------- |
| Icon         | `name`, `size`, `filled`                        | 34-icon inline SVG set                    |
| Toggle       | `value`, `onChange`, `label`                    | Slide-switch, teal active state           |
| ProgressRing | `size`, `stroke`, `progress`, `color`, `bg`     | Circular SVG arc                          |
| Sheet        | `title`, `onClose`, `children`                  | Bottom-anchored modal, slide-up animation |
| AppHeader    | `title`, `subtitle`, `onBack`, `trailing`       | Back-button + title + optional trailing   |
| StatCard     | `label`, `value`, `unit`, `hue`, `icon`, `info` | Dashboard stat tile                       |
| InfoTip      | `title`, `text`                                 | ⓘ button opening a Sheet                  |
| HuePicker    | `value`, `onChange`                             | 6-hue swatch row                          |
| TabBar       | `tabs`, `current`, `onChange`                   | 60 px mobile bottom navigation            |
| SideNav      | `brand`, `tabs`, `current`, `onChange`          | 220 px desktop side navigation            |

## Usage

```tsx
import { Button, Card, CardHeader, CardTitle, cn } from "@open-sharia-enterprise/web-ui";
```

## Development

```bash
nx run web-ui:typecheck        # Type checking
nx run web-ui:test:unit        # Unit tests with vitest-axe
nx run web-ui:test:quick       # Unit + static coverage (Unit lines >=99%)
```

## Storybook

```bash
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- storybook web-ui
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- build-storybook web-ui
```

## Visual Regression

Playwright-based screenshot tests compare components against committed baselines.

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run web-ui:test:integration
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run web-ui:test:integration -- --update-snapshots
```

**When to update baselines**: After intentional visual changes to components (new variants, color
changes, layout adjustments). Review the `git diff` on `.png` files before committing.

**Baselines location**: `libs/web-ui/tests/integration/screenshots/`

## Conventions

All components follow the patterns in [Component Patterns Convention](../../repo-governance/development/frontend/component-patterns.md):

- `React.ComponentProps<"element">` (not forwardRef)
- `radix-ui` unified imports (not @radix-ui/\* individual packages)
- `data-slot` attribute on every root element
- `cn()` utility for class merging
- Semantic tokens only (no hardcoded colors)

## BDD and Testing

The canonical corpus is `specs/libs/web-ui/behaviours/`. `test:unit` runs component adapters in
process, while `test:e2e` drives Chromium against Storybook as the library's genuine public browser
boundary. Matching `test:coverage:unit`, `test:coverage:e2e`, `test:coverage:behaviour`, and
aggregate `test:coverage` validate both adapters statically. Integration is omitted because the
library owns no non-networked local-resource boundary.

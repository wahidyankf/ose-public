# Design Tokens Reference

## Token Architecture

The monorepo uses a two-tier token system:

- **Structural tokens** (shared in `libs/web-ui-token/`): radius, spacing, typography, base neutrals, semantic colors
- **Brand tokens** (per-app in `globals.css`): primary, secondary, accent, app-specific tokens

## Current Token Values

### organiclever-www (Neutral/Professional)

```css
/* Brand — neutral grayscale */
:root {
  --primary: 0 0% 9%; /* Near-black */
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --accent: 0 0% 96.1%;
  --destructive: 0 84.2% 60.2%; /* Red */
  --border: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
}
/* App-specific: chart-1 through chart-5 */
```

### ayokoding-web (Blue/Educational)

```css
/* Brand — blue tinted */
@theme {
  --color-primary: hsl(221.2 83.2% 53.3%); /* Blue */
  --color-primary-foreground: hsl(210 40% 98%);
  --color-secondary: hsl(210 40% 96.1%);
  --color-border: hsl(214.3 31.8% 91.4%); /* Blue-gray */
  --color-ring: hsl(221.2 83.2% 53.3%); /* Blue */
  --radius: 0.5rem;
}
/* App-specific: sidebar-background through sidebar-ring (8 tokens) */
```

## Token-to-Tailwind Mapping

| CSS Token                    | Tailwind Utility (bg)   | Tailwind Utility (text)   | Tailwind Utility (border) |
| ---------------------------- | ----------------------- | ------------------------- | ------------------------- |
| `--color-background`         | `bg-background`         | `text-background`         | `border-background`       |
| `--color-foreground`         | `bg-foreground`         | `text-foreground`         | `border-foreground`       |
| `--color-primary`            | `bg-primary`            | `text-primary`            | `border-primary`          |
| `--color-primary-foreground` | `bg-primary-foreground` | `text-primary-foreground` | —                         |
| `--color-secondary`          | `bg-secondary`          | `text-secondary`          | `border-secondary`        |
| `--color-muted`              | `bg-muted`              | `text-muted`              | `border-muted`            |
| `--color-muted-foreground`   | `bg-muted-foreground`   | `text-muted-foreground`   | —                         |
| `--color-accent`             | `bg-accent`             | `text-accent`             | `border-accent`           |
| `--color-destructive`        | `bg-destructive`        | `text-destructive`        | `border-destructive`      |
| `--color-border`             | —                       | —                         | `border-border`           |
| `--color-input`              | `bg-input`              | —                         | `border-input`            |
| `--color-ring`               | —                       | —                         | `ring-ring`               |

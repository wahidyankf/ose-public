# organiclever-web

Next.js 16 frontend for the OrganicLever life journal — local-first productivity tracker with
PGlite (Postgres-WASM) for in-browser data storage.

## Overview

`organiclever-web` serves a landing page at `/` and the full OrganicLever app under `/app/`. Each
screen has a dedicated URL — refresh, browser back/forward, and deep links all work. All app data
is stored locally in the browser via PGlite (IndexedDB-backed) — no backend required.

The existing Effect TS service layer (`src/services/`) and layer implementations (`src/layers/`)
are preserved as dormant library code for a future backend rewire.

## Routes and Screens

### Top-level routes

| Route               | Description                                      |
| ------------------- | ------------------------------------------------ |
| `/`                 | Landing and promotional page                     |
| `/app`              | 308 permanent redirect to `/app/home`            |
| `/app/...`          | OrganicLever life journal app (URL-routed shell) |
| `/system/status/be` | Server-rendered backend diagnostic page          |

### In-app screens (URL-routed under `/app/`)

| URL                   | Screen       | Description                                   | Chrome      |
| --------------------- | ------------ | --------------------------------------------- | ----------- |
| `/app/home`           | Home         | Dashboard — today's summary and quick-log FAB | TabBar/Side |
| `/app/history`        | History      | Chronological entry log with filter/search    | TabBar/Side |
| `/app/progress`       | Progress     | Charts and streaks across all entry types     | TabBar/Side |
| `/app/settings`       | Settings     | Preferences, dark mode, data export/reset     | TabBar/Side |
| `/app/workout`        | Workout      | Active workout session UI                     | hidden      |
| `/app/workout/finish` | Finish       | Post-workout summary                          | hidden      |
| `/app/routines/edit`  | Edit Routine | Routine editor                                | hidden      |

The `app/` route segment owns a single client layout that mounts the PGlite runtime, the trimmed
`appMachine` (overlay region only), the dark-mode + breakpoint effects, and the Add Entry / Logger
overlay tree. Per-tab `page.tsx` files are thin wrappers around the screen components.

### Entry flows (launched from FAB on any tab)

| Entry type | Description                                       |
| ---------- | ------------------------------------------------- |
| Workout    | Log a workout session (type, duration, intensity) |
| Reading    | Log a reading session (title, pages, notes)       |
| Learning   | Log a learning session (topic, source, notes)     |
| Meal       | Log a meal (name, type, adherence rating)         |
| Focus      | Log a focus/deep-work session (task, duration)    |

### Data storage

All entries are stored in **PGlite** (Postgres-WASM, IndexedDB-backed). Data never leaves the
device — no network requests, no backend required for core app functionality.

## Architecture

The app is structured around **bounded contexts** with `domain` / `application` / `infrastructure` / `presentation` layers. See [docs/explanation/bounded-context-map.md](./docs/explanation/bounded-context-map.md) for the authoritative map, layer rules, and ESLint enforcement plan.

```
Browser ──── Next.js (organiclever-web)
                    │
                    ├── /                       Static landing page (no network dependency)
                    ├── /app                    308 → /app/home (preserves old bookmarks)
                    ├── /app/home               Home screen (dashboard + FAB)
                    ├── /app/history            History tab
                    ├── /app/progress           Progress tab
                    ├── /app/settings           Settings tab
                    ├── /app/workout            Active workout (TabBar hidden)
                    ├── /app/workout/finish     Post-workout summary
                    ├── /app/routines/edit      Routine editor
                    └── /system/status/be       Server-rendered diagnostic page (force-dynamic)
```

### Diagnostic page (`/system/status/be`)

Reads `ORGANICLEVER_BE_URL` at request time and probes `GET /health` with a 3-second timeout.

| State          | Condition                                       | Rendered output                              |
| -------------- | ----------------------------------------------- | -------------------------------------------- |
| Not configured | `ORGANICLEVER_BE_URL` unset                     | "Not configured — set `ORGANICLEVER_BE_URL`" |
| UP             | `GET /health` returns 2xx within 3 s            | URL, latency, response body                  |
| DOWN           | Non-2xx, connection error, timeout, parse error | URL, failure reason                          |

The page is marked `export const dynamic = "force-dynamic"` — Vercel never prerenders it at build
time. All failure paths are caught at the page level; the page never returns non-200 or throws to
the error boundary.

### Dormant BE integration code

Preserved — no changes — as library code for the future rewire:

- `src/services/auth-service.ts`
- `src/services/backend-client.ts`
- `src/services/errors.ts`
- `src/layers/backend-client-live.ts`
- `src/layers/backend-client-test.ts`
- `src/lib/auth/cookies.ts`
- `generated-contracts/` (regenerated by `codegen`)

## Environment Variables

| Variable              | Scope       | Required | Description                                         |
| --------------------- | ----------- | -------- | --------------------------------------------------- |
| `ORGANICLEVER_BE_URL` | Server-only | No       | Backend base URL probed by `/system/status/be` only |

## Development

```bash
nx dev organiclever-web          # Start development server (localhost:3200)
nx build organiclever-web        # Production build
nx run organiclever-web:test:quick  # Unit tests + coverage validation (70%)
nx run organiclever-web:test:unit   # Unit tests only
nx run organiclever-web:typecheck   # TypeScript type check
nx run organiclever-web:lint        # Lint with oxlint
```

## Testing

Tests use Vitest with `@amiceli/vitest-cucumber` for BDD-style Gherkin specs.

Spec files are in `specs/apps/organiclever/fe/gherkin/`.

Step implementations are in `test/unit/steps/`.

Coverage threshold: 70% lines (enforced by `rhino-cli test-coverage validate`).

## Design System

`organiclever-web` uses the OrganicLever (OL) warm OKLCH design system, implemented via
`@open-sharia-enterprise/ts-ui-tokens/src/organiclever.css` and wired into the app's
`globals.css`.

### Palette

Six semantic hues with three tints each (base / ink / wash):

| Hue        | Base token         | Role                   |
| ---------- | ------------------ | ---------------------- |
| Terracotta | `--hue-terracotta` | Energy, warmth         |
| Honey      | `--hue-honey`      | Accent, highlight      |
| Sage       | `--hue-sage`       | Primary brand, success |
| Teal       | `--hue-teal`       | Active, focus ring     |
| Sky        | `--hue-sky`        | Info                   |
| Plum       | `--hue-plum`       | Achievement            |

Warm neutral scale: `--warm-0` (near-white `oklch(99% 0.005 80)`) through `--warm-900`
(near-black). Semantic aliases: `--color-background`, `--color-foreground`,
`--color-primary` (sage), `--color-card`, etc.

### Typography

| Role                  | Font                     | CSS variable                            |
| --------------------- | ------------------------ | --------------------------------------- |
| Body / UI text        | Nunito (400–800)         | `--font-nunito` → `--font-sans`         |
| Numeric / mono values | JetBrains Mono (400–600) | `--font-jetbrains-mono` → `--font-mono` |

Fonts are self-hosted via `next/font/google` and injected as CSS variables on `<html>` by
`src/app/layout.tsx`.

### Dark mode

Dark mode activates on **either**:

- `data-theme="dark"` attribute on `<html>` (set via JavaScript)
- `.dark` CSS class on `<html>` (set via Tailwind dark variant)

Both selectors are handled by `@custom-variant dark` in `ts-ui-tokens`.

### Token import

```css
/* apps/organiclever-web/src/app/globals.css */
@import "tailwindcss";
@source "../../../../libs/ts-ui/src/**/*.{ts,tsx}";
@import "@open-sharia-enterprise/ts-ui-tokens/src/tokens.css";
@import "@open-sharia-enterprise/ts-ui-tokens/src/organiclever.css";

@theme {
  --font-sans: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
}
```

`organiclever.css` is opt-in — other apps (`ayokoding-web`, `oseplatform-web`,
`wahidyankf-web`) do **not** import it. The warm OKLCH tokens do not affect sibling apps.

### Component library

`@open-sharia-enterprise/ts-ui` components automatically adopt the warm tokens.
OL-specific variants and new components:

| Component      | OL addition                                                    |
| -------------- | -------------------------------------------------------------- |
| `Button`       | `variant="teal"` / `variant="sage"` / `size="xl"` (60 px hero) |
| `Alert`        | `variant="success"` / `variant="warning"` / `variant="info"`   |
| `Input`        | 44 px default height (WCAG touch target)                       |
| `Icon`         | 34-icon inline SVG set (`name="dumbbell"` etc.)                |
| `Toggle`       | Slide-switch with teal active state                            |
| `ProgressRing` | Circular SVG progress indicator                                |
| `Sheet`        | Bottom-anchored modal with slide-up animation                  |
| `AppHeader`    | Back-button + title + trailing action bar                      |
| `StatCard`     | Dashboard stat tile with hue icon                              |
| `InfoTip`      | Contextual help button opening a Sheet                         |
| `HuePicker`    | 6-hue color swatch row                                         |
| `TabBar`       | 60 px mobile bottom navigation                                 |
| `SideNav`      | 220 px desktop side navigation                                 |

See [`libs/ts-ui/README.md`](../../libs/ts-ui/README.md) for the complete component catalog.

## Tech Stack

- **Next.js 16** — App Router, Server Components
- **Effect TS** — Typed functional effects for dormant server-side service layer
- **Tailwind CSS v4** — Utility-first CSS
- **`@open-sharia-enterprise/ts-ui`** — Shared UI component library (OL brand tokens)
- **`@open-sharia-enterprise/ts-ui-tokens`** — OL warm OKLCH design tokens
- **Vitest** — Unit tests
- **TypeScript 5** — Strict mode

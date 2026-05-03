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

The app is structured around **bounded contexts** with `domain` / `application` / `infrastructure` / `presentation` layers. See [docs/explanation/bounded-context-map.md](./docs/explanation/bounded-context-map.md) for the authoritative map, layer rules, and ESLint enforcement.

### Project layout

```
apps/organiclever-web/
├── src/
│   ├── app/                        # Next.js App Router (thin wrappers only)
│   │   ├── app/                    # /app/* routes (home, history, progress, settings, workout…)
│   │   └── system/status/be/       # Server-rendered diagnostic page
│   ├── contexts/                   # Bounded-context implementations
│   │   ├── app-shell/              # Navigation chrome, i18n, entry-logging overlays
│   │   │   ├── application/        # Bootstrap (seedIfEmpty)
│   │   │   └── presentation/       # appMachine, TabBar, SideNav, loggers, home-screen chrome
│   │   ├── health/                 # Backend health diagnostic
│   │   │   └── infrastructure/     # Dormant BE client (future rewire)
│   │   ├── journal/                # Event log — system of record
│   │   │   ├── domain/             # JournalEvent, typed payloads, tagged errors
│   │   │   ├── application/        # appendEvent, bumpEvent, listEvents, journalMachine
│   │   │   ├── infrastructure/     # PGlite store, migrations, runtime
│   │   │   └── presentation/       # useJournal, EntryCard, AddEntrySheet, JournalList
│   │   ├── landing/                # Marketing landing page
│   │   │   └── presentation/       # LandingPage component
│   │   ├── routine/                # Workout routine management
│   │   │   ├── domain/             # Routine, ExerciseGroup types
│   │   │   ├── application/        # saveRoutine, listRoutines
│   │   │   ├── infrastructure/     # PGlite routine store
│   │   │   └── presentation/       # useRoutines, EditRoutineScreen
│   │   ├── routing/                # 404 guards (disabled routes)
│   │   │   └── presentation/       # placeholder
│   │   ├── settings/               # User preferences (language, dark mode)
│   │   │   ├── domain/             # AppSettings, RestSeconds, Lang
│   │   │   ├── application/        # getSettings, saveSettings
│   │   │   ├── infrastructure/     # PGlite settings store
│   │   │   └── presentation/       # useSettings, SettingsScreen
│   │   ├── stats/                  # History + progress projections
│   │   │   ├── domain/             # WeeklyStats, DayEntry, ExerciseProgress types
│   │   │   ├── application/        # Read-only stats use-cases
│   │   │   └── presentation/       # HistoryScreen, ProgressScreen
│   │   └── workout-session/        # Active workout session FSM
│   │       ├── domain/             # placeholder
│   │       ├── application/        # workoutSessionMachine (XState)
│   │       └── presentation/       # WorkoutScreen, FinishScreen
│   ├── shared/                     # Cross-context utilities
│   │   ├── runtime/                # PgliteService Tag, AppRuntime, shared errors
│   │   └── utils/                  # format-relative-time, fmt
│   ├── generated-contracts/        # Auto-generated from OpenAPI spec (gitignored)
│   └── test/                       # Test helpers and fixtures
├── test/                           # Unit step files (vitest-cucumber)
│   └── unit/steps/                 # Step implementations per bounded context
├── docs/explanation/               # Architecture docs (bounded-context map)
└── project.json                    # Nx project configuration
```

**Layer rules** (enforced by ESLint `boundaries` at error severity):

- `domain` ← no imports from this project
- `application` ← `domain` only
- `infrastructure` ← `domain` + `application` + `@/shared/runtime`
- `presentation` ← `domain` + `application`
- Cross-context: only via the target context's published `application/index.ts` or `presentation/index.ts`

**Ubiquitous language**: every domain term used in Gherkin steps is defined in [`specs/apps/organiclever/ubiquitous-language/`](../../specs/apps/organiclever/ubiquitous-language/README.md).

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

- `src/contexts/health/infrastructure/backend-client.ts`
- `src/contexts/health/infrastructure/backend-client-live.ts`
- `src/contexts/health/infrastructure/backend-client-test.ts`
- `src/contexts/health/infrastructure/errors.ts`
- `src/generated-contracts/` (regenerated by `codegen`)

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

- **Spec files**: [`specs/apps/organiclever/fe/gherkin/`](../../specs/apps/organiclever/fe/gherkin/README.md) — organized by bounded context
- **Ubiquitous language**: [`specs/apps/organiclever/ubiquitous-language/`](../../specs/apps/organiclever/ubiquitous-language/README.md) — per-context glossaries; Gherkin steps use only glossary terms
- **Step implementations**: `test/unit/steps/` — organized by bounded context to mirror spec folders

Coverage threshold: 70% lines (enforced by `rhino-cli test-coverage validate`).

`test:quick` also runs `rhino-cli bc validate organiclever` and `rhino-cli ul validate organiclever`
to enforce DDD structural parity and glossary accuracy. Both run at `error` severity by default.

**Local escape hatch** — if a false-positive blocks you before a fix lands, set:

```bash
ORGANICLEVER_RHINO_DDD_SEVERITY=warn nx run organiclever-web:test:quick
```

This downgrades DDD findings to warnings so tests pass. Do not commit with this env var set;
`error` severity is the production default and ships in CI.

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

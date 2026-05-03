---
name: apps-organiclever-web-developing-content
description: Comprehensive guide for developing organiclever-web, the OrganicLever life journal at www.organiclever.com. Covers DDD bounded-context architecture, PGlite local-first storage, Effect TS, XState, Next.js 16 App Router, and Vercel deployment. Essential for development tasks on organiclever-web.
---

# organiclever-web Development Skill

## Purpose

This Skill provides guidance for developing and managing the **organiclever-web** Next.js 16 application — the OrganicLever life journal at www.organiclever.com. The app is a local-first productivity tracker with PGlite (Postgres-WASM) for in-browser data storage, structured around DDD bounded contexts.

**When to use this Skill:**

- Developing features for organiclever-web
- Understanding the bounded-context DDD architecture
- Working with PGlite storage or Effect TS service layer
- Configuring Vercel deployment
- Understanding organiclever-web specific conventions

## Core Concepts

### App Overview

**organiclever-web** (`apps/organiclever-web/`):

- **Framework**: Next.js 16 with App Router
- **Architecture**: DDD bounded contexts (`domain` / `application` / `infrastructure` / `presentation`)
- **Storage**: PGlite (Postgres-WASM, IndexedDB-backed) — local-first, no backend required
- **Effects**: Effect TS for typed functional effects in infrastructure layer
- **State machines**: XState for UI FSMs (app-shell, workout-session)
- **URL**: https://www.organiclever.com/
- **Role**: Landing page + full life-journal app under `/app/`
- **Deployment**: Vercel (`prod-organiclever-web` branch)

### Tech Stack Details

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Framework  | Next.js 16 (App Router)                   |
| UI Runtime | React 19                                  |
| Styling    | TailwindCSS + OL warm OKLCH design tokens |
| Components | `@open-sharia-enterprise/ts-ui`           |
| Storage    | PGlite (Postgres-WASM, IndexedDB)         |
| Effects    | Effect TS (infrastructure layer only)     |
| State      | XState v5 (app-shell, workout-session)    |
| BDD tests  | `@amiceli/vitest-cucumber` + Vitest       |
| Deployment | Vercel (auto-detected)                    |

## Directory Structure

```
apps/organiclever-web/
├── src/
│   ├── app/                        # Next.js App Router (thin wrappers only)
│   │   ├── app/                    # /app/* routes (home, history, progress, settings, workout…)
│   │   └── system/status/be/       # Server-rendered diagnostic page
│   ├── contexts/                   # Bounded-context implementations
│   │   ├── app-shell/              # Navigation chrome, i18n, entry-logging overlays
│   │   ├── health/                 # Backend health diagnostic (dormant BE client)
│   │   ├── journal/                # Event log — system of record (PGlite)
│   │   ├── landing/                # Marketing landing page
│   │   ├── routine/                # Workout routine management (PGlite)
│   │   ├── routing/                # 404 guards (disabled routes)
│   │   ├── settings/               # User preferences — dark mode, language (PGlite)
│   │   ├── stats/                  # History + progress projections (read-only from journal)
│   │   └── workout-session/        # Active workout session FSM (XState)
│   ├── shared/                     # Cross-context utilities
│   │   ├── runtime/                # PgliteService Tag, AppRuntime, shared tagged errors
│   │   └── utils/                  # format-relative-time, fmt
│   ├── generated-contracts/        # Auto-generated from OpenAPI spec (gitignored)
│   └── test/                       # Test helpers and fixtures
├── test/unit/steps/                # Vitest-cucumber step implementations (per bounded context)
├── docs/explanation/               # Architecture docs (bounded-context map)
└── project.json                    # Nx project configuration
```

## Bounded-Context Architecture

Every feature lives inside one bounded context under `src/contexts/<bc>/`:

```
src/contexts/<bc>/
├── domain/           # Pure types, invariants, tagged errors — no IO, no Effect
├── application/      # Use-cases, ports, XState orchestrating machines — depends on domain
├── infrastructure/   # PGlite stores, Effect Layers, live adapters — depends on domain + application + shared/runtime
└── presentation/     # React hooks + components — depends on domain + application
```

**Layer rules** (ESLint `boundaries` at **error** severity since Phase 8):

- `domain` ← no project imports
- `application` ← `domain` only
- `infrastructure` ← `domain` + `application` + `@/shared/runtime`
- `presentation` ← `domain` + `application`
- Cross-context coupling: only via the target's `application/index.ts` or `presentation/index.ts` barrel

**Published API barrels**: each context exposes `domain/index.ts`, `application/index.ts`, `infrastructure/index.ts`, and `presentation/index.ts`. Consumers always import from the barrel, never from internal files.

### Adding a feature (bounded-context-aware workflow)

1. Identify which bounded context owns the feature. Consult [`docs/explanation/bounded-context-map.md`](./docs/explanation/bounded-context-map.md).
2. Ensure the domain term appears in [`specs/apps/organiclever/ubiquitous-language/<bc>.md`](../../specs/apps/organiclever/ubiquitous-language/README.md). Add it if missing — same commit as the code change.
3. Write or update the Gherkin spec in `specs/apps/organiclever/fe/gherkin/<bc>/`.
4. Implement: Red (failing step) → Green (minimal code) → Refactor.
5. Keep all new code inside the correct context layer. If it touches IO, it goes in `infrastructure/`. If it is a use-case, it goes in `application/`. Never break the layer rules.
6. Run `nx run organiclever-web:lint` to confirm 0 boundary errors before committing.

### XState machine placement rule

- **UI shell machine** (no IO, no aggregate model — e.g., `appMachine` toggling dark mode) → `presentation/`
- **Orchestrating machine** (invokes `fromPromise` actors hitting infrastructure — e.g., `journalMachine`, `workoutSessionMachine`) → `application/`

## Design System

`organiclever-web` uses the OrganicLever warm OKLCH design system. All visual tokens come
from `@open-sharia-enterprise/ts-ui-tokens`, and all UI components from
`@open-sharia-enterprise/ts-ui`.

### Token import chain

```css
/* apps/organiclever-web/src/app/globals.css */
@import "tailwindcss";
@source "../../../../libs/ts-ui/src/**/*.{ts,tsx}";
@import "@open-sharia-enterprise/ts-ui-tokens/src/tokens.css"; /* shared neutral baseline */
@import "@open-sharia-enterprise/ts-ui-tokens/src/organiclever.css"; /* OL warm OKLCH palette */

@theme {
  --font-sans: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
}
```

### Fonts

Nunito (body) and JetBrains Mono (numerics) are self-hosted via `next/font/google` in
`src/app/layout.tsx`. They generate CSS variables `--font-nunito` and
`--font-jetbrains-mono` applied to `<html>` className, then consumed by `@theme` above.

### Dark mode activation

```ts
// JavaScript — preferred (works with data-theme="dark" selector)
document.documentElement.setAttribute("data-theme", "dark");
document.documentElement.removeAttribute("data-theme");

// Tailwind class — also supported (legacy .dark selector)
document.documentElement.classList.add("dark");
```

Both selectors activate the same warm-dark palette in `organiclever.css`.

### Key tokens

```css
var(--hue-teal)        /* Interactive elements, focus rings */
var(--hue-sage)        /* Primary brand, success, main CTA */
var(--hue-teal-wash)   /* Active tab backgrounds */
var(--hue-sage-wash)   /* Success alert backgrounds */
var(--warm-0)          /* Page background (warm near-white) */
var(--warm-900)        /* Body text (warm near-black) */
var(--color-primary)   /* Maps to --hue-sage */
var(--color-ring)      /* Maps to --hue-teal */
```

### ts-ui component usage

Use components from `@open-sharia-enterprise/ts-ui` — NOT from `@/components/ui/`. The
shared `ts-ui` library owns the canonical component implementations.

```tsx
import {
  Button, Alert, Input, Icon, Toggle, ProgressRing,
  Sheet, AppHeader, StatCard, InfoTip, HuePicker, TabBar, SideNav,
} from "@open-sharia-enterprise/ts-ui";

// Brand variants
<Button variant="teal">Primary action</Button>
<Button variant="sage" size="xl">Hero CTA</Button>
<Alert variant="success">Workout logged!</Alert>
<Alert variant="warning">Rest day recommended</Alert>

// OL-specific components
<Icon name="dumbbell" size={24} />
<Toggle value={isDark} onChange={setIsDark} label="Dark mode" />
<StatCard label="Streak" value={7} unit="days" hue="terracotta" icon="flame" />
<TabBar tabs={tabs} current={route} onChange={navigate} />
<SideNav brand={{ name: "OrganicLever", icon: "dumbbell", hue: "teal" }}
         tabs={tabs} current={route} onChange={navigate} />
```

### Dynamic hue backgrounds

When hue is a runtime variable, use inline style — Tailwind cannot detect template
literal class names at build time:

```tsx
/* Correct */
<div style={{ backgroundColor: `var(--hue-${hue})` }} />

/* Wrong — Tailwind strips this at build */
<div className={`bg-[var(--hue-${hue})]`} />
```

### Storybook

`libs/ts-ui/.storybook/preview.ts` imports `organiclever.css` so all ts-ui stories
render with the warm OL palette. Dark mode toggle uses `.dark` class (Storybook
`addon-themes` with `withThemeByClassName({ dark: 'dark' })`).

## Component Architecture

Components live inside the bounded context that owns them, not in a global `src/components/` folder.

### Where components live

- **Context-owned**: `src/contexts/<bc>/presentation/components/` — components that belong to a specific bounded context
- **Shared primitives**: `@open-sharia-enterprise/ts-ui` — the shared design system library. Import from here, not from `src/`
- **App routing chrome**: `src/app/` — Next.js `page.tsx` and `layout.tsx` thin wrappers only; no business logic

```typescript
// Correct — import from bounded context barrel
import { JournalList } from "@/contexts/journal/presentation";
import { HistoryScreen } from "@/contexts/stats/presentation";

// Correct — import from ts-ui design system
import { Button, StatCard, TabBar } from "@open-sharia-enterprise/ts-ui";

// Wrong — no global src/components/ exists
import { SomeComponent } from "@/components/SomeComponent"; // ❌
```

### Server vs Client Components

**Default**: Server Components (no `"use client"` directive needed)

**Use Client Components when**:

- Interactive state (`useState`, `useReducer`, XState `useActor`)
- Browser APIs (IndexedDB, window, localStorage)
- Event handlers (`onClick`, `onChange`)
- React context consumers

The app layout mounts the PGlite runtime and XState `appMachine` in a client component (`app-runtime-context.tsx`). Per-tab `page.tsx` files are server components that render client presentation components.

## Next.js App Router Conventions

### Route Structure

```
src/app/
├── layout.tsx                  # Root layout — loads fonts, globals.css
├── page.tsx                    # Landing page (/) — server component
├── app/
│   ├── layout.tsx              # App shell layout — mounts PGlite runtime + appMachine
│   ├── home/page.tsx           # Home screen (/app/home)
│   ├── history/page.tsx        # History screen (/app/history)
│   ├── progress/page.tsx       # Progress screen (/app/progress)
│   ├── settings/page.tsx       # Settings screen (/app/settings)
│   ├── workout/page.tsx        # Active workout (/app/workout)
│   ├── workout/finish/page.tsx # Post-workout summary (/app/workout/finish)
│   └── routines/edit/page.tsx  # Routine editor (/app/routines/edit)
└── system/status/be/page.tsx   # Diagnostic page (force-dynamic, no cache)
```

Every `page.tsx` is a thin wrapper — it imports from the relevant bounded context's `presentation/` barrel and renders the screen component. No business logic in `page.tsx`.

## Vercel Deployment

### Production Branch

**Branch**: `prod-organiclever-web` → [https://www.organiclever.com/](https://www.organiclever.com/)  
**Purpose**: Deployment-only branch that Vercel monitors  
**Build System**: Vercel (Next.js auto-detected, no `builds` array needed)  
**Security Headers**: Configured in `vercel.json`

### vercel.json Configuration

```json
{
  "version": 2,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Deployment Process

**Step 1: Validate Current State**

```bash
# Ensure on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Must be on main branch"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Uncommitted changes detected"
  exit 1
fi
```

**Step 2: Force Push to Production**

```bash
# Deploy to production
git push origin main:prod-organiclever-web --force
```

**Step 3: Vercel Auto-Build**

Vercel automatically:

- Detects push to prod-organiclever-web branch
- Pulls latest code
- Builds Next.js 16 application
- Deploys to https://www.organiclever.com/

### Why Force Push

**Safe for deployment branches**:

- prod-organiclever-web is deployment-only (no direct commits)
- Always want exact copy of main branch
- Trunk-based development: main is source of truth

## Comparison with Other Apps

| Aspect              | organiclever-web                      | ayokoding-web                  | oseplatform-web         |
| ------------------- | ------------------------------------- | ------------------------------ | ----------------------- |
| **Framework**       | Next.js 16 (App Router)               | Next.js 16 (App Router)        | Next.js 16 (App Router) |
| **Architecture**    | DDD bounded contexts                  | Feature folders                | Feature folders         |
| **Storage**         | PGlite (local-first, IndexedDB)       | tRPC + database                | tRPC + database         |
| **Auth**            | None (local-first)                    | None                           | None                    |
| **State**           | XState + Effect TS                    | React state                    | React state             |
| **Build**           | Next.js (Vercel)                      | Next.js (Vercel)               | Next.js (Vercel)        |
| **Prod Branch**     | prod-organiclever-web                 | prod-ayokoding-web             | prod-oseplatform-web    |
| **Languages**       | English                               | Bilingual (Indonesian/English) | English only            |
| **Complexity**      | Full DDD life journal + local storage | Fullstack bilingual platform   | Simple landing page     |
| **Prod URL**        | www.organiclever.com                  | ayokoding.com                  | oseplatform.com         |
| **Primary Purpose** | Local-first life journal + landing    | Educational platform           | Project landing page    |

## Development Commands

### Option 1: Nx (host, recommended for frontend-only work)

```bash
# Start development server (http://localhost:3200)
nx dev organiclever-web

# Build for production (local verification)
nx build organiclever-web

# Type checking
npx tsc --noEmit --project apps/organiclever-web/tsconfig.json
```

### Option 2: Docker Compose (containerized, or running alongside the backend)

Runs the app inside a Node.js 24 Alpine container. Useful when you need the backend alongside the
frontend, or want an environment closer to CI.

```bash
# From repository root — starts organiclever-web in Docker
npm run organiclever-web:dev

# Or start the frontend container only
docker compose -f infra/dev/organiclever-web/docker-compose.yml up organiclever-web
```

**First startup** (~2-4 min): installs npm dependencies inside the container.
**Subsequent starts**: fast — `node_modules` is persisted in a named Docker volume.

> `node_modules` is intentionally isolated from the host via a Docker named volume to prevent
> Alpine Linux binary conflicts with macOS/Windows/Linux host binaries.

## Common Patterns

### Adding a feature to an existing bounded context

```typescript
// 1. Add term to specs/apps/organiclever/ubiquitous-language/<bc>.md (same commit as code)

// 2. Add Gherkin scenario in specs/apps/organiclever/fe/gherkin/<bc>/<file>.feature

// 3. Add step implementation in test/unit/steps/<bc>/<file>.steps.tsx

// 4. Implement domain type (if new aggregate field)
// src/contexts/<bc>/domain/types.ts

// 5. Implement use-case in application layer
// src/contexts/<bc>/application/my-use-case.ts

// 6. Implement PGlite store operation in infrastructure
// src/contexts/<bc>/infrastructure/<bc>-store.ts

// 7. Expose via barrel
// src/contexts/<bc>/application/index.ts  ← add export

// 8. Add/update React hook or component in presentation
// src/contexts/<bc>/presentation/use-<bc>.ts
// src/contexts/<bc>/presentation/index.ts  ← add export

// 9. Consume in Next.js page (thin wrapper only)
// src/app/app/<screen>/page.tsx
import { SomeScreen } from "@/contexts/<bc>/presentation";
```

### Using ts-ui components

```typescript
import {
  Button,
  Alert,
  Input,
  Icon,
  Toggle,
  StatCard,
  TabBar,
  SideNav,
} from "@open-sharia-enterprise/ts-ui";

<Button variant="teal">Primary action</Button>
<Button variant="sage" size="xl">Hero CTA</Button>
<Alert variant="success">Entry logged!</Alert>
<Icon name="dumbbell" size={24} />
<StatCard label="Streak" value={7} unit="days" hue="terracotta" icon="flame" />
```

## Content Validation Checklist

Before committing changes:

- [ ] TypeScript types are correct (no `any` without justification)
- [ ] Client components have `"use client"` directive
- [ ] Server components do NOT have `"use client"` directive
- [ ] Images use Next.js `<Image>` component (not `<img>`)
- [ ] Links use Next.js `<Link>` component (not `<a>` for internal links)
- [ ] All interactive elements are keyboard accessible
- [ ] New domain terms added to the relevant ubiquitous-language glossary
- [ ] `nx run organiclever-web:lint` exits 0 (0 boundary errors)

## Common Mistakes

### ❌ Mistake 1: Putting business logic in `src/app/` page files

**Wrong**: Business logic in `page.tsx`

**Right**: Business logic in the bounded context's `application/` or `presentation/` layers; `page.tsx` only renders the screen component.

### ❌ Mistake 2: Importing from another context's internal files

**Wrong**: `import { journalStore } from "@/contexts/journal/infrastructure/journal-store"` from settings

**Right**: `import { appendEntry } from "@/contexts/journal/application"` — always go through the barrel

### ❌ Mistake 3: Forgetting `"use client"` for interactive components

```typescript
// Wrong - useState in server component causes runtime error
export default function Counter() {
  const [count, setCount] = useState(0); // Error!
}

// Right
("use client");
export default function Counter() {
  const [count, setCount] = useState(0);
}
```

### ❌ Mistake 4: Direct commits to prod-organiclever-web

**Wrong**: `git checkout prod-organiclever-web && git commit`

**Right**: Commit to `main`, use `apps-organiclever-web-deployer` agent to force-push

## Reference Documentation

**Project Configuration**:

- [apps/organiclever-web/project.json](../../../apps/organiclever-web/project.json) - Nx project config
- [apps/organiclever-web/next.config.mjs](../../../apps/organiclever-web/next.config.mjs) - Next.js config
- [apps/organiclever-web/vercel.json](../../../apps/organiclever-web/vercel.json) - Vercel deployment config

**Infrastructure**:

- [infra/dev/organiclever-web/README.md](../../../infra/dev/organiclever-web/README.md) - Docker Compose setup for frontend
- [infra/dev/organiclever-web/docker-compose.yml](../../../infra/dev/organiclever-web/docker-compose.yml) - Service definition
- [infra/dev/organiclever-web/Dockerfile.web.dev](../../../infra/dev/organiclever-web/Dockerfile.web.dev) - Frontend container image

**Related Skills**:

- `repo-practicing-trunk-based-development` - Git workflow and branch strategy
- `swe-programming-typescript` - TypeScript coding standards

**Related Agents**:

- `apps-organiclever-web-deployer` - Deploys organiclever-web to production
- `swe-typescript-dev` - TypeScript/Next.js development
- `swe-e2e-dev` - E2E testing with Playwright

---

This Skill packages essential organiclever-web development knowledge for building and deploying the OrganicLever landing and promotional website at www.organiclever.com.

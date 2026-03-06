# organiclever-web

Landing and promotional website for [OrganicLever](https://www.organiclever.com/) — an individual productivity tracker with Sharia-compliant features.

**URL**: https://www.organiclever.com/

## Purpose

This app serves as the public-facing landing page for OrganicLever. It introduces the product, communicates its value proposition, and provides entry points for download and sign-up.

## Tech Stack

| Layer      | Technology               |
| ---------- | ------------------------ |
| Framework  | Next.js 16 (App Router)  |
| UI Runtime | React 19                 |
| Styling    | TailwindCSS              |
| Components | Radix UI / shadcn-ui     |
| Auth       | Cookie-based sessions    |
| Data       | JSON files (`src/data/`) |
| Deployment | Vercel (auto-detected)   |
| Port (dev) | 3200                     |

## Development

### Option 1: Nx (host, recommended for frontend-only work)

```bash
# Start development server (http://localhost:3200)
nx dev organiclever-web

# Build for production (local verification)
nx build organiclever-web

# Type checking
nx run organiclever-web:typecheck

# Lint (oxlint)
nx run organiclever-web:lint

# Run unit tests (pre-push gate)
nx run organiclever-web:test:quick

# Run unit tests explicitly
nx run organiclever-web:test:unit

# Run integration tests
nx run organiclever-web:test:integration

# Run E2E tests (app must be running first)
nx run organiclever-web-e2e:test:e2e
```

### Option 2: Docker Compose (containerized, or running alongside the backend)

Runs the app inside a Node.js 24 Alpine container. Useful when you need the backend alongside the
frontend, or want an environment closer to CI.

```bash
# From repository root — starts both organiclever-web and organiclever-be
npm run organiclever:dev

# Or start the frontend container only
docker compose -f infra/dev/organiclever/docker-compose.yml up organiclever-web
```

**First startup** (~2-4 min): installs npm dependencies inside the container.
**Subsequent starts**: fast — `node_modules` is persisted in a named Docker volume.

> `node_modules` is intentionally isolated from the host via a Docker named volume to prevent
> Alpine Linux binary conflicts with macOS/Windows host binaries.

## Project Structure

```
apps/organiclever-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard route
│   │   ├── login/              # Login route
│   │   ├── api/                # API route handlers
│   │   ├── contexts/           # App-level context providers
│   │   ├── fonts/              # Font assets
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Root page (landing)
│   ├── components/             # App-specific components (business logic, hardcoded content)
│   │   ├── Navigation.tsx      # Sidebar nav with app routes and logout
│   │   ├── Breadcrumb.tsx      # Pathname-aware breadcrumb
│   │   └── ui/                 # Generic UI primitives (shadcn-ui, data-agnostic)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       └── ...
│   ├── contexts/               # Shared React contexts
│   ├── data/                   # JSON data files
│   └── lib/                    # Utility functions and helpers
├── public/                     # Static assets
├── .storybook/                 # Storybook configuration
├── components.json             # shadcn-ui configuration
├── next.config.mjs             # Next.js configuration
├── postcss.config.mjs          # PostCSS + TailwindCSS v4 configuration
├── tsconfig.json               # TypeScript configuration
├── vercel.json                 # Vercel deployment configuration
├── vitest.config.ts            # Vitest workspace config (unit + integration projects)
└── project.json                # Nx project configuration
```

## Component Architecture

Components are split across two levels with a strict boundary:

### `src/components/ui/` — Generic UI primitives

- Generated and managed by the shadcn-ui CLI (`npx shadcn-ui add ...`)
- Built on Radix UI primitives, zero business logic
- No hardcoded content, routes, or app-specific data
- Portable — could be dropped into any project unchanged
- Examples: `Button`, `Card`, `Input`, `Dialog`, `Table`

### `src/components/` — App-specific components

- Compose `ui/` primitives with business logic and app content
- May have hardcoded routes, brand strings, or prop contracts tied to this app
- Not portable — tightly coupled to organiclever-web's domain
- Examples: `Navigation` (hardcodes `/dashboard` routes and "Organic Lever" brand), `Breadcrumb` (reads live pathname)

**Why keep them separate:**

1. **shadcn-ui CLI safety** — `npx shadcn-ui add <component>` writes directly into `ui/`. App-specific files placed there risk being overwritten without warning.
2. **Abstraction clarity** — Developers expect `ui/` to contain drop-in primitives. Finding opinionated, app-coupled components there is confusing and breaks that contract.
3. **Portability boundary** — `ui/` components can be extracted into a shared design system. App-specific components cannot. Mixing them makes future extraction painful.

**Rule:** if a component has hardcoded routes, brand content, or props tied to this app's domain, it belongs in `src/components/`, not `src/components/ui/`.

## Deployment

**Branch**: `prod-organiclever-web` → [https://www.organiclever.com/](https://www.organiclever.com/)

Vercel monitors `prod-organiclever-web` and auto-builds on every push. Never commit directly to this branch — it is deployment-only. To deploy:

```bash
# From main branch with clean working tree
git push origin main:prod-organiclever-web --force
```

Use the `apps-organiclever-web-deployer` agent for guided deployment.

## Testing

`organiclever-web` uses a three-tier testing strategy. Integration and E2E share the same Gherkin
specs from [`specs/apps/organiclever-web/`](../../specs/apps/organiclever-web/).

| Tier        | Tool                     | Location                                      | Command                                    | Requires service? | Cached? |
| ----------- | ------------------------ | --------------------------------------------- | ------------------------------------------ | ----------------- | ------- |
| Unit        | Vitest + RTL             | `src/components/*.unit.test.tsx`              | `nx run organiclever-web:test:unit`        | No                | Yes     |
| Integration | Vitest + vitest-cucumber | `src/test/integration/*.integration.test.tsx` | `nx run organiclever-web:test:integration` | No                | Yes     |
| E2E         | playwright-bdd           | `apps/organiclever-web-e2e/`                  | `nx run organiclever-web-e2e:test:e2e`     | Yes (port 3200)   | No      |

`test:quick` runs unit + integration in parallel (no running server needed).

### Integration tests

Integration tests use `@amiceli/vitest-cucumber` to read the same Gherkin `.feature` files as the
E2E suite. All external dependencies (Next.js router, auth context, API calls) are fully mocked via
MSW — no running server is required. Because they are fully deterministic, integration tests are
**cached** by Nx (`cache: true`). RTL components import from `@testing-library/react/pure` to
prevent auto-cleanup between Cucumber steps; `AfterEachScenario` calls `cleanup()` once per
scenario.

## E2E Tests

E2E tests live in [`apps/organiclever-web-e2e/`](../organiclever-web-e2e/). See that directory's README for details.

## Related

- **Skill**: `apps-organiclever-web-developing-content` — full development reference
- **Agent**: `apps-organiclever-web-deployer` — deploys to production
- **Agent**: `swe-e2e-test-developer` — E2E testing with Playwright

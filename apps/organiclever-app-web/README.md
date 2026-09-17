# OrganicLever app web

The OrganicLever web client is an in-progress, local-first life journal and
productivity tracker. It provides journaling, routines, workout sessions,
history and progress views, and user preferences in a responsive Next.js app.

> **Pre-alpha:** The product and its browser data model are still evolving. Do
> not treat local browser data as a durable backup.

## Get running

From the repository root, install the workspace dependencies, then start the
app:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:dev
```

Open <http://localhost:3202>. The root route redirects to `/app/home`; `/app`
permanently redirects there as well.

The development target generates the journal migration index before launching
Next.js. It needs no backend or environment variables for normal local-first
use.

## Local data and optional backend probe

Journal, routine, settings, and progress data are stored in the current
browser with PGlite on IndexedDB. The app initializes and migrates that storage
when the application shell starts. Clearing this site's browser storage removes
the local data.

The backend is optional. To let the diagnostic page at `/system/status/be`
probe its health endpoint, copy the app's example environment file to a local,
untracked `.env.local` file and set the backend URL:

```bash
ORGANICLEVER_BE_URL=http://localhost:8202
```

When this value is unset, the diagnostic page reports that no backend is
configured. The app does not require it for its primary experience.

See [`.env.example`](./.env.example) for the supported local development
variables, including optional Next.js host and port overrides.

## Everyday commands

Run these from the repository root.

| Command                                                                                                                          | Purpose                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:dev`              | Generate migrations and start Next.js on port 3202.                                       |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:build`      | Generate migrations, regenerate contract types, and create a production build.            |
| `./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:start`            | Serve an existing production build on port 3202.                                          |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:codegen`    | Regenerate TypeScript types from the bundled OrganicLever OpenAPI contract.               |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:typecheck`  | Check TypeScript types.                                                                   |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:lint`           | Run Oxlint accessibility checks and ESLint.                                               |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:test:unit`      | Run unit tests.                                                                           |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:test:quick` | Run the local quality gate: type checks, lint, unit tests, coverage, and spec validation. |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:test:coverage`  | Validate all applicable static behaviour coverage adapters.                               |
| `./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-app-web:storybook`        | Start Storybook on port 6006.                                                             |

`build`, `typecheck`, and `codegen` consume the `organiclever-contracts`
project's bundled OpenAPI document. Nx builds that dependency when needed.

## What to explore

| Area                | Routes                                                      | Notes                                                    |
| ------------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| Daily journal       | `/app/home`                                                 | View journal activity, routines, and entry logging.      |
| Workout routines    | `/app/routines/edit`, `/app/workout`, `/app/workout/finish` | Create a routine and record a workout session.           |
| Progress            | `/app/history`, `/app/progress`                             | Review recorded sessions and derived progress.           |
| Preferences         | `/app/settings`                                             | Change theme and language preferences.                   |
| Backend diagnostics | `/system/status/be`                                         | Optionally probe the configured backend health endpoint. |

## Code map

```text
apps/organiclever-app-web/
├── src/app/        # Next.js App Router pages and route layouts
├── src/contexts/   # Bounded contexts: journal, routine, settings, stats, and more
├── src/shared/     # Cross-context runtime primitives and utilities
├── scripts/        # Build-time helpers, including migration-index generation
└── test/           # Gherkin-backed Vitest step implementations
```

The `/app` layout creates one browser-side PGlite runtime, initializes journal
migrations, and shares it with the bounded contexts. XState coordinates app
shell and workout-session state; Effect provides the typed runtime and
infrastructure composition.

## Engineering references

- [Frontend architecture](../../specs/apps/organiclever/app-web/architecture.md)
  — bounded contexts and their boundaries.
- [Routes and screens](../../specs/apps/organiclever/app-web/routes-and-screens.md)
  — intended UI surface and navigation.
- [Design system](../../specs/apps/organiclever/app-web/design-system.md)
  — visual and interaction guidance.
- [OrganicLever specifications](../../specs/apps/organiclever/README.md) — one corpus per
  deployed surface.
- [Frontend Gherkin specifications](../../specs/apps/organiclever/app-web/behaviours/README.md)
  — executable behaviour source of truth.
- [Browser E2E suite](../organiclever-app-web-e2e/README.md) — Playwright coverage
  for this client.

## BDD and Testing

The canonical corpus is `specs/apps/organiclever/app-web/behaviours/`. This project owns the Unit
adapter through `test:unit`; the dedicated `organiclever-app-web-e2e` project owns the public
browser runtime. Matching `test:coverage:*` targets validate both adapters statically. Integration
and owner-local E2E runtime are omitted because the client owns no non-networked local-resource
boundary and the dedicated project owns browser execution.

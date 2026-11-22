# OrganicLever public website

The pre-alpha marketing site for [OrganicLever](../../specs/apps/organiclever/overview.md), a local-first life journal for recording and reviewing everyday activity. It serves the public landing experience at the domain root; the product client is a separate application, [`organiclever-app-web`](../organiclever-app-web/README.md).

This project is intentionally simple: it renders static Next.js marketing content, has no dedicated backend API, and does not persist application data. That makes it a good place for an early engineer to work on the public story, visual system, and accessible landing-page behaviour without coupling to product runtime concerns.

## Run locally

From the workspace root, after installing the workspace dependencies:

```bash
./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- dev organiclever-www
```

Open <http://localhost:3200>. Stop the server with `Ctrl+C`.

No project-specific environment variables are required. The checked-in [`.env.example`](./.env.example) documents only optional Next.js framework settings; the app itself defines none.

## Where to look first

- [`src/app/`](./src/app/) — Next.js App Router entry point, metadata, and global styles.
- [`src/features/home/`](./src/features/home/) — landing-page composition: hero, feature cards, weekly-rhythm preview, and principles.
- [`src/features/app-shell/`](./src/features/app-shell/) — shared landing navigation and footer.
- [`tests/unit/steps/`](./tests/unit/steps/) — Vitest Cucumber step definitions for the marketing and accessibility scenarios.
- [`specs/apps/organiclever/www/behaviours/frontend/`](../../specs/apps/organiclever/www/behaviours/frontend/README.md) — executable acceptance criteria shared by unit and E2E tests.

## Engineering shape

- Next.js 16 App Router with React 19 and TypeScript.
- Tailwind CSS v4 plus the shared `@open-sharia-enterprise/web-ui` design system.
- The landing content is built from feature components rather than a product-state or database layer.
- Vercel builds this app with `next build`; the deployment configuration considers the `prod-organiclever-www` branch.

## Validate a change

Run these from the workspace root.

| Command                                                                                                                  | Purpose                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- build organiclever-www`      | Create a production build.                                                                 |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-www:typecheck`  | Check TypeScript without emitting files.                                                   |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-www:lint`       | Run the accessibility-aware source lint.                                                   |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-www:test:unit`  | Run the unit-level Gherkin step tests.                                                     |
| `./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-www:test:quick` | Run the focused quality gate: type check, lint, unit tests, coverage, and spec validation. |

Browser E2E tests belong to the paired
[`organiclever-www-fe-e2e`](../organiclever-www-fe-e2e/README.md) project. Use
`./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run organiclever-www-fe-e2e:test:e2e`
when a change needs browser-level verification.

## Related context

- [OrganicLever product overview](../../specs/apps/organiclever/overview.md) — the product direction and current capabilities.
- [Marketing site architecture](../../specs/apps/organiclever/www/architecture.md) — the as-built site and the tRPC surface behind it.
- [Marketing behaviour specs](../../specs/apps/organiclever/www/behaviours/frontend/README.md) — the landing page’s acceptance criteria.
- [System architecture application reference](../../docs/reference/system-architecture/applications.md) — monorepo-level application context.

## BDD and Testing

The canonical corpus is `specs/apps/organiclever/www/behaviours/`. This project owns the Unit
adapter through `test:unit`; `organiclever-www-fe-e2e:test:e2e` owns the applicable public browser
runtime. `test:behaviour:coverage` validates both adapters statically. Integration and
owner-local E2E runtime are omitted because the site has no backend or other non-networked
local-resource boundary and the dedicated project owns browser execution.

## Unit Tests, Coverage, and Lint

- `test:unit` measures every file under `src/**` with Vitest v8 and fails below 99% lines. Route files
  (`src/app/layout.tsx`, `src/app/page.tsx`) and `src/env.ts` are tested with a font and feature double and the empty
  env schema; there are no production exclusions.
- Coverage exclusion, category N (non-production code): `src/test/**` holds the Vitest setup and the
  `IntersectionObserver` double.
- Unit tests under `tests/unit/**` are hermetic. `oxlint.json` bans file-system, process, network, timer, clock,
  randomness, environment, and `process.cwd` access there. The ban is the `test:quick` lint target. Steps built with
  `@amiceli/vitest-cucumber` count `Given`, `When`, `Then`, and `And` as test blocks for `no-standalone-expect`.
- `react/react-in-jsx-scope` is off: the project uses the automatic JSX runtime, so the rule flags valid code.
- `next-env.d.ts` is generated by Next.js and is excluded from lint.
- Lint fails on warnings (`--deny-warnings`), so no finding passes silently.

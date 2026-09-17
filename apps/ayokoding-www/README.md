# ayokoding-www

AyoKoding is the learning side of this repository: a bilingual site for people building practical
software skills. It turns Markdown content into a fast, searchable learning experience in English
and Indonesian. 🌱

## Start here

From the repository root:

```bash
# Refresh tracked content indexes transactionally
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:generate-indexes

# Start the local site at http://localhost:3101 without a second generator pass
./hippo run --class service --resource-tier standard --disk-path . --cwd apps/ayokoding-www -- \
  node ../../scripts/next-with-port.mjs dev --env AYOKODING_WWW_PORT --default 3101

# Run the project’s quick quality gate
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:test:quick
```

The transactional preflight refreshes content indexes before the service starts. Use
`./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:build` when
you need production-build evidence, or
`./hippo run --class service --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-www:start` to serve a
completed local build.

## How the app is shaped

- `content/` holds the lessons and pages readers see.
- `src/features/content/` reads and renders that content.
- `src/features/search/` builds the local search data.
- `src/features/i18n/` provides English and Indonesian routes.
- `src/features/course-paths/` groups learning material into guided paths.

The app keeps pure decisions in a feature’s `core/` directory and browser, filesystem, and Next.js
work in `shell/`. That boundary makes content behaviour easier to test without requiring a running
site.

## Checks and tests

```bash
npm exec -- nx run ayokoding-www:typecheck
npm exec -- nx run ayokoding-www:lint
npm exec -- nx run ayokoding-www:test:unit
npm exec -- nx run ayokoding-www:test:integration
npm exec -- nx run ayokoding-www:test:coverage
npm exec -- nx run ayokoding-www:test:quick
```

The canonical corpus is `specs/apps/ayokoding/www/behaviours/`. This owner runs mandatory Unit
proof through `test:unit` and real isolated build-tool/local-resource proof through
`test:integration`; Integration runs manually or in the scheduled delivery workflow, never inside
`test:quick` or a Git hook. The static `test:coverage:*` targets validate Unit, Integration, and E2E
bindings without running tests. Dedicated `ayokoding-www-fe-e2e` and `ayokoding-www-be-e2e`
projects own the public browser/HTTP runtime, so only the owner-level `test:e2e` target is omitted.
See [the AyoKoding specs](../../specs/apps/ayokoding/README.md).

## Delivery boundary

This pre-alpha site is delivered through the repository’s automated workflow. Keep local work on
the normal branch and worktree flow; do not push deployment branches by hand.

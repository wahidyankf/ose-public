# ayokoding-web

Go (`net/http` + `html/template`) + htmx rewrite of the bilingual AyoKoding
learning site. P1H owns the godog harness, the module scaffold, and the
in-memory doubles; domain logic lands in P2.

## Run

```bash
go run ./cmd/ayokoding-web                 # listens on 127.0.0.1:3102
go run ./cmd/ayokoding-web --port 3200     # explicit flag wins
AYOKODING_WEB_PORT=3200 go run ./cmd/ayokoding-web
```

Port precedence: `--port` flag, then `AYOKODING_WEB_PORT`, then 3102. Bare
`PORT` is ignored. Test servers use `AYOKODING_WEB_PORT=3191`.

## Corpus

A default start serves the real corpus: the repository's content and course manifests. The launcher finds the
repository root as the nearest ancestor of the working directory that holds `repo-config.yml`. The content root is the
first existing of `apps/ayokoding-web/content` and `apps/ayokoding-www/content`. The manifests root is the first existing
of `apps/ayokoding-web/manifests` and `apps/ayokoding-www/src/features/course-paths/manifests`.

`AYOKODING_WEB_CONTENT_DIR` and `AYOKODING_WEB_MANIFESTS_DIR` name either root explicitly. A root that cannot be read
stops startup before the listener opens, and the server never falls back to the fixture.

The canned fixture is served only when one is selected, with `--fixture parity` (or `unavailable-catalog`) or with
`AYOKODING_WEB_FIXTURE`. It is for owned tests and authoring. Drafts stay hidden unless `AYOKODING_WEB_SHOW_DRAFTS=true`.

## Targets (from the worktree root)

```bash
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-web:test:quick
rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ayokoding-web:test:integration
```

`test:quick` runs lint, typecheck, Unit (99% floor), and the static behaviour
gates. Integration and browser E2E never run inside quick. Runtime E2E
proof lives in two dedicated owners: `ayokoding-web-be-e2e` proves the HTTP-only
scenarios request by request, and `ayokoding-web-fe-e2e` proves the browser
scenarios (`<owner>:test:e2e`). The `e2e` adapter reference checked by
`test:behaviour:coverage` only asserts that the corpus keeps its shape for those
owners; it runs no browser or server here.

## Parity tools

`cmd/parity` (logic in `internal/parity`) is the owner's tool for the parity plan. Run it from the repository root with
`go -C apps/ayokoding-web run ./cmd/parity <subcommand>`. Relative paths resolve against the repository root.

- `inventory --sitemap FILE --source-revision REV [--routes DIR] [--export FILE] [--out FILE]` writes the old site's URL
  inventory as JSON. The sitemap is a file saved from the old app's `/sitemap.xml`, so the command makes no network call.
  The redirect export defaults to `internal/web/testdata/www-redirects.json`, which the recorded Node command in the
  plan's P3-Inventory unit writes from the old www redirect modules.
- `gap-report --inventory FILE --base-url URL` requests each inventory URL once, follows no redirect, and prints a
  markdown report. A 200 passes, a 308 is recorded and not followed, and any other status fails, grouped by cause.

## Layout

- `cmd/ayokoding-web` — launcher: flag/env resolution, listener.
- `cmd/parity` — parity tools entry (`inventory`, `gap-report`); see above.
- `internal/parity` — parity inventory and gap report logic; reads only through an injected host.
- `internal/web` — router, config, templates, fixture seed.
- `internal/content`, `internal/coursepaths`, `internal/search`,
  `internal/tools/benchmark`, `internal/tools/calculator` — domain doubles.
- `tests/bdd` — godog glue over `specs/apps/ayokoding/web/behaviours`.
- `tests/integration`, `tests/fixtures` — httptest suites and synthetic corpus.
- `assets/js` — browser progress stubs (Vitest wiring lands in P2).

## Corpus wording debt

Four canonical step texts still name the pre-Go stack (`Next.js build
artifact`, `LiveView event`, `Phoenix server`, `TypeScript and Elixir`); P1H
binds them to the Go+htmx equivalents and the landing unit rewords the corpus
per tech-docs/005. No production progress record ever leaves the browser.

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

## Targets (from the worktree root)

```bash
rtk ./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- run ayokoding-web:test:quick
rtk ./hippo run --class ephemeral --resource-tier heavy --disk-path . -- npm exec nx -- run ayokoding-web:test:integration
```

`test:quick` runs lint, typecheck, Unit (99% floor), and the static behaviour
gates. Integration and browser E2E never run inside quick. Runtime browser E2E
belongs to the future `ayokoding-web-e2e` owner, not to a duplicate target
here; that project does not exist yet in P1H.

## Layout

- `cmd/ayokoding-web` — launcher: flag/env resolution, listener.
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

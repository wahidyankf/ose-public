# Evidence — Phase 3/4 Wiring: `examples sync` and `toolchains build`

Worktree `worktrees/ayokoding-learn-revamp-05-code-harness/`, branch
`ayokoding-learn-revamp-05-code-harness`. All commands ran from
`apps/ayokoding-cli/` unless noted; `go` runs directly (same toolchain the
`hippo`/`nx` wrappers use). No commit, no push, no folder moves.

## Files changed (all inside the owned set)

Created: `internal/application/sync.go`, `internal/application/build.go`,
`internal/application/sync_test.go`, `internal/application/build_test.go`,
`internal/adapters/cli/sync_cmd.go`, `internal/adapters/cli/build_cmd.go`,
`internal/adapters/cli/sync_test.go`, `internal/adapters/cli/build_test.go`,
and this file.
Edited: `internal/adapters/cli/root.go` (two `RunE` bodies only),
`internal/application/application.go` (`selectCourses` takes explicit
selection fields so `Validate` and `Sync` share it; package doc names sync),
`internal/adapters/cli/validate_test.go` (the two superseded refusal rows
only). `tests/bdd/steps_test.go` needed no wiring change: agent B's
bindings already invoke the real commands.

## Wiring

- `application.Sync(req)` mirrors `application.Validate`: shared
  `selectCourses`, per-course `content.Check(course, sub)`, global
  `sortFindings`. Sync takes no catalog. With `Write`, each selected course
  walks its lessons (same Markdown-outside-code-roots view as the check),
  repairs stale anchored fences via `content.RewriteLesson`, persists via
  `content.WriteUpdates(courseDir, updates)`, then re-checks for the exit
  status. Repairs need `ContentDir`; without one and with pending repairs it
  is a usage error.
- `runSync` mirrors `runValidate` (no catalog): `--course`,
  `--include-inert`, `--write`, `--content` existence check, findings through
  `renderFindings`, `statusError{1}` on findings.
- `application.Build(ctx, req)` builds named derived images in order over an
  `ImageBuilder` port (declared where consumed; `containers.Builder`
  implements it; tests carry a stub). No IDs, unknown IDs, and recipe-less
  (official/service) IDs are usage errors. The Dockerfile comes from
  `toolchains.Files()` at `entry.Build`. The base reference is the
  Dockerfile's final pinned `FROM` (mirroring
  `TestCatalogDerivedTagsMatchRecipes`), never `entry.Image`.
- `runBuild` loads the catalog, reads settings from `AYOKODING_CONTAINER_CLI`
  (default docker) and `AYOKODING_BUILDX_CACHE`, passes
  `containers.Builder{}`, prints `id tag` per build (text or
  `--output json`), and lets the coded builder error render through the
  existing renderer (exit 2).
- Phase-2 test update: `TestValidateAndList/unpinned_embedded_catalog_refuses_*`
  now assert the pinned catalog loads (`status 0`; list names `python` and
  `@sha256:`). The refusal path stays covered by the catalog domain tests
  and `tests/testdata/catalog-unpinned.yaml`.

## RED records (every failure an assertion, never a build error)

Baseline before any edit:

```text
--- FAIL: TestValidateAndList/unpinned_embedded_catalog_refuses_validation
    validate_test.go:127: status=0, want 2 (stdout="" stderr="")
--- FAIL: TestValidateAndList/unpinned_embedded_catalog_refuses_the_list
    validate_test.go:127: status=0, want 2 (stdout="dart language ..." stderr="")
```

BDD unit: `--- FAIL: TestContract` (the eight `markdown-file-sync`
scenarios fail with `ayokoding.usage.not-implemented`; 24 pre-existing pass).

New `application` sync tests against compiling stubs: every behavioral row
fails, e.g. `findings=[], want one mismatch and one missing-file`,
`Sync succeeded, want invalid-arguments`, `Sync succeeded, want an open
failure`. New `application` build tests against a stub `Build`: all six
fail, e.g. `built=[], want one typescript tag`,
`Build succeeded, want missing-selection`.

New CLI sync tests against the unwired tree: five fail, e.g.
`status=2, want 0 (stdout="" stderr="Error:
ayokoding.usage.not-implemented: command ayokoding-cli examples sync is not
implemented yet...")`. (The missing-content row already expects 2.)

## GREEN records

```text
ok .../internal/application 1.029s        # -race
ok .../internal/adapters/cli 1.218s       # -race
ok .../tests/bdd 0.067s                  # AYOKODING_BDD_ADAPTER=unit, all 32 scenarios
```

Full module: `go build ./...` exit 0; `go test -count=1 ./...` — all 14
packages `ok`, no failures (includes `tests/integration`).

Real binary proofs (`go build -trimpath -o /tmp/ayokoding-cli
./cmd/ayokoding-cli`):

- `examples sync --course green-python` → exit 0, empty output.
- `examples sync --course broken-sync` → exit 1 with the nine probe
  findings in line order (mismatch, missing-file, bad-range,
  anchor-without-fence, indented-fence, unanchored-fence,
  unanchored-output, crlf, unreferenced-unit) — byte-identical to the
  Phase 4 probe.
- Temp copy of `green-python` with a corrupted fence: `sync --write` →
  exit 0, fence bytes restored; second `sync` → exit 0, file unchanged.
- `toolchains build lua` through an argv-logging shim round real `docker`:
  `buildx build --load --tag
ayokoding-toolchain/lua:3b2f3dc54d52710af0d9961a36317b2cfa88c1738bc7869ae1dad19e6283e7b0
--file Dockerfile <ctx>`; context dir holds the Dockerfile; the tag is
  byte-identical to `catalog.yaml`. (Before the base-reference fix the same
  run emitted `.../lua:5813bf0f...`, proving the defect and the fix.)
- A failing container CLI maps to exit 2 naming
  `ayokoding.examples.env-build-failed` with the trailing log.

Gates:

- `COVERAGE_MINIMUM=99 ./scripts/coverage-gate.sh` → exit 0.
- `nx run ayokoding-cli:test:coverage` (CLI-BEHAVIOUR, four adapters) →
  success.
- `nx run ayokoding-cli:test:integration` (BDD integration + signals) →
  success.
- `nx run ayokoding-cli:test:e2e` (built binary, e2e adapter) → success.
- `node --test scripts/format-staged.test.mjs
scripts/workflow-language-lanes.test.mjs
scripts/behaviour-coverage.test.mjs` → fail 0.
- `go tool nilaway ... ./...` → exit 0, no output.
- `go tool shfmt -d scripts` → exit 0. `gofumpt --diff` → empty.
- `nx run ayokoding-cli:test:quick` → FAILS at `lint` on the single
  finding below; `typecheck`/`unit`/`coverage` never run under it (each
  passes standalone above).

## BLOCKING: one lint finding outside the owned file set

```text
internal/adapters/cli/cli.go:66:17: Function
`newRoot->buildCommand->buildCommand$1` should pass the context parameter
(contextcheck)
```

Root cause: `contextcheck` ("uses a non-inherited context") requires every
function that passes a context to a context-first callee to receive it as a
parameter. `toolchains build` is the first leaf that needs cancellation
(`containers.Builder.BuildDerived` takes `ctx`), but cobra fixes the `RunE`
signature, so the chain `newRoot → buildCommand → closure` cannot receive
one — the only source is `cmd.Context()` inside the closure. The checker
reports the chain head's call site, `cli.go:66`, which is outside this
agent's file set, as is `.golangci.yml`. No owned-file shape satisfies it:
any context value (including `Background`) flowing into any context
parameter under `newRoot` reports at the same line; dropping the context
would orphan the `docker buildx` child on SIGINT. A `//nolint` at the
boundary was tried and rejected as unused (`nolintlint`), confirming the
position lock.

Fix options for root (mirrors the Agent A exclusion precedent already in
`.golangci.yml`): thread `ctx` from `execute()` into `newRoot` (touches
`cli.go`), add a narrow path exclusion, or record a reasoned
`contextcheck` disable. Phase 5 (`examples run`) will need the same
disposition. The wired code itself is correct and fully verified above.

## Judgment calls (for root review)

- `toolchains build` with no IDs is `ayokoding.usage.missing-selection`
  (exit 2), matching the repo's explicit-selection strictness; official or
  service IDs are `invalid-arguments` (the runtime pulls those by digest).
- The handoff's `@sha256:`-strip note does not apply to the build path:
  the base stays digest-pinned end to end (the plan hashes its digest into
  the tag). It likely concerns Phase 5 runs of `--load` images, which carry
  no registry digest.
- `application` imports `adapters/content` for `Check`/`RewriteLesson`/
  `WriteUpdates` per the handoff recipe; no architecture rule denies it and
  `TestProductionGraphPasses` is green. The three code-root constants are
  duplicated with a merge-may-export comment, matching the existing
  layout/content duplication.
- `examples sync` selection names a course "as if opted in", so the
  tech-docs note ("`--write` never applies to an inert course unless named")
  falls out of selection with no extra logic.
- A real daemon build in this environment fails identically for a
  hand-written control context (`transferring context: 2B`), so image bytes
  were proven through the fake-CLI and shim runs instead of a registry
  build; AC-3.3 image builds remain as agent A recorded them.

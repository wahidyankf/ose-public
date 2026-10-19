# Phase 2 Validate — Evidence

Worktree `worktrees/ayokoding-learn-revamp-05-code-harness/`, branch
`ayokoding-learn-revamp-05-code-harness`. All paths below are
worktree-root-relative. Tool note: the plan's `rtk ./hippo run` wrappers admit
through HIPPO; this sandbox runs the same commands directly (`go` with cwd
`apps/ayokoding-cli`, `npm exec nx --` from the worktree root, the built
binary for `FIXTURE`). Go toolchain `go1.27.2`; the module pins
`go 1.26.1` with `toolchain go1.26.9`.

## Gherkin first

Created `specs/apps/ayokoding/cli/behaviours/examples/README.md`,
`behaviours/toolchains/README.md`,
`behaviours/examples/run-spec-validation.feature` (6 scenarios),
`behaviours/examples/content-layout.feature` (4),
`behaviours/examples/static-mode.feature` (outline + services, the two
non-run scenarios; Phase 5 adds the run scenario), and
`behaviours/toolchains/toolchain-catalog.feature` (3), every exemption
comment written above its tag.

Deviation (recorded): `CLI-BEHAVIOUR` does **not** fail at Gherkin time in
this codebase. The `tests/bdd` dispatchers are catch-all `^(.*)$`
registrations, so the static coverage script matches every new step and the
gate stays green (5 features, 24 expanded scenarios, exit 0). The genuine
RED is the godog runtime with `Strict: true`: `BDD unit` (`go test
-count=1 ./tests/bdd`) fails exactly the 16 new scenarios, all on step
assertions, no build errors:

```text
24 scenarios (8 passed, 16 failed)
87 steps (31 passed, 16 failed, 40 skipped)
step assertion failed: unknown given step "an opted-in course"
step assertion failed: unknown given step "a unit whose run spec has the key \"expected_output\""
... (one unknown-step failure per new scenario)
```

## AC-2.1 — run.yaml decoding and every validation rule

Closed codes added to `internal/domain/finding`: 30 `ayokoding.runspec.*`
codes (unknown-key, duplicate-key, invalid-type, missing/invalid-schema,
missing/unknown-toolchain, unknown-mode, unknown-static-reason,
missing-static-note, static-with-services, unknown-service, missing-runs,
too-many-runs, duplicate-run, invalid-run-name, unknown-run-kind,
missing-command, timeout-out-of-range, missing/exit-out-of-range,
missing-stdout, invalid-stderr, invalid-expected-file, path-escape,
memory-out-of-range, cpus-out-of-range, invalid-env-name, reserved-env,
missing-invariant).

RED (`GO-TEST ./internal/domain/runspec/...`, exit 1): table tests written
first against a stub `Parse` returning no findings; every row fails on
assertion, e.g. `codes=[], want ["ayokoding.runspec.unknown-key"]`.

GREEN: strict decoding (`yaml.Node` walk for duplicates and unknown keys
with exact lines, then `KnownFields(true)` typed decode for wrong types),
then semantic rules in field order with resolved defaults (kind example,
timeout 60s, workdir `.`, memory 1g, cpus 2, stderr empty, check/test
invariant default). Rerun exit 0. Two fix rounds, both assertion-driven:
the stub catalog `Lookup` (AC-2.2) forced `unknown-toolchain` everywhere,
and a bare stderr word needed `invalid-stderr` instead of the file code.

REFACTOR: one `checkCoursePath` helper serves run paths, stdin, workdir,
and the lockfile path. `CLI-QUICK` exit 0 (see gate).

## AC-2.2 — The catalog model

Closed codes: 11 `ayokoding.catalog.*` codes (unknown-key, duplicate-key,
invalid-type, missing/invalid-schema, missing-id, duplicate-toolchain,
invalid-kind, unpinned-image, invalid-service, invalid-ready-timeout).

RED (`GO-TEST ./internal/domain/catalog/...`, exit 1): decoding, kind,
service, timeout, `DerivedTag` sensitivity, `Hash` shape, and `Load`
refusal rows fail on assertion against stubs (e.g. `codes=[], want
["ayokoding.catalog.unknown-key"]`).

GREEN: `Decode`, `Load(fs.FS)`, `Lookup`, `DerivedTag` (SHA-256 over base
digest, Dockerfile bytes, build arguments; tag
`ayokoding-toolchain/<id>:<hash>`), and `Hash` (hex SHA-256 of the catalog
bytes). `toolchains/catalog.yaml` carries all 27 entries from tech-docs/005
at the Phase 0 versions with `@sha256:PENDING` placeholders, plus
`toolchains/toolchains.go` (`go:embed`). Rerun exit 0.

REFACTOR: the embedded catalog sits behind `catalog.Load(fs.FS)` via
`toolchains.Files()`, so tests inject the pinned test catalog
(`tests/testdata/catalog.yaml`: python + postgres, shape-valid fixture
digests). Untested-catalog refusal is a closed `*finding.Error`.

## AC-2.3 — Unit discovery, opt-in, and layout findings

RED (`GO-TEST ./internal/domain/layout/...`, exit 1): `fstest.MapFS` tests
for discovery (examples, katas, capstone root), opt-in, the four layout
codes, shared-file silence, and applicability fail on assertion against
stubs (e.g. `units=[], want 3`).

GREEN: `Discover` (unit patterns `ex-NN-slug`/`kata-NN-slug`, capstone root
as one unit, flat-example, unplaced-code for non-unit and stray `code`
dirs, misplaced-run-spec), `MissingSpecs`, `IsOptedIn` (any run.yaml),
`IsApplicable` (code dir with files, or a code fence). Rerun exit 0.

REFACTOR: `CLI-QUICK` exit 0 (see gate).

## AC-2.4 — examples validate and toolchains list

RED: application tests (`Validate` selection by `--course`, opted-in
default, `--include-inert`; `Toolchains.List` id order) fail on assertion
against stubs (e.g. `findings=[], want one unknown-key`); CLI tests
(`internal/adapters/cli/validate_test.go`: text + JSON finding shape
`{code, course, path, line, message}`, list shape, determinism double
render) fail with `ayokoding.usage.not-implemented`, exit 2.

GREEN: `internal/application` (`Validate` over `fs.FS`, deterministic
course/path/line/code order; `ListToolchains` sorted), text/JSON renderers,
and wired `examples validate` (`--course`, `--include-inert`) plus
`toolchains list`, removing `not-implemented` from exactly these two
commands. Findings exit 1, clean exits 0, catalog refusal and usage errors
exit 2. `--version` names the embedded catalog hash when no stamp is set
(`internal/bootstrap` default catalog stamp is now empty; the stamped
`testcatalog` E2E build is untouched). Rerun exit 0.

REFACTOR: `CLI-QUICK` exit 0 (see gate).

## AC-2.5 — Fixtures and scenario bindings

Fixtures under `tests/testdata/`: `catalog.yaml` (pinned),
...[truncated 2085 chars]

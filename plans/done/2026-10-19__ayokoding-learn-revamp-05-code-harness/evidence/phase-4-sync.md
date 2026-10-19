# Evidence — Phase 4: Anchors and Sync (Agent B)

Scope: `internal/domain/anchors/**`, `internal/adapters/content/sync*.go`,
sync step bindings in `tests/bdd/steps_test.go`, `scripts/format-staged`
plus its test, fixture courses `broken-sync` and `green-python`, the new
`specs/apps/ayokoding/cli/behaviours/examples/markdown-file-sync.feature`,
and this file. No commit, no push, no folder moves. All commands ran from
the execution worktree root (Go and Node invoked directly; same toolchain
and pinned `node_modules` the `hippo`/`nx` wrappers use).

## Gherkin first

Created `specs/apps/ayokoding/cli/behaviours/examples/markdown-file-sync.feature`
from `prd.md` with the exemption comments above the tags.

RED (static coverage, before the reason fix):

```text
specs/apps/ayokoding/cli/behaviours/examples/markdown-file-sync.feature:15: an exemption reason must describe a genuine boundary mismatch.
specs/apps/ayokoding/cli/behaviours/examples/markdown-file-sync.feature:22: an exemption reason must describe a genuine boundary mismatch.
specs/apps/ayokoding/cli/behaviours/examples/markdown-file-sync.feature:29: an exemption reason must describe a genuine boundary mismatch.
specs/apps/ayokoding/cli/behaviours/examples/markdown-file-sync.feature:36: an exemption reason must describe a genuine boundary mismatch.
specs/apps/ayokoding/cli/behaviours/examples/markdown-file-sync.feature:43: an exemption reason must describe a genuine boundary mismatch.
specs/apps/ayokoding/cli/behaviours/examples/markdown-file-sync.feature:50: an exemption reason must describe a genuine boundary mismatch.
```

Root cause: the `prd.md` reason `sync compares files and starts no
container` names no word the coverage gate accepts as a boundary
(`BOUNDARY_REASON` in `scripts/behaviour-coverage.mjs`). The sibling
layout features pass only because their reason contains the word
`layout`. Fix, kept in the feature file only: `sync compares files on
the local filesystem and starts no container`. `prd.md` itself is outside
this agent's file set and keeps the original wording; root may align it.

GREEN (static coverage, all adapters):

```text
unit EXIT:0 ayokoding-cli: 6 features, 32 expanded scenarios, adapters: unit.
integration EXIT:0 ayokoding-cli: 6 features, 32 expanded scenarios, adapters: integration.
e2e EXIT:0 ayokoding-cli: 6 features, 32 expanded scenarios, adapters: e2e.
behaviour EXIT:0 ayokoding-cli: 6 features, 32 expanded scenarios, adapters: unit, integration, e2e.
```

Note: the plan expected `CLI-BEHAVIOUR` to fail naming the eight
scenarios as unbound. It does not: the existing `^(.*)$` godog
dispatchers already match every new step statically. The honest RED for
the new corpus therefore surfaces at godog runtime (unknown steps, then
the unwired command) instead of in the static check.

RED (godog runtime, feature added, no bindings yet — excerpt):

```text
step assertion failed: unknown given step "a lesson block anchored to \"learning/code/ex-01-hello/example.py\" with the same bytes as the file"
```

All eight sync scenarios failed this way; the 24 pre-existing scenarios
passed.

## AC-4.1 — Anchor grammar (`internal/domain/anchors`)

RED (`go test -count=1 ./internal/domain/anchors/...` against stub
functions returning zero values — every failure an assertion, never a
build error): all `TestParseLine*`, `TestSelect/*`, and
`TestNextNonBlank` failed, e.g. `ParseLine rejected a path label anchor`.

GREEN (parser implemented with the two expressions from `tech-docs/003`):

```text
ok  github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/domain/anchors  1.020s
```

With `-race`: `ok ... 1.020s`. Covers both anchor forms, valid /
reversed / outside / zero-based / malformed ranges, punctuated labels
with an optional trailing colon, lookalike rejections (bold without a
code span, code span without bold), and the next-non-blank-line rule.

## AC-4.2 / AC-4.3 — Sync check and rewrite (`internal/adapters/content/sync.go`)

RED (`go test -count=1 ./internal/adapters/content/...` against stubs):
every `TestCheck*` and `TestRewriteLesson/*` case plus both
`TestWriteUpdates*` cases failed on assertions, e.g.
`codes=[], want exactly one ayokoding.sync.unanchored-fence` and
`changed=false, want a repair`.

GREEN (after implementation, plus the fence-pairing fix below):

```text
ok  github.com/wahidyankf/ose-public/apps/ayokoding-cli/internal/adapters/content  1.018s
```

With `-race`: `ok ... 1.031s`. One real bug found by the tests during
GREEN: closers re-parsed as openers (every anchored fence double
reported as unanchored). Fixed in `findFences` by resuming past the
closing line.

Strict gates on the new code:

- `golangci-lint run ./internal/domain/anchors/... ./internal/adapters/content/...`:
  first run reported 21 issues; after fixes: `0 issues.` Full-module
  `golangci-lint run ./...`: `0 issues.`
- `nilaway ... ./...`: three rounds (test indexing, slice flows,
  `compare()` nil return). All closed by returning non-nil finding
  slices and stating entry nil guards. Final: exit 0, no output.
- `go vet ./tests/bdd/` clean after correcting the godog
  `AfterScenarioHook` signature to `(context.Context, *Scenario, error)
(context.Context, error)`.
- `go build ./...` and `go test -count=1 -run '^$' ./...`: exit 0.

## Fixtures

- `tests/testdata/courses/green-python`: two units (`ex-01-hello`,
  `ex-02-range`) with valid `run.yaml` files, expected-output files, and
  two lessons (plain anchor plus `**Output**` anchor; `#L3-L5` range
  anchor). Probe result: **0 findings**.
- `tests/testdata/courses/broken-sync`: units `ex-01-hello`,
  `ex-05-sets` (unreferenced), `ex-06-crlf` (CRLF target, bytes verified
  with `od -c`; no `.gitattributes` and `core.autocrlf` unset, so the
  bytes survive checkout), and one lesson with one instance of each
  finding. Probe result: **9 findings**, one per code, in line order:

```text
ayokoding.sync.mismatch learning/lessons/sync.md:3: fence body line 3 differs
ayokoding.sync.missing-file learning/lessons/sync.md:11
ayokoding.sync.bad-range learning/lessons/sync.md:17
ayokoding.sync.anchor-without-fence learning/lessons/sync.md:25
ayokoding.sync.indented-fence learning/lessons/sync.md:29
ayokoding.sync.unanchored-fence learning/lessons/sync.md:37
ayokoding.sync.unanchored-output learning/lessons/sync.md:49
ayokoding.sync.crlf learning/lessons/sync.md:53
ayokoding.sync.unreferenced-unit learning/code/ex-05-sets:0
```

(The probe was a temporary `_test.go` file, executed, then deleted; it
is not part of the deliverable.)

## AC-4.5 — Bindings, and the ownership boundary

Added Given/When/Then bindings for all eight scenarios in
`tests/bdd/steps_test.go` (additive hunks only: three one-line
delegations, one struct field, one import, one `After` hook for temp-dir
cleanup, and new `*Sync*` helpers). Read-only scenarios use the
committed fixtures; the `unanchored-fence` (exactly-one) and `--write`
scenarios copy `green-python` to a temp dir so committed fixtures are
never written.

RED (honest, against the current stub — every new scenario fails only here):

```text
step assertion failed: status=2, want 0 (stdout="" stderr="Error: ayokoding.usage.not-implemented: command ayokoding-cli examples sync is not implemented yet\n...")
```

Failed-scenario list from the suite: exactly the eight
`markdown-file-sync.feature` scenarios. All 24 pre-existing scenarios
still pass — no regressions.

The failure is **not fixable inside this agent's file set**: wiring
`examples sync` means editing `internal/adapters/cli/root.go` (replace
`notImplemented` with a `runSync` that renders findings and returns
status 1 on findings / 0 when clean) and adding an `application.Sync`
use case, both outside the owned paths. Per the hard boundary the change
was not made; the handoff recipe for root is:

1. Optional: relocate the nine `Code*` constants from
   `internal/adapters/content/sync.go` into `internal/domain/finding`
   (values unchanged; the content package keeps working either way).
2. Add `application.Sync(req)` mirroring `application.Validate`, but
   over `content.Check(course, sub)` per selected course. `sync` needs
   no catalog. Selection flags mirror validate (`--course`,
   `--include-inert`); `--write` fans out per lesson via
   `content.RewriteLesson` plus `content.WriteUpdates(courseDir,
updates)`, then re-checks for the exit status (0 when no finding
   remains, 1 otherwise).
3. Add `runSync` in `internal/adapters/cli` mirroring `runValidate`
   (flags `--course`, `--include-inert`, `--write`; findings render
   through the existing `renderFindings`; findings yield `statusError{1}`).
4. Re-run: `BDD unit`, `CLI-INTEGRATION`, `CLI-E2E`, `CLI-BEHAVIOUR`
   (all four coverage adapters already pass statically).

`COVERAGE_MINIMUM=99 ./scripts/coverage-gate.sh` currently exits 1 only
at `tests/bdd` (`TestContract`: the eight sync scenarios); architecture,
coverage-helper, and every unit package pass.

## AC-4.4 — Formatter symmetry (D21)

RED (two new cases in `scripts/format-staged.test.mjs`): the lesson case
failed, proving Prettier rewrites the fence:

````text
+ '# Lesson\n\n```ts\nconst greeting = "hello";\nconsole.log(greeting);\n```\n'
- '# Lesson\n\n```ts\nconst greeting="hello";\nconsole.log( greeting );\n```\n'
````

The `docs/` control passed before and after.

GREEN (split in `scripts/format-staged`: Markdown under
`apps/ayokoding-www/content/` goes through its own Prettier call with
`--embedded-language-formatting=off`; every other path formats as
before; two-line comment above the split names the reason):

```text
✔ leaves a ts fence in a lesson under apps/ayokoding-www/content byte-for-byte untouched
✔ still formats a ts fence in Markdown outside apps/ayokoding-www/content
ℹ pass 20
ℹ fail 0
```

Full script gate (`format-staged`, `workflow-language-lanes`,
`behaviour-coverage`): `ℹ pass 128`, `ℹ fail 0`. `bash -n` clean. The
file keeps its existing two-space shell style (stock `shfmt` would
re-indent the whole file to tabs, so it was intentionally not applied).

## Judgment calls (for root review)

- Finding order in `Check`: lesson order (lexical), then line, then
  code; `application` re-sorts globally anyway.
- Check order per anchored fence: malformed range, reversed range,
  missing file, CRLF, range bounds, output-file rule, body bytes. One
  finding per fence.
- CRLF targets report `crlf` with no body comparison, and `--write`
  skips them (a CRLF file must first be converted to LF).
- `**Output*` labels use a prefix rule, so `**Output:** (...)` also
  counts as an output block; an output anchor must target a `.txt` file
  below an `expected/` folder.
- An anchor followed by an indented fence reports `indented-fence`
  (the fence is attached, not missing).
- `RewriteLesson` rewrites anchored indented fences' bodies too but
  never de-indents; unclosed fences get body repairs without a
  synthesized closer; `WriteUpdates` refuses to create files and
  enforces mode 0644 (hence one reasoned `//nolint:gosec`).
- The three code roots are duplicated from `layout` (untouchable here);
  the merge may export one shared source.
- `steps_test.go` hunks are purely additive except the `w` → `scenario`
  rename in `registerSteps` (required by `varnamelen` once the `After`
  hook lengthened the scope) — flagged for Agent A merge awareness.
- `.golangci.yml` exclusion rules already name Agent A files
  (`internal/application/run.go`, `internal/adapters/runtime/lease.go`,
  `internal/adapters/tui/model.go`); untouched.

## Files changed by this agent

Created: `apps/ayokoding-cli/internal/domain/anchors/anchors.go`,
`apps/ayokoding-cli/internal/domain/anchors/anchors_test.go`,
`apps/ayokoding-cli/internal/adapters/content/sync.go`,
`apps/ayokoding-cli/internal/adapters/content/sync_test.go`,
`specs/apps/ayokoding/cli/behaviours/examples/markdown-file-sync.feature`,
fixture courses `apps/ayokoding-cli/tests/testdata/courses/green-python/**`
(8 files) and `.../broken-sync/**` (11 files, one CRLF), and this
evidence file. Edited: `apps/ayokoding-cli/tests/bdd/steps_test.go`
(sync bindings only), `scripts/format-staged`,
`scripts/format-staged.test.mjs`. Forbidden paths (`go.mod`/`go.sum`,
`project.json`, `repo-config.yml`, `toolchains/**`,
`containerplan/**`, `containers/**`, `toolchain-smoke/**`, everything
else) untouched — `git diff --name-only` shows no other tracked edit of
mine.

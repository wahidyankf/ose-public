# Phase 1 Skeleton — Evidence

Worktree `worktrees/ayokoding-learn-revamp-05-code-harness/`, branch
`ayokoding-learn-revamp-05-code-harness`. All paths below are repository-relative.
Tool note: the plan's `rtk ./hippo run` wrappers admit through HIPPO; this
sandbox runs the same commands directly (`go` with cwd `apps/ayokoding-cli`,
`npm exec nx --` from the worktree root). Go toolchain `go1.27.2`; the module
pins `go 1.26.1` with no `toolchain` directive, so the local toolchain applies.

## AC-1.1 — Module, pinned tools, and the strict linter bite

`GO-MOD` (`go mod tidy`, cwd `apps/ayokoding-cli`): exit 0, `go.sum` written
(998 lines). Selections: `cobra v1.10.2`, `godog v0.16.0`, `messages/go/v34
v34.2.0`, `golangci-lint/v2 v2.13.2`, `nilaway
v0.0.0-20260918162853-acb8859b9031`, `x/tools v0.50.0`, `x/vuln v1.7.0`,
`gofumpt v0.11.0`, `sh/v3 v3.14.0`.

Deviation (recorded, root-caused): `go.yaml.in/yaml/v3` resolves to `v3.0.5`,
not the `v3.0.4` the plan pins. `golangci-lint/v2 v2.13.2` — itself pinned by
the plan — requires `yaml >= v3.0.5`, so module version selection always
rounds an explicit `v3.0.4` require up to `v3.0.5`; the file cannot stably say
`v3.0.4`. HIPPO's live `go.mod` already carries `v3.0.5`. The maintained-fork
requirement (D5) still holds.

Note: `go mod tidy` drops the `godog`/`messages` requires until a source file
imports them; they return permanently with the BDD suite in AC-1.6.

Toolchain pin: added `toolchain go1.26.9` to `apps/ayokoding-cli/go.mod`
(matching HIPPO's `go.mod`), so builds pin the toolchain instead of floating
on the local one. Re-ran `GO-MOD` (exit 0, directive kept by tidy) and
`CLI-QUICK` (exit 0, `Successfully ran target test:quick`).

### RED — probe must fail naming revive, nolintlint, err113

Probe `apps/ayokoding-cli/internal/domain/finding/probe.go`:

```go
package finding

import "errors"

func Probe() error {
	//nolint
	return errors.New("probe")
}
```

`CLI-LINT` (`npm exec nx -- run ayokoding-cli:lint`) output (expected failure,
exit 1):

```text
internal/domain/finding/probe.go:12:9: do not define dynamic errors, use wrapped static errors instead: "errors.New(\"probe \" + detail)" (err113)
internal/domain/finding/probe.go:8:2: directive `//nolint` should mention specific linter such as `//nolint:my-linter` (nolintlint)
internal/domain/finding/probe.go:1:1: package-comments: should have a package comment (revive)
internal/domain/finding/probe.go:7:1: exported: exported function Probe should have comment or be unexported (revive)
4 issues:
* err113: 1
* nolintlint: 1
* revive: 2
```

Note: the first probe draft with a static `errors.New("probe")` did not trip
`err113` (a constant message is not a dynamic error); the probe grew a dynamic
`errors.New("probe " + detail)` return, which is the case the AC names.

### GREEN — probe deleted, `main.go` + minimal `bootstrap`, lint exit 0

`CLI-LINT` after deleting `internal/domain/finding/probe.go` and adding
`cmd/ayokoding-cli/main.go` (one `bootstrap.Main` call) plus a documented
minimal `internal/bootstrap`: exit 0, `0 issues`.

### REFACTOR — disable list already alphabetical with single-line reasons, exit 0

The `.golangci.yml` disable list was written alphabetical
(`exhaustruct`, `funcorder`, `gochecknoglobals`, `gomodguard`, `lll`, `mnd`,
`nlreturn`, `noinlineerr`, `paralleltest`, `tagliatelle`, `wsl`, `wsl_v5`)
with one single-line reason each naming this tool's situation. Uncached
`CLI-LINT` (`--skip-nx-cache`): exit 0.

## AC-1.2 — Architecture tests guard the production graph

RED (`GO-TEST ./tests/architecture`, exit 1): the test and the three
`tests/architecture/testdata/*.go.txt` fixtures were written before the rule
table existed (empty table), so each fixture reported no violation:

```text
--- FAIL: TestNegativeFixturesAreReported/domain_importing_os/exec
    imports_test.go:39: fixture domain-osexec.go.txt reported no violation
--- FAIL: TestNegativeFixturesAreReported/domain_importing_cobra
    imports_test.go:39: fixture domain-cobra.go.txt reported no violation
--- FAIL: TestNegativeFixturesAreReported/application_importing_internal/bootstrap
    imports_test.go:39: fixture application-bootstrap.go.txt reported no violation
```

GREEN: the five-rule table (`domain-purity`, `cobra-scope`, `exec-scope`,
`yaml-scope`, `bootstrap-wiring`) plus the walker; rerun exit 0 — every
negative fixture reported, the real tree clean.

REFACTOR: each rule carries a one-line reason included in its failure
message, asserted by the test; rerun exit 0.

## AC-1.3 — Gherkin first: the CLI-contract corpus

Created `specs/apps/ayokoding/cli/README.md`,
`specs/apps/ayokoding/cli/architecture.md` (the three C4 views),
`behaviours/README.md`, `behaviours/cli-contract/README.md`, and
`behaviours/cli-contract/command-line-contract.feature` copied from prd.md
without the interrupt scenario, with its exemption comment and tag. Added
`apps/ayokoding-cli/behaviour-coverage.json` plus the
`test:coverage:{unit,integration,e2e,behaviour}` and `test:coverage` targets
(the aggregate lists four sequential `nx run` commands with `parallel: false`,
since POSIX `sh` does not expand the `{a,b}` brace form the tech-docs sketch
uses).

`CLI-BEHAVIOUR` (exit 1) names exactly the eight scenarios as unbound for Unit
and Integration, and the seven E2E-bound ones for E2E (the internal-failure
scenario is `@e2e-exempt` with a valid exemption comment):

- unit: 8 unbound (all eight scenarios);
- integration: 8 unbound;
- e2e: 7 unbound (all but the internal failure).

## AC-1.4 — Help, version, bare invocation, usage errors, JSON error bodies

RED (`GO-TEST ./internal/adapters/cli/...`, exit 1): all five contract rows
plus the JSON body test failed against the stub `Execute` returning 0, e.g.
`status=0, want 2` and `stdout missing "examples"`.

GREEN: the Cobra tree with placeholder-free leaf commands (unbuilt leaves
return `ayokoding.usage.not-implemented`), the text/JSON error renderer, and
the version string `ayokoding-cli <version> (commit <commit>, catalog
<hash>)`. Rerun exit 0.

REFACTOR: the status table moved into `internal/domain/finding` as
`Statuses()`; help text reads the same source as the exit mapping. Rerun
exit 0.

## AC-1.5 — Exit mapping, panic recovery, colour, interrupt, closed pipe

RED (`GO-TEST ./internal/... ./tests/integration/...`, exit 1), all
assertion failures, no build errors:

- `TestExitCode`: env rows map to 2 instead of 124-127, signal rows to 2
  instead of 130/143, pipe to 2 instead of 141, cancel to 2 instead of 130;
- `TestResolveColor`: `always` and bare `auto` return false;
- fault tests: panic unrecovered path, hang returns 2, spam returns 2,
  failing-run returns 2 with empty stdout;
- `TestInterruptExits130`: blocked check never started (EOF);
- `TestClosedStdoutExits141`: exit 0 (stub `bootstrap.Main`) instead of 141.

GREEN: full `ExitCode` (0/1/2, 124-127, 128+N, 130, 141), `ResolveColor`,
`PipeError`/`SignalError`, the `AYOKODING_FAULT` seam (panic, hang, spam,
failing-run), top-level recover in `Execute`, `signal.NotifyContext`
handling with cleanup hook in `bootstrap.Main`, SIGPIPE notify mapping to
141, and the colour renderer. Rerun exit 0, including both signal integration
tests against the real binary. One fix round: text errors now name the error
code (`Error: <code>: <message>`), which the panic scenario requires.

REFACTOR: `main.go` stays one `bootstrap.Main` call (verified by read).
Linter fallout fixed in the same step: `errors.AsType`, `intrange`,
`CommandContext`, external test packages, wrapped Write errors.

## AC-1.6 — Coverage gate, the full target set, and repository registration

RED 1 (`CLI-UNIT`, exit 1): with a temporary untested exported function in
`internal/domain/finding`, the gate printed
`selected production line coverage: 84.00% (21/25 statements)` and failed the
99% floor.

RED 2 (`CLI-UNIT`, exit 1): with `t.Skip()` added to one test, the
skipped-test guard failed before the gate ran:

```text
internal/domain/finding/finding_test.go:71:
        t.Skip("RED probe: the skipped-test guard must fail")
test:unit forbids skipped tests
```

GREEN: both probes removed; the remaining targets added (`install`,
`build`, `run`, `test:integration`, `test:e2e`, `test:quick`, `deps:audit`,
`compat:min-version`); `.gitignore` holds `dist/` and `coverage/`.
`CLI-UNIT` and `CLI-QUICK` exit 0 at
`selected production line coverage: 100.00% (24/24 statements)` (three
`Error()` methods gained direct unit tests for the floor).

Bind the scenarios: the godog suite (`Strict: true`), one `Driver`
interface, and three drivers (unit in-process; integration freshly built
binary with temp dirs; e2e `AYOKODING_BIN`). `BDD unit`, `CLI-INTEGRATION`,
`CLI-E2E`, and `CLI-BEHAVIOUR` all exit 0 — 1 feature, 8 expanded scenarios
in every adapter view (e2e: 7 bound, 1 validly exempt).

Registration: `ayokoding-cli: {path: apps/ayokoding-cli, kind: app, stacks:
[golang]}` under `extensions.software-development.projects`,
`apps/ayokoding-cli/README.md` added to the heading-hierarchy surface, and a
stub-free README with the help excerpt, commands, and targets (plus
CHANGELOG, CONTRIBUTING, and the local CLI-conformance corpus copy with the
four row-32 capabilities). `ENV-VALIDATE` exits 0 with no findings: the Go
reads (`NO_COLOR`, `AYOKODING_FAULT`) need no declaration under the
TypeScript-detector contract.

Notes: `go mod tidy` drops the `godog`/`messages` requires until a source
file imports them; they are direct requires in the final tree. The
`test:coverage` aggregate lists four sequential `nx run` commands instead of
the brace form, which POSIX `sh` does not expand.

## Phase 1 Gate

Fresh `--skip-nx-cache` runs after all Phase 1 changes:

- `CLI-QUICK` (lint, NilAway, typecheck, unit with `-race`, 100% floor,
  static coverage): exit 0.
- `CLI-INTEGRATION` (BDD integration adapter plus signal integration tests):
  exit 0, eight CLI-contract scenarios.
- `CLI-E2E` (stamped build `v0.0.0-test`, 40-zero commit, real Docker
  available): exit 0, eight CLI-contract scenarios (seven bound, one
  validly exempt).
- `ENV-VALIDATE`: exit 0, 20 files, no findings.
- `LINT-MD`: exit 0, 7698 files, 0 errors.
- `git status --short`: only `apps/ayokoding-cli/**`,
  `specs/apps/ayokoding/cli/**`, `repo-config.yml`, and `<plan>/` paths that
  this phase owns, plus the coordinator's pre-existing plan-promotion moves.
  No commit, push, folder move, or plans 06-14 contact.

Sanity (not gate): `build`, `install`, `compat:min-version` exit 0.

Deviations recorded above: `yaml v3.0.5` (tool constraint from pinned
`golangci-lint v2.13.2`), four-command `test:coverage` aggregate (POSIX sh),
transitive tool deps aligned down to HIPPO's known-good versions where the
proxy had floated them.
